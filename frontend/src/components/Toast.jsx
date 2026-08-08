import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '420px',
      width: '100%',
      pointerEvents: 'none'
    }}>
      {toasts.map(toast => {
        const bgColors = {
          success: 'rgba(6, 78, 59, 0.95)',
          error: 'rgba(127, 29, 29, 0.95)',
          warning: 'rgba(120, 53, 15, 0.95)',
          info: 'rgba(12, 74, 110, 0.95)'
        };
        const borderColors = {
          success: '#10b981',
          error: '#ef4444',
          warning: '#f59e0b',
          info: '#0284c7'
        };

        const Icon = {
          success: CheckCircle2,
          error: AlertCircle,
          warning: AlertTriangle,
          info: Info
        }[toast.type || 'info'];

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              backgroundColor: bgColors[toast.type || 'info'],
              borderLeft: `4px solid ${borderColors[toast.type || 'info']}`,
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              fontSize: '0.9rem',
              animation: 'slideDown 0.25s ease-out'
            }}
          >
            <Icon size={20} style={{ flexShrink: 0, marginTop: '2px', color: borderColors[toast.type || 'info'] }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {toast.title && <div style={{ fontWeight: 700, marginBottom: '2px' }}>{toast.title}</div>}
              <div style={{ color: '#e2e8f0', lineHeight: 1.4 }}>{toast.message}</div>
            </div>
            <button
              onClick={() => onClose(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
