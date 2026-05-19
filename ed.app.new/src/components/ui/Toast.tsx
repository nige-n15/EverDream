import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

/**
 * Hook to access toast notification functions.
 *
 * @example
 * const { addToast } = useToast();
 * addToast({ type: 'success', message: 'Dream saved!' });
 */
export function useToast() {
  return useContext(ToastContext);
}

/**
 * Toast notification provider — wrap your app to enable toast notifications.
 *
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    if (toast.duration !== 0) {
      setTimeout(() => removeToast(id), toast.duration || 4000);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

/* ─── Toast Container ─── */

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '400px',
      }}
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/* ─── Individual Toast Item ─── */

const typeStyles: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: 'rgba(94,196,168,0.12)', border: '#5ec4a8', icon: '✓', text: '#4a9e86' },
  error:   { bg: 'rgba(232,143,160,0.12)', border: '#e88fa0', icon: '✕', text: '#c86070' },
  info:    { bg: 'rgba(200,184,255,0.12)', border: '#9b8fd4', icon: 'ℹ', text: '#7b6fb4' },
  warning: { bg: 'rgba(255,216,168,0.12)', border: '#c49a42', icon: '⚠', text: '#a07a30' },
};

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const styles = typeStyles[toast.type] || typeStyles.info;

  useEffect(() => {
    const timer = setTimeout(() => setIsExiting(true), (toast.duration || 4000) - 300);
    return () => clearTimeout(timer);
  }, [toast.duration]);

  return (
    <div
      onClick={() => onDismiss(toast.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${styles.border}33`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        fontSize: '0.8rem',
        color: '#4a4860',
        fontFamily: "'Inter', system-ui, sans-serif",
        transition: 'all 300ms ease-out',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
      }}
      role="alert"
    >
      <span style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: styles.bg,
        color: styles.text,
        fontSize: '0.65rem',
        fontWeight: 700,
        flexShrink: 0,
      }}>
        {styles.icon}
      </span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
    </div>
  );
}
