import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, FileText, Loader2, RotateCcw, Copy, CheckCircle } from 'lucide-react';

const LANGUAGE_NAMES = {
  ar: 'Arabisch', de: 'Deutsch', en: 'Englisch', tr: 'Türkisch',
  ru: 'Russisch', uk: 'Ukrainisch', fr: 'Französisch', fa: 'Persisch',
};

export default function DocumentScan() {
  const { t, i18n } = useTranslation();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [copied, setCopied] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setAnalysis(null);

    const formData = new FormData();
    formData.append('document', file);
    formData.append('language', LANGUAGE_NAMES[i18n.language] || 'Arabisch');

    try {
      const res = await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      setAnalysis(res.data.analysis);
      toast.success('✅ Dokument erfolgreich analysiert!');
    } catch (err) {
      toast.error(t('common.error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [i18n.language, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const copyAnalysis = () => {
    if (analysis) {
      navigator.clipboard.writeText(analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t('common.copied'));
    }
  };

  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
          <FileText size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-blue-900 mb-2">{t('documents.title')}</h1>
        <p className="text-gray-500">{t('documents.subtitle')}</p>
      </div>

      {!analysis && !loading && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload size={48} className={`mx-auto mb-4 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          <p className="text-gray-600 font-medium text-lg mb-2">{t('documents.dropzone')}</p>
          <p className="text-gray-400 text-sm">{t('documents.supported')}</p>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-blue-50">
          <Loader2 size={48} className="mx-auto mb-4 text-blue-500 animate-spin" />
          <p className="text-gray-600 font-medium text-lg">{t('documents.analyzing')}</p>
          <p className="text-gray-400 text-sm mt-2">{fileName}</p>
          <div className="mt-6 flex justify-center gap-1">
            <span className="w-2 h-2 bg-blue-400 rounded-full typing-dot" />
            <span className="w-2 h-2 bg-blue-400 rounded-full typing-dot" />
            <span className="w-2 h-2 bg-blue-400 rounded-full typing-dot" />
          </div>
        </div>
      )}

      {analysis && (
        <div className="fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle size={20} />
              <span>{t('documents.result')}</span>
              <span className="text-gray-400 text-sm">— {fileName}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyAnalysis}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              >
                <Copy size={14} />
                {copied ? t('common.copied') : t('common.copy')}
              </button>
              <button
                onClick={() => { setAnalysis(null); setFileName(''); }}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-all"
              >
                <RotateCcw size={14} />
                {t('documents.uploadAnother')}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100 whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
}
