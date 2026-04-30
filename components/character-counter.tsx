"use client"

import { cn } from "@/lib/utils"

interface CharacterCounterProps {
  current: number
  max: number
  className?: string
}

export function CharacterCounter({ current, max, className }: CharacterCounterProps) {
  const remaining = max - current
  const percentage = (current / max) * 100

  const getColor = () => {
    if (percentage >= 100) return "text-red-500"
    if (percentage >= 80) return "text-yellow-500"
    return "text-muted-foreground"
  }

  return (
    <div className={cn("text-xs flex items-center justify-between", className)}>
      <span className={getColor()}>
        {remaining >= 0 ? `${remaining} characters remaining` : `${Math.abs(remaining)} characters over limit`}
      </span>
      <span className={cn("font-mono", getColor())}>
        {current}/{max}
      </span>
    </div>
  )
}
