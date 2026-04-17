import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FA' }}>
      <Navbar />
      <main className="md:pt-20 pt-16 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 py-5">
          {children}
        </div>
      </main>
    </div>
  );
}
