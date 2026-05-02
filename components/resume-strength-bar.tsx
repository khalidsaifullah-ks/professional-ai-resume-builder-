"use client"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Target, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ResumeData } from "@/app/page"

interface ResumeStrengthBarProps {
  resumeData: ResumeData
  onScrollToSection?: (sectionId: string) => void
}

interface ScoreItem {
  id: string
  label: string
  points: number
  maxPoints: number
  completed: boolean
  description: string
  sectionId?: string
}

export function ResumeStrengthBar({ resumeData, onScrollToSection }: ResumeStrengthBarProps) {
  const [showDetails, setShowDetails] = useState(false)

  const calculateScore = (): { items: ScoreItem[]; totalScore: number; maxScore: number } => {
    const items: ScoreItem[] = [
      {
        id: "basic-info",
        label: "Basic Information",
        points: resumeData.personalInfo.name && resumeData.personalInfo.email && resumeData.personalInfo.phone ? 10 : 0,
        maxPoints: 10,
        completed: !!(resumeData.personalInfo.name && resumeData.personalInfo.email && resumeData.personalInfo.phone),
        description: "Name, email, and phone number",
        sectionId: "personal-info",
      },
      {
        id: "location",
        label: "Location",
        points: resumeData.personalInfo.location ? 5 : 0,
        maxPoints: 5,
        completed: !!resumeData.personalInfo.location,
        description: "Current location",
        sectionId: "personal-info",
      },
      {
        id: "social-links",
        label: "Professional Links",
        points:
          resumeData.personalInfo.linkedin || resumeData.personalInfo.github || resumeData.personalInfo.leetcode
            ? 5
            : 0,
        maxPoints: 5,
        completed: !!(
          resumeData.personalInfo.linkedin ||
          resumeData.personalInfo.github ||
          resumeData.personalInfo.leetcode
        ),
        description: "LinkedIn, GitHub, or LeetCode profile",
        sectionId: "personal-info",
      },
      {
        id: "education",
        label: "Education",
        points: resumeData.education.length >= 1 ? 10 : 0,
        maxPoints: 10,
        completed: resumeData.education.length >= 1,
        description: "At least 1 education entry",
        sectionId: "education",
      },
      {
        id: "technical-skills",
        label: "Technical Skills",
        points: resumeData.technicalSkills.length >= 3 ? 10 : resumeData.technicalSkills.length >= 1 ? 5 : 0,
        maxPoints: 10,
        completed: resumeData.technicalSkills.length >= 3,
        description: "At least 3 skill categories",
        sectionId: "technical-skills",
      },
      {
        id: "projects",
        label: "Projects",
        points: resumeData.projects.length >= 2 ? 15 : resumeData.projects.length >= 1 ? 8 : 0,
        maxPoints: 15,
        completed: resumeData.projects.length >= 2,
        description: "At least 2 projects with descriptions",
        sectionId: "projects",
      },
      {
        id: "experience",
        label: "Professional Experience",
        points: resumeData.experience.length >= 1 ? 15 : 0,
        maxPoints: 15,
        completed: resumeData.experience.length >= 1,
        description: "At least 1 work experience",
        sectionId: "experience",
      },
      {
        id: "achievements",
        label: "Achievements",
        points: resumeData.achievements.length >= 2 ? 10 : resumeData.achievements.length >= 1 ? 5 : 0,
        maxPoints: 10,
        completed: resumeData.achievements.length >= 2,
        description: "At least 2 achievements or awards",
        sectionId: "achievements",
      },
      {
        id: "extracurriculars",
        label: "Extracurriculars",
        points: resumeData.extracurriculars.length >= 1 ? 5 : 0,
        maxPoints: 5,
        completed: resumeData.extracurriculars.length >= 1,
        description: "Leadership or volunteer activities",
        sectionId: "extracurriculars",
      },
      {
        id: "custom-sections",
        label: "Additional Sections",
        points: resumeData.customSections.length >= 1 ? 5 : 0,
        maxPoints: 5,
        completed: resumeData.customSections.length >= 1,
        description: "Certifications, languages, or other sections",
        sectionId: "custom-sections",
      },
    ]

    const totalScore = items.reduce((sum, item) => sum + item.points, 0)
    const maxScore = items.reduce((sum, item) => sum + item.maxPoints, 0)

    return { items, totalScore, maxScore }
  }

  const { items, totalScore, maxScore } = calculateScore()
  const percentage = Math.round((totalScore / maxScore) * 100)

  const getStrengthLevel = () => {
    if (percentage >= 80) return { text: "Excellent", color: "text-green-600", emoji: "🟢" }
    if (percentage >= 60) return { text: "Strong", color: "text-blue-600", emoji: "🔵" }
    if (percentage >= 40) return { text: "Good", color: "text-yellow-600", emoji: "🟡" }
    if (percentage >= 20) return { text: "Fair", color: "text-orange-600", emoji: "🟠" }
    return { text: "Needs Work", color: "text-red-600", emoji: "🔴" }
  }

  const strength = getStrengthLevel()
  const completedItems = items.filter((item) => item.completed).length
  const incompleteItems = items.filter((item) => !item.completed)

  const handleSectionClick = (sectionId?: string) => {
    if (sectionId && onScrollToSection) {
      onScrollToSection(sectionId)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Resume Strength</h3>
        </div>
        <Badge variant="outline" className={cn("font-medium", strength.color)}>
          {strength.emoji} {strength.text}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {completedItems}/{items.length} sections completed
          </span>
          <span className="font-medium text-foreground">
            {totalScore}/{maxScore} points
          </span>
        </div>
        <Progress value={percentage} className="h-3" />
        <div className="text-center">
          <span className="text-2xl font-bold text-foreground">{percentage}%</span>
        </div>
      </div>

      {/* Toggle Details */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDetails(!showDetails)}
        className="w-full justify-between text-muted-foreground hover:text-foreground"
      >
        <span>View Details</span>
        {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="space-y-3 pt-2 border-t border-border">
          <h4 className="font-medium text-foreground text-sm">Strength Breakdown</h4>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md transition-colors",
                  item.sectionId && onScrollToSection ? "cursor-pointer hover:bg-accent" : "",
                  item.completed ? "bg-green-50 dark:bg-green-950/20" : "bg-gray-50 dark:bg-gray-950/20",
                )}
                onClick={() => handleSectionClick(item.sectionId)}
              >
                <div className="flex items-center gap-2 flex-1">
                  {item.completed ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-foreground">
                  {item.points}/{item.maxPoints}
                </div>
              </div>
            ))}
          </div>

          {/* Improvement Suggestions */}
          {incompleteItems.length > 0 && (
            <div className="pt-3 border-t border-border">
              <h4 className="font-medium text-foreground text-sm mb-2">Quick Wins</h4>
              <div className="space-y-1">
                {incompleteItems.slice(0, 3).map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2 bg-transparent"
                    onClick={() => handleSectionClick(item.sectionId)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                        +{item.maxPoints}
                      </span>
                      <span className="text-sm">{item.label}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Motivational Message */}
          <div className="pt-3 border-t border-border">
            <div className="text-center p-3 bg-primary/5 rounded-md">
              <div className="text-sm font-medium text-foreground">
                {percentage >= 80
                  ? "🎉 Outstanding! Your resume is comprehensive and impressive."
                  : percentage >= 60
                    ? "💪 Great progress! A few more sections will make it excellent."
                    : percentage >= 40
                      ? "📈 You're on the right track! Keep adding content."
                      : "🚀 Let's build an amazing resume together!"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
