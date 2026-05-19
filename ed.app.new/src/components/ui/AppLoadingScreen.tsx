import React from 'react';
import { Spinner } from '../ui';

export interface AppLoadingScreenProps {
  message?: string;
  progress?: number;
}

/**
 * AppLoadingScreen — Full-screen loading state shown during app initialization.
 *
 * @example
 * {isLoading && <AppLoadingScreen message="Loading your dreams..." progress={60} />}
 */
export default function AppLoadingScreen({ message = 'Loading...', progress }: AppLoadingScreenProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8f6ff 0%, #edfbf6 50%, #f0edff 100%)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Logo / Brand */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
      }}>
        {/* Animated Dream Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #5ec4a8, #9b8fd4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(94,196,168,0.25)',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            <path d="M12 3v9" />
            <path d="M12 12 8 8" />
          </svg>
        </div>

        {/* App Name */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '2rem',
            color: '#1a1a2e',
            margin: '0 0 4px 0',
            letterSpacing: '-0.02em',
          }}>
            EverDream
          </h1>
          <p style={{
            fontSize: '0.75rem',
            color: '#9b96b0',
            margin: 0,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Dream Journal
          </p>
        </div>

        {/* Spinner */}
        <Spinner size={32} color="#5ec4a8" />

        {/* Message */}
        <p style={{
          fontSize: '0.85rem',
          color: '#9b96b0',
          margin: 0,
        }}>
          {message}
        </p>

        {/* Progress Bar */}
        {progress !== undefined && (
          <div style={{
            width: '200px',
            height: '4px',
            borderRadius: '2px',
            background: 'rgba(168,237,220,0.2)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, progress))}%`,
              borderRadius: '2px',
              background: 'linear-gradient(90deg, #5ec4a8, #9b8fd4)',
              transition: 'width 300ms ease-out',
            }} />
          </div>
        )}
      </div>

      {/* Global keyframes for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 12px 32px rgba(94,196,168,0.25); }
          50% { transform: scale(1.05); box-shadow: 0 16px 40px rgba(94,196,168,0.35); }
        }
      `}</style>
    </div>
  );
}
