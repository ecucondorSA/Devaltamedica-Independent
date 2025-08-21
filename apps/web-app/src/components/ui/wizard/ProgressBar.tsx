'use client'

import React from 'react'
import { useWizard } from './Wizard'
import { cn } from '@altamedica/utils'

// Icons using design tokens
const CheckIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
)

export interface ProgressBarProps {
  showStepNames?: boolean
  showStepNumbers?: boolean
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

export function ProgressBar({ 
  showStepNames = true, 
  showStepNumbers = true,
  variant = 'default',
  className 
}: ProgressBarProps) {
  const { steps, currentStepIndex, currentStep } = useWizard()
  
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  if (variant === 'compact') {
    return (
      <div className={cn('progress-bar-compact', 'space-y-2', className)}>
        {/* Progress bar */}
        <div className="relative">
          <div className="overflow-hidden h-2 text-xs flex rounded-full bg-surface-secondary">
            <div 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Step indicator */}
        <div className="flex justify-between text-xs text-secondary">
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('progress-bar-detailed', 'space-y-4', className)}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-h5 text-primary font-semibold">
              {currentStep?.title}
            </h3>
            {currentStep?.description && (
              <p className="text-small text-secondary mt-1">
                {currentStep.description}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-small text-secondary">
              Step {currentStepIndex + 1} of {steps.length}
            </div>
            <div className="text-caption text-secondary">
              {Math.round(progress)}% Complete
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="overflow-hidden h-3 text-xs flex rounded-lg bg-surface-secondary">
            <div 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps list */}
        <div className="grid grid-cols-1 gap-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                index === currentStepIndex && 'bg-primary-50 text-primary-700',
                index < currentStepIndex && 'text-success-600',
                index > currentStepIndex && 'text-secondary'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                index === currentStepIndex && 'bg-primary-500 text-white',
                index < currentStepIndex && 'bg-success-500 text-white',
                index > currentStepIndex && 'bg-surface-secondary text-secondary'
              )}>
                {index < currentStepIndex ? <CheckIcon /> : index + 1}
              </div>
              <span className="font-medium">{step.name}</span>
              {step.isOptional && (
                <span className="text-xs text-secondary">(Optional)</span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn('progress-bar', 'space-y-4', className)}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-h6 text-primary font-semibold">
          {currentStep?.title}
        </h3>
        <span className="text-small text-secondary">
          Step {currentStepIndex + 1} of {steps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="overflow-hidden h-2 text-xs flex rounded-full bg-surface-secondary">
          <div 
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'flex items-center',
              index < steps.length - 1 && 'flex-1'
            )}
          >
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                  index < currentStepIndex
                    ? 'bg-success-500 text-white'
                    : index === currentStepIndex
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-secondary text-secondary'
                )}
              >
                {index < currentStepIndex ? (
                  <CheckIcon />
                ) : showStepNumbers ? (
                  index + 1
                ) : (
                  <ClockIcon />
                )}
              </div>
              
              {showStepNames && (
                <span className={cn(
                  'text-xs mt-2 text-center max-w-16 truncate',
                  index === currentStepIndex ? 'text-primary font-medium' : 'text-secondary'
                )}>
                  {step.name}
                </span>
              )}
            </div>
            
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 transition-all',
                  index < currentStepIndex ? 'bg-success-500' : 'bg-surface-secondary'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Auto-save indicator
export function AutoSaveIndicator() {
  const { autoSave, data } = useWizard()
  
  if (!autoSave) return null
  
  return (
    <div className="flex items-center gap-2 text-xs text-secondary">
      <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
      <span>Auto-saving...</span>
    </div>
  )
}
