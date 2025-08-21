'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWizard } from './Wizard'

import { logger } from '@altamedica/shared/services/logger.service';
// Hook for managing wizard form state with validation
export function useWizardForm<T extends Record<string, any>>(
  stepId: string,
  initialData?: T,
  validationRules?: Record<keyof T, (value: any) => boolean | string>
) {
  const { data, updateStepData, setStepValid } = useWizard()
  const [formData, setFormData] = useState<T>(initialData || {} as T)
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>)
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>)

  // Sync with wizard data
  useEffect(() => {
    const wizardData = data[stepId]
    if (wizardData) {
      setFormData(prev => ({ ...prev, ...wizardData }))
    }
  }, [data, stepId])

  // Validate form
  const validateForm = useCallback(() => {
    if (!validationRules) return true

    const newErrors: Record<keyof T, string> = {} as Record<keyof T, string>
    let isValid = true

    for (const [field, rule] of Object.entries(validationRules)) {
      const value = formData[field as keyof T]
      const result = rule(value)
      
      if (typeof result === 'string') {
        newErrors[field as keyof T] = result
        isValid = false
      } else if (result === false) {
        newErrors[field as keyof T] = `${field} is invalid`
        isValid = false
      }
    }

    setErrors(newErrors)
    setStepValid(stepId, isValid)
    return isValid
  }, [formData, validationRules, stepId, setStepValid])

  // Update field value
  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      updateStepData(stepId, newData)
      return newData
    })
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [stepId, updateStepData])

  // Validate on form data change
  useEffect(() => {
    validateForm()
  }, [validateForm])

  return {
    formData,
    errors,
    touched,
    updateField,
    validateForm,
    setTouched
  }
}

// Hook for managing wizard progress and analytics
export function useWizardAnalytics() {
  const { steps, currentStepIndex, data } = useWizard()
  const [analytics, setAnalytics] = useState({
    startTime: Date.now(),
    stepTimes: {} as Record<string, number>,
    completionRate: 0,
    dropoffPoints: [] as string[],
    userBehavior: [] as Array<{ step: string; action: string; timestamp: number }>
  })

  const trackEvent = useCallback((action: string, metadata?: any) => {
    const currentStep = steps[currentStepIndex]
    if (!currentStep) return

    setAnalytics(prev => ({
      ...prev,
      userBehavior: [
        ...prev.userBehavior,
        {
          step: currentStep.id,
          action,
          timestamp: Date.now(),
          ...metadata
        }
      ]
    }))
  }, [steps, currentStepIndex])

  const trackStepEntry = useCallback((stepId: string) => {
    setAnalytics(prev => ({
      ...prev,
      stepTimes: {
        ...prev.stepTimes,
        [stepId]: Date.now()
      }
    }))
  }, [])

  const getStepProgress = useCallback(() => {
    const completedSteps = steps.filter(step => step.isCompleted).length
    return (completedSteps / steps.length) * 100
  }, [steps])

  const getTimeSpent = useCallback(() => {
    return Date.now() - analytics.startTime
  }, [analytics.startTime])

  const getStepTimeSpent = useCallback((stepId: string) => {
    const stepStartTime = analytics.stepTimes[stepId]
    return stepStartTime ? Date.now() - stepStartTime : 0
  }, [analytics.stepTimes])

  return {
    analytics,
    trackEvent,
    trackStepEntry,
    getStepProgress,
    getTimeSpent,
    getStepTimeSpent
  }
}

// Hook for managing wizard persistence
export function useWizardPersistence(storageKey: string, autoSave: boolean = true) {
  const { data, updateStepData } = useWizard()

  // Save to localStorage
  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch (error) {
      logger.warn('Failed to save wizard data to localStorage:', error)
    }
  }, [data, storageKey])

  // Load from localStorage
  const loadFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const { data: savedData, timestamp } = JSON.parse(saved)
        
        // Check if data is not too old (24 hours)
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          Object.entries(savedData).forEach(([stepId, stepData]) => {
            updateStepData(stepId, stepData)
          })
          return true
        }
      }
    } catch (error) {
      logger.warn('Failed to load wizard data from localStorage:', error)
    }
    return false
  }, [storageKey, updateStepData])

  // Clear storage
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch (error) {
      logger.warn('Failed to clear wizard data from localStorage:', error)
    }
  }, [storageKey])

  // Auto-save on data change
  useEffect(() => {
    if (autoSave && Object.keys(data).length > 0) {
      saveToStorage()
    }
  }, [data, autoSave, saveToStorage])

  return {
    saveToStorage,
    loadFromStorage,
    clearStorage
  }
}

// Hook for managing wizard validation
export function useWizardValidation() {
  const { steps, currentStep, data, setStepValid } = useWizard()
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({})

  const validateStep = useCallback((stepId: string) => {
    const step = steps.find(s => s.id === stepId)
    if (!step?.validation) return true

    const stepData = data[stepId]
    const result = step.validation(stepData)
    
    let isValid = true
    if (typeof result === 'boolean') {
      isValid = result
    } else if (Array.isArray(result)) {
      isValid = result.length === 0
    }

    setValidationResults(prev => ({ ...prev, [stepId]: isValid }))
    setStepValid(stepId, isValid)
    
    return isValid
  }, [steps, data, setStepValid])

  const validateAllSteps = useCallback(() => {
    const results: Record<string, boolean> = {}
    let allValid = true

    steps.forEach(step => {
      const isValid = validateStep(step.id)
      results[step.id] = isValid
      if (!isValid) allValid = false
    })

    setValidationResults(results)
    return allValid
  }, [steps, validateStep])

  const getCurrentStepValidation = useCallback(() => {
    if (!currentStep) return true
    return validationResults[currentStep.id] ?? true
  }, [currentStep, validationResults])

  return {
    validationResults,
    validateStep,
    validateAllSteps,
    getCurrentStepValidation
  }
}

// Hook for managing conditional steps
export function useConditionalSteps() {
  const { steps, data, currentStepIndex } = useWizard()
  
  const getAvailableSteps = useCallback(() => {
    return steps.filter(step => {
      // Add your conditional logic here
      // For example, skip steps based on previous answers
      return true
    })
  }, [steps, data])

  const getNextAvailableStep = useCallback(() => {
    const availableSteps = getAvailableSteps()
    const currentIndex = availableSteps.findIndex(step => step.id === steps[currentStepIndex]?.id)
    return availableSteps[currentIndex + 1] || null
  }, [getAvailableSteps, steps, currentStepIndex])

  const getPreviousAvailableStep = useCallback(() => {
    const availableSteps = getAvailableSteps()
    const currentIndex = availableSteps.findIndex(step => step.id === steps[currentStepIndex]?.id)
    return availableSteps[currentIndex - 1] || null
  }, [getAvailableSteps, steps, currentStepIndex])

  return {
    getAvailableSteps,
    getNextAvailableStep,
    getPreviousAvailableStep
  }
}
