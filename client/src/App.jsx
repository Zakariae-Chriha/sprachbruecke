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

// RTL-Sprachen
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
      </Routes>
    </Layout>
  );
}
