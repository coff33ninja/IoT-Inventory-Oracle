
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ToastMessage, ToastType, ToastContextType } from '../types';

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000); // Auto-dismiss after 5 seconds
  };
  
  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[100] space-y-2">
        {toasts.map(toast => (
           <div key={toast.id} role="alert" className={`toast-entry relative flex items-center justify-between w-full max-w-sm p-4 rounded-lg shadow-lg text-white ${
                toast.type === 'success' ? 'bg-highlight' : 
                toast.type === 'error' ? 'bg-danger' : 'bg-accent'
            }`}>
                <span>{toast.message}</span>
                <button onClick={() => removeToast(toast.id)} className="ml-4 p-1 rounded-md hover:bg-white/20">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        ))}
      </div>
      <style>{`
        @keyframes toast-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .toast-entry {
          animation: toast-in 0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000);
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
