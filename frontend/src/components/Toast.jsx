import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Toast = () => {
  const { toast } = useAuth();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-teal-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
    info: <Info className="w-5 h-5 text-sky-400" />,
  };

  const bgStyles = {
    success: 'bg-slate-900 border-teal-500/30 text-white',
    error: 'bg-slate-900 border-rose-500/30 text-white',
    info: 'bg-slate-900 border-sky-500/30 text-white',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in max-w-md">
      <div
        className={`flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl backdrop-blur-md ${bgStyles[toast.type] || bgStyles.info}`}
        style={{
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {icons[toast.type] || icons.info}
        <span className="text-sm font-medium pr-2">{toast.message}</span>
      </div>
    </div>
  );
};

export default Toast;
