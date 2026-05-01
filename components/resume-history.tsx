"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Edit3, Trash2, ArrowUpDown, Search, Clock, Filter, ChevronDown, ChevronUp } from "lucide-react"
import type { HistoryEntry } from "@/app/page"

interface ResumeHistoryProps {
  history: HistoryEntry[]
  onRestoreEntry?: (entry: HistoryEntry) => void
}

export function ResumeHistory({ history, onRestoreEntry }: ResumeHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAction, setFilterAction] = useState<string>("all")
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())

  const getActionIcon = (action: string) => {
    switch (action) {
      case "add":
        return <Plus className="w-4 h-4 text-green-500" />
      case "edit":
        return <Edit3 className="w-4 h-4 text-blue-500" />
      case "delete":
        return <Trash2 className="w-4 h-4 text-red-500" />
      case "reorder":
        return <ArrowUpDown className="w-4 h-4 text-purple-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "add":
        return "bg-green-100 text-green-800 border-green-200"
      case "edit":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "delete":
        return "bg-red-100 text-red-800 border-red-200"
      case "reorder":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries)
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId)
    } else {
      newExpanded.add(entryId)
    }
    setExpandedEntries(newExpanded)
  }

  const filteredHistory = history.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.itemTitle && entry.itemTitle.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter = filterAction === "all" || entry.action === filterAction

    return matchesSearch && matchesFilter
  })

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No History Yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Start editing your resume to see a history of all your changes here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterAction === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAction("all")}
            className="text-xs"
          >
            All
          </Button>
          <Button
            variant={filterAction === "add" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAction("add")}
            className="text-xs"
          >
            Added
          </Button>
          <Button
            variant={filterAction === "edit" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAction("edit")}
            className="text-xs"
          >
            Edited
          </Button>
          <Button
            variant={filterAction === "delete" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAction("delete")}
            className="text-xs"
          >
            Deleted
          </Button>
        </div>
      </div>

      {/* History List */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {filteredHistory.map((entry) => {
            const isExpanded = expandedEntries.has(entry.id)
            const hasDetails = entry.oldValue || entry.newValue

            return (
              <div
                key={entry.id}
                className="border border-border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">{getActionIcon(entry.action)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={`text-xs ${getActionColor(entry.action)}`}>
                        {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">{entry.section}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{formatTimestamp(entry.timestamp)}</span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">{entry.description}</p>

                    {entry.itemTitle && (
                      <div className="text-xs text-muted-foreground mb-2">
                        Item: <span className="font-medium">{entry.itemTitle}</span>
                      </div>
                    )}

                    {hasDetails && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(entry.id)}
                          className="h-6 px-2 text-xs"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3 mr-1" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3 mr-1" />
                              Show Details
                            </>
                          )}
                        </Button>
                        {onRestoreEntry && entry.action === "delete" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRestoreEntry(entry)}
                            className="h-6 px-2 text-xs"
                          >
                            Restore
                          </Button>
                        )}
                      </div>
                    )}

                    {isExpanded && hasDetails && (
                      <div className="mt-3 p-3 bg-muted rounded-md text-xs">
                        {entry.oldValue && (
                          <div className="mb-2">
                            <span className="font-medium text-red-600">Old Value:</span>
                            <pre className="mt-1 text-muted-foreground whitespace-pre-wrap break-words">
                              {typeof entry.oldValue === "string"
                                ? entry.oldValue
                                : JSON.stringify(entry.oldValue, null, 2)}
                            </pre>
                          </div>
                        )}
                        {entry.newValue && (
                          <div>
                            <span className="font-medium text-green-600">New Value:</span>
                            <pre className="mt-1 text-muted-foreground whitespace-pre-wrap break-words">
                              {typeof entry.newValue === "string"
                                ? entry.newValue
                                : JSON.stringify(entry.newValue, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {filteredHistory.length === 0 && history.length > 0 && (
        <div className="text-center py-8">
          <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No history entries match your search.</p>
        </div>
      )}
    </div>
  )
}
