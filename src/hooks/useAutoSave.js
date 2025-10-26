import { useEffect, useRef } from 'react'

// Simple debounce implementation (you can install use-debounce package for production)
function useDebouncedCallback(callback, delay) {
  const timeoutRef = useRef(null)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args)
    }, delay)
  }
}

export function useAutoSave(data, saveFunction, delay = 1000) {
  const isDirtyRef = useRef(false)
  const lastSavedRef = useRef(JSON.stringify(data))
  const saveInProgressRef = useRef(false)

  const debouncedSave = useDebouncedCallback(async () => {
    if (isDirtyRef.current && !saveInProgressRef.current) {
      saveInProgressRef.current = true
      
      try {
        await saveFunction(data)
        lastSavedRef.current = JSON.stringify(data)
        isDirtyRef.current = false
      } catch (error) {
        console.error('Auto-save failed:', error)
        // Could implement retry logic here
      } finally {
        saveInProgressRef.current = false
      }
    }
  }, delay)

  useEffect(() => {
    const currentData = JSON.stringify(data)
    
    if (currentData !== lastSavedRef.current) {
      isDirtyRef.current = true
      debouncedSave()
    }
  }, [data, debouncedSave])

  // Save on unmount if dirty
  useEffect(() => {
    return () => {
      if (isDirtyRef.current && !saveInProgressRef.current) {
        saveFunction(data).catch(err => {
          console.error('Failed to save on unmount:', err)
        })
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isSaving: saveInProgressRef.current,
    isDirty: isDirtyRef.current,
    forceSave: () => saveFunction(data)
  }
}