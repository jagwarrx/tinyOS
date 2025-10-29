/**
 * Timer Component
 *
 * A vertical dot-based timer with clickable remaining time display.
 * Each dot represents a time interval (e.g., 30 seconds).
 *
 * Features:
 * - Vertical dot visualization
 * - Displays remaining time at top (minutes and seconds)
 * - Click to pause/unpause
 * - Automatically disappears when time runs out
 *
 * @param {number} totalSeconds - Total time in seconds
 * @param {number} intervalSeconds - Interval for each dot in seconds
 * @param {function} onComplete - Callback when timer completes
 * @param {function} onClose - Callback to close timer
 */

import { useState, useEffect, useRef } from 'react'
import { Minimize2 } from 'lucide-react'

export default function Timer({ totalSeconds, intervalSeconds = 30, onComplete, onClose, onMinimize, onTick }) {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds)
  const [isPaused, setIsPaused] = useState(false)
  const [startTime] = useState(new Date())
  const intervalRef = useRef(null)
  const lastClickRef = useRef(0)

  // Notify parent of time changes
  useEffect(() => {
    onTick?.(remainingSeconds, isPaused)
  }, [remainingSeconds, isPaused, onTick])

  // Calculate total number of dots
  const totalDots = Math.ceil(totalSeconds / intervalSeconds)

  // Calculate which dot we're currently on
  const currentDot = Math.ceil(remainingSeconds / intervalSeconds)

  // Calculate elapsed dots
  const elapsedDots = totalDots - currentDot

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Format start time as 12-hour format (h:mm AM/PM)
  const formatStartTime = (date) => {
    let hours = date.getHours()
    const mins = date.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12 // Convert to 12-hour format, 0 becomes 12
    return `${hours}:${mins} ${ampm}`
  }

  useEffect(() => {
    if (!isPaused && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            onComplete?.()
            onClose?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPaused, remainingSeconds, onComplete, onClose])

  const togglePause = () => {
    setIsPaused(prev => !prev)
  }

  const handleTimerClick = () => {
    const now = Date.now()
    const timeSinceLastClick = now - lastClickRef.current

    if (timeSinceLastClick < 300) {
      // Double click detected - cancel timer
      onClose?.()
    } else {
      // Single click - toggle pause
      togglePause()
    }

    lastClickRef.current = now
  }

  return (
    <div className="fixed right-8 top-24 bg-bg-elevated border border-border-primary rounded-lg p-3 shadow-2xl z-50 flex flex-col items-center gap-2 min-w-[70px]">
      {/* Minimize button */}
      <div className="absolute top-1.5 right-1.5">
        <button
          onClick={onMinimize}
          className="p-0.5 hover:bg-bg-tertiary rounded transition-colors"
          title="Minimize timer"
        >
          <Minimize2 size={12} className="text-fg-tertiary" />
        </button>
      </div>

      {/* Time display - click to pause/unpause, double-click to cancel */}
      <button
        onClick={handleTimerClick}
        className="text-xl font-light text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer select-none pt-0.5"
        title={isPaused ? "Click to resume, double-click to cancel" : "Click to pause, double-click to cancel"}
      >
        {Math.floor(remainingSeconds / 60)}<br/>
        {(remainingSeconds % 60).toString().padStart(2, '0')}
      </button>

      {/* Pause indicator */}
      {isPaused && (
        <div className="text-[9px] text-semantic-warning font-medium -mt-1">
          PAUSED
        </div>
      )}

      {/* Vertical dots */}
      <div className="flex flex-col-reverse gap-1 py-0.5 items-center">
        {Array.from({ length: totalDots }).map((_, index) => {
          const isElapsed = index < elapsedDots
          const isCurrent = index === elapsedDots && remainingSeconds > 0

          // Mark dots at 30% and 70% progress as milestone dots (bolded)
          const thirtyPercentIndex = Math.round(totalDots * 0.3)
          const seventyPercentIndex = Math.round(totalDots * 0.7)
          const isMilestoneDot = index === thirtyPercentIndex || index === seventyPercentIndex

          return (
            <div
              key={index}
              className={`rounded-full transition-all duration-300 ${
                isMilestoneDot ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5'
              } ${
                isElapsed
                  ? 'bg-semantic-success'
                  : isCurrent
                  ? 'bg-accent-primary'
                  : 'bg-border-primary'
              }`}
              title={`${intervalSeconds}s interval${isMilestoneDot ? ' (milestone)' : ''}`}
            />
          )
        })}
      </div>

      {/* Start time display */}
      <div className="text-[10px] text-fg-tertiary font-mono pt-0.5">
        {formatStartTime(startTime)}
      </div>
    </div>
  )
}
