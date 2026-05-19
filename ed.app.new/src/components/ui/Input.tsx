import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Styled input with label and error state support.
 *
 * @example
 * <Input label="Dream Title" error={errors.title} placeholder="Enter title..." />
 */
export function Input({ label, error, className = '', style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-body, #4a4860)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {label}
        </label>
      )}
      <input
        style={{
          background: 'var(--bg-cream, #fffefb)',
          border: `1px solid ${error ? '#e88fa0' : 'var(--glass-border, rgba(168,237,220,0.22))'}`,
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '0.875rem',
          color: 'var(--text-body, #4a4860)',
          fontFamily: "'Inter', system-ui, sans-serif",
          outline: 'none',
          transition: 'border-color 180ms ease-out',
          ...style,
        }}
        onFocus={(e) => e.target.style.borderColor = '#5ec4a8'}
        onBlur={(e) => e.target.style.borderColor = error ? '#e88fa0' : 'var(--glass-border, rgba(168,237,220,0.22))'}
        className={className}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '0.7rem', color: '#e88fa0' }}>{error}</span>
      )}
    </div>
  );
}

/**
 * Styled textarea component with label and error state.
 */
export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className = '', style, ...props }: TextAreaProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-body, #4a4860)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {label}
        </label>
      )}
      <textarea
        style={{
          background: 'var(--bg-cream, #fffefb)',
          border: `1px solid ${error ? '#e88fa0' : 'var(--glass-border, rgba(168,237,220,0.22))'}`,
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '0.875rem',
          color: 'var(--text-body, #4a4860)',
          fontFamily: "'Inter', system-ui, sans-serif",
          outline: 'none',
          transition: 'border-color 180ms ease-out',
          resize: 'vertical',
          ...style,
        }}
        onFocus={(e) => e.target.style.borderColor = '#5ec4a8'}
        onBlur={(e) => e.target.style.borderColor = error ? '#e88fa0' : 'var(--glass-border, rgba(168,237,220,0.22))'}
        className={className}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '0.7rem', color: '#e88fa0' }}>{error}</span>
      )}
    </div>
  );
}
