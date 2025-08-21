'use client'

import { Button, Card, Input } from '@altamedica/ui';
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react'
import { cn } from '@altamedica/utils'

// Types
export interface WizardStep {
  id: string
  name: string
  title: string
  description?: string
  isOptional?: boolean
  isCompleted?: boolean
  isValid?: boolean
  component: ReactNode
  validation?: (data: any) => boolean | string[]
  onEnter?: () => void
  onExit?: () => void
}

export interface WizardData {
  [stepId: string]: any
}

export interface WizardContextType {
  steps: WizardStep[]
  currentStepIndex: number
  currentStep: WizardStep | null
  data: WizardData
  isFirstStep: boolean
  isLastStep: boolean
  isStepValid: boolean
  errors: string[]
  isLoading: boolean
  autoSave: boolean
  theme: 'light' | 'dark' | 'system'
  
  // Navigation
  nextStep: () => void
  previousStep: () => void
  goToStep: (stepId: string) => void
  
  // Data management
  updateStepData: (stepId: string, data: any) => void
  setStepValid: (stepId: string, isValid: boolean) => void
  setStepCompleted: (stepId: string, isCompleted: boolean) => void
  
  // Error handling
  setErrors: (errors: string[]) => void
  clearErrors: () => void
  
  // Lifecycle
  onStepChange?: (fromStep: WizardStep | null, toStep: WizardStep) => void
  onComplete?: (data: WizardData) => void
  onSave?: (data: WizardData) => void
}

const WizardContext = createContext<WizardContextType | null>(null)

export const useWizard = () => {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider')
  }
  return context
}

// Main Wizard component
export interface WizardProps {
  steps: WizardStep[]
  initialData?: WizardData
  autoSave?: boolean
  autoSaveInterval?: number
  theme?: 'light' | 'dark' | 'system'
  className?: string
  onStepChange?: (fromStep: WizardStep | null, toStep: WizardStep) => void
  onComplete?: (data: WizardData) => void
  onSave?: (data: WizardData) => void
  children: ReactNode
}

export function Wizard({
  steps,
  initialData = {},
  autoSave = true,
  autoSaveInterval = 5000,
  theme = 'system',
  className,
  onStepChange,
  onComplete,
  onSave,
  children
}: WizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [data, setData] = useState<WizardData>(initialData)
  const [errors, setErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [stepsState, setStepsState] = useState(steps)

  const currentStep = stepsState[currentStepIndex] || null
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === stepsState.length - 1
  const isStepValid = currentStep?.isValid !== false

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && onSave) {
      const interval = setInterval(() => {
        onSave(data)
      }, autoSaveInterval)
      
      return () => clearInterval(interval)
    }
  }, [autoSave, autoSaveInterval, data, onSave])

  // Navigation functions
  const nextStep = useCallback(() => {
    if (isLastStep) {
      onComplete?.(data)
      return
    }

    if (!isStepValid) {
      setErrors(['Please complete all required fields before proceeding'])
      return
    }

    const fromStep = currentStep
    const toStep = stepsState[currentStepIndex + 1]

    if (fromStep?.onExit) {
      fromStep.onExit()
    }

    setCurrentStepIndex(prev => prev + 1)
    setErrors([])

    if (toStep?.onEnter) {
      toStep.onEnter()
    }

    onStepChange?.(fromStep, toStep)
  }, [currentStepIndex, isLastStep, isStepValid, currentStep, stepsState, onComplete, onStepChange, data])

  const previousStep = useCallback(() => {
    if (isFirstStep) return

    const fromStep = currentStep
    const toStep = stepsState[currentStepIndex - 1]

    if (fromStep?.onExit) {
      fromStep.onExit()
    }

    setCurrentStepIndex(prev => prev - 1)
    setErrors([])

    if (toStep?.onEnter) {
      toStep.onEnter()
    }

    onStepChange?.(fromStep, toStep)
  }, [currentStepIndex, isFirstStep, currentStep, stepsState, onStepChange])

  const goToStep = useCallback((stepId: string) => {
    const targetIndex = stepsState.findIndex(step => step.id === stepId)
    if (targetIndex === -1 || targetIndex === currentStepIndex) return

    const fromStep = currentStep
    const toStep = stepsState[targetIndex]

    if (fromStep?.onExit) {
      fromStep.onExit()
    }

    setCurrentStepIndex(targetIndex)
    setErrors([])

    if (toStep?.onEnter) {
      toStep.onEnter()
    }

    onStepChange?.(fromStep, toStep)
  }, [currentStepIndex, currentStep, stepsState, onStepChange])

  // Data management
  const updateStepData = useCallback((stepId: string, stepData: any) => {
    setData(prev => ({
      ...prev,
      [stepId]: stepData
    }))
  }, [])

  const setStepValid = useCallback((stepId: string, isValid: boolean) => {
    setStepsState(prev => prev.map(step => 
      step.id === stepId ? { ...step, isValid } : step
    ))
  }, [])

  const setStepCompleted = useCallback((stepId: string, isCompleted: boolean) => {
    setStepsState(prev => prev.map(step => 
      step.id === stepId ? { ...step, isCompleted } : step
    ))
  }, [])

  // Error handling
  const setErrorsHandler = useCallback((newErrors: string[]) => {
    setErrors(newErrors)
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  // Validate current step
  useEffect(() => {
    if (currentStep?.validation) {
      const stepData = data[currentStep.id]
      const validationResult = currentStep.validation(stepData)
      
      if (typeof validationResult === 'boolean') {
        setStepValid(currentStep.id, validationResult)
      } else if (Array.isArray(validationResult)) {
        setStepValid(currentStep.id, validationResult.length === 0)
        setErrors(validationResult)
      }
    }
  }, [currentStep, data, setStepValid])

  const contextValue = useMemo<WizardContextType>(() => ({
    steps: stepsState,
    currentStepIndex,
    currentStep,
    data,
    isFirstStep,
    isLastStep,
    isStepValid,
    errors,
    isLoading,
    autoSave,
    theme,
    nextStep,
    previousStep,
    goToStep,
    updateStepData,
    setStepValid,
    setStepCompleted,
    setErrors: setErrorsHandler,
    clearErrors,
    onStepChange,
    onComplete,
    onSave
  }), [
    stepsState,
    currentStepIndex,
    currentStep,
    data,
    isFirstStep,
    isLastStep,
    isStepValid,
    errors,
    isLoading,
    autoSave,
    theme,
    nextStep,
    previousStep,
    goToStep,
    updateStepData,
    setStepValid,
    setStepCompleted,
    setErrorsHandler,
    clearErrors,
    onStepChange,
    onComplete,
    onSave
  ])

  return (
    <WizardContext.Provider value={contextValue}>
      <div
        className={cn(
          'wizard-container',
          'bg-surface border border-primary rounded-lg shadow-card',
          'transition-colors duration-200',
          theme === 'dark' && 'dark',
          className
        )}
        data-theme={theme}
      >
        {children}
      </div>
    </WizardContext.Provider>
  )
}

// Export the context for advanced use cases
export { WizardContext }
