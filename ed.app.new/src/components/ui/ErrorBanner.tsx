import { AlertCircle, RefreshCw, X, Info, AlertTriangle } from 'lucide-react';
import { classifyError } from '../../lib/api/errorHandling';

/**
 * Get a user-friendly error message from an error object or string.
 */
function getUserFriendlyError(error: unknown): string {
  const apiError = classifyError(error);
  return apiError.message;
}

/**
 * Determine the severity of an error for UI display.
 */
function getErrorSeverity(error: unknown): 'info' | 'warning' | 'error' | 'critical' {
  const apiError = classifyError(error);
  return apiError.severity;
}

/**
 * Check if an error is retryable.
 */
function isRetryableError(error: unknown): boolean {
  const apiError = classifyError(error);
  return apiError.retryable;
}

export interface ErrorBannerProps {
  /** The error to display (Error object, string, or null) */
  error: unknown;
  /** Callback when user clicks retry */
  onRetry?: () => void;
  /** Callback when user dismisses the error */
  onDismiss?: () => void;
  /** Optional title override */
  title?: string;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Error banner component with user-friendly messages and retry button.
 * Automatically determines severity, icon, and whether to show retry.
 *
 * @example
 * ```tsx
 * <ErrorBanner
 *   error={error}
 *   onRetry={handleRetry}
 *   onDismiss={() => setError(null)}
 * />
 * ```
 */
export function ErrorBanner({
  error,
  onRetry,
  onDismiss,
  title,
  className = '',
}: ErrorBannerProps) {
  if (!error) return null;

  const message = getUserFriendlyError(error);
  const severity = getErrorSeverity(error);
  const canRetry = isRetryableError(error) && !!onRetry;

  const severityConfig = {
    info: {
      icon: Info,
      bg: 'rgba(94, 196, 168, 0.1)',
      border: 'rgba(94, 196, 168, 0.4)',
      text: '#5ec4a8',
      iconColor: '#5ec4a8',
      defaultTitle: 'Please wait',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'rgba(255, 193, 7, 0.1)',
      border: 'rgba(255, 193, 7, 0.4)',
      text: '#ffc107',
      iconColor: '#ffc107',
      defaultTitle: 'Rate limited',
    },
    error: {
      icon: AlertCircle,
      bg: 'rgba(232, 143, 160, 0.1)',
      border: 'rgba(232, 143, 160, 0.4)',
      text: '#e88fa0',
      iconColor: '#e88fa0',
      defaultTitle: 'Something went wrong',
    },
    critical: {
      icon: AlertCircle,
      bg: 'rgba(200, 50, 80, 0.15)',
      border: 'rgba(200, 50, 80, 0.5)',
      text: '#c83250',
      iconColor: '#c83250',
      defaultTitle: 'Service unavailable',
    },
  };

  const config = severityConfig[severity];
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '12px',
        border: `1px solid ${config.border}`,
        background: config.bg,
        fontSize: '0.8rem',
        lineHeight: 1.5,
      }}
      role="alert"
      aria-live="polite"
    >
      <Icon size={18} color={config.iconColor} style={{ flexShrink: 0, marginTop: '1px' }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: config.text, marginBottom: '2px' }}>
          {displayTitle}
        </div>
        <div style={{ color: '#9b96b0' }}>{message}</div>

        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '10px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: `1px solid ${config.border}`,
              background: 'transparent',
              color: config.text,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 180ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = config.border;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <RefreshCw size={13} />
            Try Again
          </button>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#9b96b0',
            cursor: 'pointer',
            padding: '2px',
            flexShrink: 0,
            transition: 'color 180ms ease-out',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = config.text; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#9b96b0'; }}
          aria-label="Dismiss error"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

/**
 * Inline error message for forms and compact spaces.
 * Simpler than ErrorBanner — just text + optional retry link.
 *
 * @example
 * ```tsx
 * <InlineError error={error} onRetry={handleRetry} />
 * ```
 */
export function InlineError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  if (!error) return null;

  const message = getUserFriendlyError(error);
  const canRetry = isRetryableError(error) && !!onRetry;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e88fa0', fontSize: '0.75rem' }}>
      <AlertCircle size={14} />
      <span>{message}</span>
      {canRetry && onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: 'none',
            border: 'none',
            color: '#5ec4a8',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
