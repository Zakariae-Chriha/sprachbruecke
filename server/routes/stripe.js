const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const User = require('../models/User');

function getStripe() {
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// GET /api/stripe/status — current user subscription info
router.get('/status', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('subscriptionStatus callsThisMonth callsResetDate freeCallsLimit stripeSubscriptionId role');
    if (!user) return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    res.json({
      subscriptionStatus: user.subscriptionStatus,
      callsThisMonth: user.callsThisMonth,
      callsResetDate: user.callsResetDate,
      freeCallsLimit: user.freeCallsLimit,
      isPremium: user.subscriptionStatus === 'active' || user.role === 'admin',
      callsRemaining: user.role === 'admin' || user.subscriptionStatus === 'active'
        ? null
        : Math.max(0, (user.freeCallsLimit ?? 3) - user.callsThisMonth),
    });
  } catch (err) {
    res.status(500).json({ message: 'Serverfehler', error: err.message });
  }
});

// POST /api/stripe/create-checkout — create Stripe Checkout session
router.post('/create-checkout', requireAuth, async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ message: 'Stripe nicht konfiguriert.' });
  }
  try {
    const stripe = getStripe();
    const user = await User.findById(req.userId).select('email stripeCustomerId name');
    if (!user) return res.status(404).json({ message: 'Benutzer nicht gefunden' });

    // Create or reuse Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: req.userId },
      });
      customerId = customer.id;
      await user.updateOne({ stripeCustomerId: customerId });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      success_url: `${clientUrl}/upgrade/success`,
      cancel_url: `${clientUrl}/upgrade/cancel`,
      metadata: { userId: req.userId },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe Checkout Fehler:', err.message);
    res.status(500).json({ message: 'Stripe Fehler', error: err.message });
  }
});

// POST /api/stripe/portal — customer portal to manage subscription
router.post('/portal', requireAuth, async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ message: 'Stripe nicht konfiguriert.' });
  }
  try {
    const stripe = getStripe();
    const user = await User.findById(req.userId).select('stripeCustomerId');
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ message: 'Kein Stripe-Konto gefunden.' });
    }
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${clientUrl}/autocall`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: 'Stripe Fehler', error: err.message });
  }
});

// POST /api/stripe/webhook — Stripe sends events here
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.sendStatus(200);
  }
  const stripe = getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook Signatur Fehler:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      const userId = session.metadata?.userId;
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          subscriptionStatus: 'active',
          stripeSubscriptionId: session.subscription,
        });
        console.log(`✅ Abo aktiviert für User ${userId}`);
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const user = await User.findOne({ stripeCustomerId: sub.customer });
      if (user) {
        await user.updateOne({
          subscriptionStatus: sub.status === 'active' ? 'active'
            : sub.status === 'past_due' ? 'past_due' : 'cancelled',
        });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const user = await User.findOne({ stripeCustomerId: sub.customer });
      if (user) {
        await user.updateOne({ subscriptionStatus: 'cancelled', stripeSubscriptionId: null });
        console.log(`🚫 Abo gekündigt für ${user.email}`);
      }
      break;
    }
    case 'invoice.payment_failed': {
      const inv = event.data.object;
      const user = await User.findOne({ stripeCustomerId: inv.customer });
      if (user) await user.updateOne({ subscriptionStatus: 'past_due' });
      break;
    }
  }

  res.sendStatus(200);
});

module.exports = router;
