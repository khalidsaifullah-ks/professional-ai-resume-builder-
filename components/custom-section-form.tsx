"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { PlusCircle, MinusCircle, Trash2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { CharacterCounter } from "@/components/character-counter"
import type { CustomSection } from "@/app/page"

interface CustomSectionFormProps {
  section: CustomSection
  onUpdate: (section: CustomSection) => void
  onDelete: () => void
}

export function CustomSectionForm({ section, onUpdate, onDelete }: CustomSectionFormProps) {
  const updateSectionTitle = (title: string) => {
    onUpdate({ ...section, title })
  }

  const addItem = () => {
    const newItem = {
      id: uuidv4(),
      title: "",
      subtitle: "",
      description: "",
      duration: "",
      location: "",
    }
    onUpdate({ ...section, items: [...section.items, newItem] })
  }

  const updateItem = (itemId: string, field: string, value: string) => {
    const updatedItems = section.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    onUpdate({ ...section, items: updatedItems })
  }

  const removeItem = (itemId: string) => {
    const updatedItems = section.items.filter((item) => item.id !== itemId)
    onUpdate({ ...section, items: updatedItems })
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`section-title-${section.id}`}>Section Title</Label>
              <Input
                id={`section-title-${section.id}`}
                value={section.title}
                onChange={(e) => updateSectionTitle(e.target.value)}
                placeholder="e.g., Certifications, Languages, Publications"
                maxLength={50}
              />
              <CharacterCounter current={section.title.length} max={50} className="mt-1" />
            </div>
            <div>
              <Label htmlFor={`section-layout-${section.id}`}>Section Layout Style</Label>
              <select
                id={`section-layout-${section.id}`}
                value={section.layout || "full"}
                onChange={(e) => onUpdate({ ...section, layout: e.target.value as any })}
                className="w-full border border-input rounded-md px-3 py-2 text-xs bg-background text-foreground h-9 focus:outline-none focus:ring-2 focus:ring-primary mt-1"
              >
                <option value="full">Full Layout (Title, Subtitle, Date, Location, Bullets)</option>
                <option value="bullet">Bullet Points Only (Simple list, like Certifications)</option>
                <option value="text">Text Only (Paragraph layout without bullets)</option>
              </select>
            </div>
          </div>
        </div>
        <Button variant="destructive" size="icon" onClick={onDelete} className="h-8 w-8 mt-6">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Section Items */}
      {section.items.map((item) => (
        <div key={item.id} className="border border-border p-4 rounded-md space-y-3 relative bg-muted/20">
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 cursor-pointer"
            onClick={() => removeItem(item.id)}
          >
            <MinusCircle className="h-4 w-4" />
          </Button>

          {section.layout === "bullet" ? (
            <div>
              <Label htmlFor={`item-title-${item.id}`}>Bullet Point Text *</Label>
              <Input
                id={`item-title-${item.id}`}
                value={item.title || ""}
                onChange={(e) => updateItem(item.id, "title", e.target.value)}
                placeholder="e.g., AWS Certified Solutions Architect (2024)"
                maxLength={150}
                className="mt-1"
              />
              <CharacterCounter current={(item.title || "").length} max={150} className="mt-1" />
            </div>
          ) : section.layout === "text" ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor={`item-title-${item.id}`}>Title / Heading *</Label>
                <Input
                  id={`item-title-${item.id}`}
                  value={item.title || ""}
                  onChange={(e) => updateItem(item.id, "title", e.target.value)}
                  placeholder="e.g., About Me"
                  maxLength={100}
                  className="mt-1"
                />
                <CharacterCounter current={(item.title || "").length} max={100} className="mt-1" />
              </div>
              <div>
                <Label htmlFor={`item-description-${item.id}`}>Paragraph Text</Label>
                <Textarea
                  id={`item-description-${item.id}`}
                  value={item.description || ""}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  placeholder="Write details or paragraph content here..."
                  maxLength={1000}
                  className="mt-1"
                />
                <CharacterCounter current={(item.description || "").length} max={1000} className="mt-1" />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`item-title-${item.id}`}>Title *</Label>
                  <Input
                    id={`item-title-${item.id}`}
                    value={item.title || ""}
                    onChange={(e) => updateItem(item.id, "title", e.target.value)}
                    placeholder="e.g., AWS Certified Developer"
                    maxLength={100}
                  />
                  <CharacterCounter current={(item.title || "").length} max={100} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor={`item-subtitle-${item.id}`}>Subtitle (Optional)</Label>
                  <Input
                    id={`item-subtitle-${item.id}`}
                    value={item.subtitle || ""}
                    onChange={(e) => updateItem(item.id, "subtitle", e.target.value)}
                    placeholder="e.g., Amazon Web Services"
                    maxLength={100}
                  />
                  <CharacterCounter current={(item.subtitle || "").length} max={100} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor={`item-duration-${item.id}`}>Duration (Optional)</Label>
                  <Input
                    id={`item-duration-${item.id}`}
                    value={item.duration || ""}
                    onChange={(e) => updateItem(item.id, "duration", e.target.value)}
                    placeholder="e.g., 2023 - Present"
                    maxLength={50}
                  />
                  <CharacterCounter current={(item.duration || "").length} max={50} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor={`item-location-${item.id}`}>Location (Optional)</Label>
                  <Input
                    id={`item-location-${item.id}`}
                    value={item.location || ""}
                    onChange={(e) => updateItem(item.id, "location", e.target.value)}
                    placeholder="e.g., Online, Seattle, WA"
                    maxLength={50}
                  />
                  <CharacterCounter current={(item.location || "").length} max={50} className="mt-1" />
                </div>
              </div>

              <div>
                <Label htmlFor={`item-description-${item.id}`}>Description (use bullet points for multiple lines)</Label>
                <Textarea
                  id={`item-description-${item.id}`}
                  value={item.description || ""}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  placeholder="• Key details about this item\n• Additional information"
                  maxLength={300}
                />
                <CharacterCounter current={(item.description || "").length} max={300} className="mt-1" />
              </div>
            </>
          )}
        </div>
      ))}

      {/* Add Item Button */}
      <Button variant="outline" className="w-full bg-transparent" onClick={addItem}>
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Item
      </Button>
    </div>
  )
}
