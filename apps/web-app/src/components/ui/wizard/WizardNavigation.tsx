'use client'

import React from 'react'
import { useWizard } from './Wizard'
import { cn } from '@altamedica/utils'

// Icons using design tokens
const ChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
)

const LoadingIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

export interface WizardNavigationProps {
  variant?: 'default' | 'floating' | 'minimal'
  showStepInfo?: boolean
  showProgressText?: boolean
  className?: string
  nextLabel?: string
  previousLabel?: string
  finishLabel?: string
  skipLabel?: string
  backToStepLabel?: string
  onCustomNext?: () => void
  onCustomPrevious?: () => void
  onCustomFinish?: () => void
  allowSkip?: boolean
  customButtons?: React.ReactNode
}

export function WizardNavigation({
  variant = 'default',
  showStepInfo = true,
  showProgressText = false,
  className,
  nextLabel = 'Next',
  previousLabel = 'Back',
  finishLabel = 'Complete',
  skipLabel = 'Skip',
  backToStepLabel = 'Back to',
  onCustomNext,
  onCustomPrevious,
  onCustomFinish,
  allowSkip = false,
  customButtons
}: WizardNavigationProps) {
  const {
    currentStep,
    currentStepIndex,
    steps,
    isFirstStep,
    isLastStep,
    isStepValid,
    errors,
    nextStep,
    previousStep,
    isLoading
  } = useWizard()

  const handleNext = () => {
    if (onCustomNext) {
      onCustomNext()
    } else {
      nextStep()
    }
  }

  const handlePrevious = () => {
    if (onCustomPrevious) {
      onCustomPrevious()
    } else {
      previousStep()
    }
  }

  const handleFinish = () => {
    if (onCustomFinish) {
      onCustomFinish()
    } else {
      nextStep() // This will trigger completion
    }
  }

  const canProceed = isStepValid && !isLoading
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  if (variant === 'floating') {
    return (
      <div className={cn(
        'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50',
        'bg-surface border border-primary rounded-xl shadow-xl',
        'px-6 py-4 backdrop-blur-sm',
        className
      )}>
        <div className="flex items-center gap-4">
          {!isFirstStep && (
            <button
              onClick={handlePrevious}
              disabled={isLoading}
              className="medical-button secondary text-sm px-4 py-2 rounded-lg"
            >
              <ChevronLeftIcon />
              <span className="ml-2">{previousLabel}</span>
            </button>
          )}

          {showStepInfo && (
            <div className="text-center">
              <div className="text-small text-primary font-medium">
                {currentStep?.title}
              </div>
              <div className="text-caption text-secondary">
                Step {currentStepIndex + 1} of {steps.length}
              </div>
            </div>
          )}

          {isLastStep ? (
            <button
              onClick={handleFinish}
              disabled={!canProceed}
              className={cn(
                'medical-button primary text-sm px-6 py-2 rounded-lg',
                'flex items-center gap-2',
                !canProceed && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isLoading ? <LoadingIcon /> : <CheckIcon />}
              <span>{finishLabel}</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={cn(
                'medical-button primary text-sm px-4 py-2 rounded-lg',
                'flex items-center gap-2',
                !canProceed && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span>{nextLabel}</span>
              <ChevronRightIcon />
            </button>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('flex justify-between items-center', className)}>
        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <button
              onClick={handlePrevious}
              disabled={isLoading}
              className="text-secondary hover:text-primary transition-colors text-sm"
            >
              <ChevronLeftIcon />
            </button>
          )}
          
          {showProgressText && (
            <span className="text-small text-secondary">
              {currentStepIndex + 1} / {steps.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {allowSkip && !isLastStep && currentStep?.isOptional && (
            <button
              onClick={handleNext}
              className="text-secondary hover:text-primary transition-colors text-sm"
            >
              {skipLabel}
            </button>
          )}

          {customButtons}

          {isLastStep ? (
            <button
              onClick={handleFinish}
              disabled={!canProceed}
              className={cn(
                'text-primary hover:text-primary-600 transition-colors text-sm font-medium',
                !canProceed && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isLoading ? <LoadingIcon /> : finishLabel}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={cn(
                'text-primary hover:text-primary-600 transition-colors text-sm',
                !canProceed && 'opacity-50 cursor-not-allowed'
              )}
            >
              <ChevronRightIcon />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn('wizard-navigation', 'border-t border-border-primary pt-6', className)}>
      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mb-4 space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center text-error-600 text-small">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Progress info */}
      {showStepInfo && (
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h4 className="text-h6 text-primary font-semibold">
              {currentStep?.title}
            </h4>
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
            {showProgressText && (
              <div className="text-caption text-secondary">
                {Math.round(progress)}% Complete
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {!isFirstStep && (
            <button
              onClick={handlePrevious}
              disabled={isLoading}
              className={cn(
                'medical-button secondary',
                'flex items-center gap-2 px-4 py-2 rounded-lg',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <ChevronLeftIcon />
              <span>{previousLabel}</span>
            </button>
          )}

          {allowSkip && !isLastStep && currentStep?.isOptional && (
            <button
              onClick={handleNext}
              className="text-secondary hover:text-primary transition-colors text-sm"
            >
              {skipLabel}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {customButtons}

          {isLastStep ? (
            <button
              onClick={handleFinish}
              disabled={!canProceed}
              className={cn(
                'medical-button primary',
                'flex items-center gap-2 px-6 py-2 rounded-lg',
                !canProceed && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isLoading ? <LoadingIcon /> : <CheckIcon />}
              <span>{finishLabel}</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={cn(
                'medical-button primary',
                'flex items-center gap-2 px-4 py-2 rounded-lg',
                !canProceed && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span>{nextLabel}</span>
              <ChevronRightIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Keyboard navigation hook
export function useWizardKeyboard() {
  const { nextStep, previousStep, isStepValid, isFirstStep, isLastStep } = useWizard()

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent navigation when user is typing in form fields
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'Enter':
          if (isStepValid && !isLastStep) {
            event.preventDefault()
            nextStep()
          }
          break
        case 'ArrowLeft':
        case 'Backspace':
          if (!isFirstStep) {
            event.preventDefault()
            previousStep()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextStep, previousStep, isStepValid, isFirstStep, isLastStep])
}
