import React from 'react';
import { Check, Loader2, Circle, AlertCircle } from 'lucide-react';

export interface PipelineStep {
  name: string;
  status: 'pending' | 'running' | 'done' | 'error' | 'skipped';
  message?: string;
}

interface PipelineProgressProps {
  steps: PipelineStep[];
  title?: string;
  className?: string;
}

/**
 * PipelineProgress — Visual progress indicator for the dream analysis pipeline.
 * Shows each step with its current status (pending, running, done, error, skipped).
 *
 * @example
 * <PipelineProgress
 *   steps={[
 *     { name: 'Transcription', status: 'done' },
 *     { name: 'Dream Analysis', status: 'running', message: 'Analyzing symbols...' },
 *     { name: 'Image Generation', status: 'pending' },
 *   ]}
 *   title="Processing your dream..."
 * />
 */
export default function PipelineProgress({ steps, title, className = '' }: PipelineProgressProps) {
  const completedCount = steps.filter(s => s.status === 'done' || s.status === 'skipped').length;
  const totalCount = steps.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const hasError = steps.some(s => s.status === 'error');

  return (
    <div className={`rounded-2xl border border-line bg-cream p-5 shadow-paper ${className}`}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <span className="text-xs text-muted font-medium">{progressPercent}%</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full h-2 bg-parchment rounded-full mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            hasError ? 'bg-rose-400' : 'bg-sage'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.name} className="flex items-center gap-3">
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {step.status === 'done' && (
                <div className="w-6 h-6 rounded-full bg-sage/15 flex items-center justify-center">
                  <Check size={14} className="text-sage" strokeWidth={2.5} />
                </div>
              )}
              {step.status === 'running' && (
                <div className="w-6 h-6 rounded-full bg-dusk/10 flex items-center justify-center">
                  <Loader2 size={14} className="text-dusk animate-spin" />
                </div>
              )}
              {step.status === 'pending' && (
                <div className="w-6 h-6 rounded-full border-2 border-line flex items-center justify-center">
                  <Circle size={10} className="text-muted/40" />
                </div>
              )}
              {step.status === 'error' && (
                <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                  <AlertCircle size={14} className="text-rose-500" />
                </div>
              )}
              {step.status === 'skipped' && (
                <div className="w-6 h-6 rounded-full border-2 border-dashed border-line flex items-center justify-center">
                  <span className="text-[8px] text-muted">—</span>
                </div>
              )}
            </div>

            {/* Step Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  step.status === 'done' ? 'text-ink' :
                  step.status === 'running' ? 'text-duskDeep' :
                  step.status === 'error' ? 'text-rose-600' :
                  'text-muted'
                }`}>
                  {step.name}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted font-medium">
                  {step.status === 'done' ? 'Complete' :
                   step.status === 'running' ? 'In progress' :
                   step.status === 'error' ? 'Failed' :
                   step.status === 'skipped' ? 'Skipped' :
                   'Waiting'}
                </span>
              </div>
              {step.message && step.status === 'running' && (
                <p className="text-xs text-muted mt-0.5 truncate">{step.message}</p>
              )}
              {step.message && step.status === 'error' && (
                <p className="text-xs text-rose-500 mt-0.5">{step.message}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
