'use client'

import React, { ReactNode } from 'react'
import { useWizard } from './Wizard'
import { cn } from '@altamedica/utils'

export interface WizardStepProps {
  id: string
  children: ReactNode
  className?: string
}

export function WizardStep({ id, children, className }: WizardStepProps) {
  const { currentStep } = useWizard()
  
  if (!currentStep || currentStep.id !== id) {
    return null
  }

  return (
    <div 
      className={cn(
        'wizard-step',
        'p-6 min-h-[400px]',
        'animate-in fade-in-0 slide-in-from-right-1 duration-300',
        className
      )}
      role="tabpanel"
      aria-labelledby={`step-${id}-title`}
      id={`step-${id}-content`}
    >
      {children}
    </div>
  )
}

// Higher-order component for step content
export function withWizardStep<T extends object>(
  Component: React.ComponentType<T>,
  stepId: string
) {
  return function WizardStepWrapper(props: T) {
    return (
      <WizardStep id={stepId}>
        <Component {...props} />
      </WizardStep>
    )
  }
}
