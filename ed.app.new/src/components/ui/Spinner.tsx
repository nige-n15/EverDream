import React from 'react';

export interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * Animated loading spinner.
 *
 * @example
 * <Spinner size={32} color="#5ec4a8" />
 */
export function Spinner({ size = 24, color = '#5ec4a8', className = '' }: SpinnerProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid ${color}33`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }}
      className={className}
      role="status"
      aria-label="Loading"
    />
  );
}

export interface LoadingOverlayProps {
  message?: string;
}

/**
 * Full loading overlay with spinner and message.
 *
 * @example
 * {isLoading && <LoadingOverlay message="Analyzing your dream..." />}
 */
export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '48px',
    }}>
      <Spinner size={32} />
      <span style={{
        fontSize: '0.8rem',
        color: 'var(--text-muted, #9b96b0)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        {message}
      </span>
    </div>
  );
}

/**
 * Skeleton loader for content placeholders.
 *
 * @example
 * <Skeleton lines={3} />
 */
export function Skeleton({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: i === lines - 1 ? '12px' : '16px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, rgba(168,237,220,0.1) 25%, rgba(168,237,220,0.2) 50%, rgba(168,237,220,0.1) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            width: i === lines - 1 ? '60%' : '100%',
          }}
        />
      ))}
    </div>
  );
}
