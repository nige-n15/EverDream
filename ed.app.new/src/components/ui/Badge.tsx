import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Category/mood badge with semantic color variants.
 *
 * @example
 * <Badge variant="success">Lucid</Badge>
 * <Badge variant="error">Nightmare</Badge>
 */
export function Badge({ children, variant = 'default', className = '', style }: BadgeProps) {
  const colors: Record<string, { bg: string; text: string }> = {
    default: { bg: 'rgba(168,237,220,0.15)', text: '#5ec4a8' },
    success: { bg: 'rgba(94,196,168,0.15)', text: '#5ec4a8' },
    warning: { bg: 'rgba(255,216,168,0.15)', text: '#c49a42' },
    error:   { bg: 'rgba(232,143,160,0.15)', text: '#e88fa0' },
    info:    { bg: 'rgba(200,184,255,0.15)', text: '#9b8fd4' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '0.65rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        background: colors[variant].bg,
        color: colors[variant].text,
        ...style,
      }}
      className={className}
    >
      {children}
    </span>
  );
}
