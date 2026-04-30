"use client"

import type { ReactNode } from "react"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface DraggableSectionProps {
  children: ReactNode
  isDragging?: boolean
  dragHandleProps?: any
  className?: string
}

export function DraggableSection({ children, isDragging, dragHandleProps, className }: DraggableSectionProps) {
  return (
    <div className={cn("relative", isDragging && "opacity-50", className)}>
      <div
        {...dragHandleProps}
        className="absolute left-2 top-4 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="pl-8">{children}</div>
    </div>
  )
}
