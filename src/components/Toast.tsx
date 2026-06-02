import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export default function Toasts({ toasts, removeToast }: ToastProps) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`flex items-center justify-between p-4 rounded-xl shadow-xl border backdrop-blur-md animate-slide-up transition-all duration-300 ${
              isSuccess
                ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/30'
                : isError
                ? 'bg-rose-950/90 text-rose-100 border-rose-500/30'
                : 'bg-zinc-900/95 text-zinc-100 border-zinc-700/50'
            }`}
          >
            <div className="flex items-center gap-3">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {isError && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}
              <span className="text-sm font-medium tracking-wide">{toast.text}</span>
            </div>
            <button
              id={`close-toast-${toast.id}`}
              onClick={() => removeToast(toast.id)}
              className="ml-4 p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
