import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Chat from './pages/Chat';
import DocumentScan from './pages/DocumentScan';
import CallHelper from './pages/CallHelper';
import Letters from './pages/Letters';
import AutoCall from './pages/AutoCall';
import Emergency from './pages/Emergency';
import Login from './pages/Login';
import Register from './pages/Register';
import Pending from './pages/Pending';
import Admin from './pages/Admin';
import UpgradeSuccess from './pages/UpgradeSuccess';
import UpgradeCancel from './pages/UpgradeCancel';
import History from './pages/History';

const RTL_LANGUAGES = ['ar', 'fa', 'ku', 'he', 'ur'];

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const isRTL = RTL_LANGUAGES.includes(i18n.language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/documents" element={<DocumentScan />} />
        <Route path="/calls" element={<CallHelper />} />
        <Route path="/letters" element={<Letters />} />
        <Route path="/autocall" element={<AutoCall />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pending" element={<Pending />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/upgrade/success" element={<UpgradeSuccess />} />
        <Route path="/upgrade/cancel" element={<UpgradeCancel />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Layout>
  );
}
