"use client"

import React, { useRef, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { PlusCircle, MinusCircle, ArrowUp, ArrowDown } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CharacterCounter } from "@/components/character-counter"
import { CustomSectionForm } from "@/components/custom-section-form"

import type {
  ResumeData,
  PersonalInfo,
  Education,
  TechnicalSkill,
  Project,
  Experience,
  Achievement,
  Certification,
  Extracurricular,
  CustomSection,
  HistoryEntry,
} from "@/app/page"

interface ResumeFormProps {
  resumeData: ResumeData
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>
}

export function ResumeForm({ resumeData, setResumeData }: ResumeFormProps) {
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({})
  const [isLayoutOpen, setIsLayoutOpen] = useState(false)

  const [selectionBox, setSelectionBox] = useState<{
    visible: boolean;
    x: number;
    y: number;
    element: HTMLTextAreaElement | HTMLInputElement | null;
    start: number;
    end: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
    element: null,
    start: 0,
    end: 0,
  });

  const applyFormattingToElement = (
    element: HTMLTextAreaElement | HTMLInputElement,
    start: number,
    end: number,
    formatType: "bold" | "italic"
  ) => {
    const val = element.value;
    const selectedText = val.substring(start, end);
    const wrapped = formatType === "bold" ? `**${selectedText}**` : `*${selectedText}*`;
    const newVal = val.substring(0, start) + wrapped + val.substring(end);

    const valueSetter = Object.getOwnPropertyDescriptor(
      element.tagName === "TEXTAREA"
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype,
      "value"
    )?.set;

    if (valueSetter) {
      valueSetter.call(element, newVal);
      const event = new Event("input", { bubbles: true });
      element.dispatchEvent(event);
    }

    setTimeout(() => {
      element.focus();
      const newStart = start + (formatType === "bold" ? 2 : 1);
      const newEnd = newStart + selectedText.length;
      element.setSelectionRange(newStart, newEnd);
    }, 50);
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "TEXTAREA" ||
          (activeEl.tagName === "INPUT" && (activeEl as HTMLInputElement).type === "text"))
      ) {
        const inputEl = activeEl as HTMLTextAreaElement | HTMLInputElement;
        const start = inputEl.selectionStart || 0;
        const end = inputEl.selectionEnd || 0;

        if (end > start && inputEl.value.substring(start, end).trim().length > 0) {
          const rect = inputEl.getBoundingClientRect();
          setSelectionBox({
            visible: true,
            x: rect.left + rect.width / 2 + window.scrollX,
            y: rect.top - 36 + window.scrollY,
            element: inputEl,
            start,
            end,
          });
          return;
        }
      }
      setSelectionBox((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "TEXTAREA" ||
          (activeEl.tagName === "INPUT" && (activeEl as HTMLInputElement).type === "text"))
      ) {
        const inputEl = activeEl as HTMLTextAreaElement | HTMLInputElement;
        const start = inputEl.selectionStart || 0;
        const end = inputEl.selectionEnd || 0;
        if (end > start) {
          if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
            e.preventDefault();
            applyFormattingToElement(inputEl, start, end, "bold");
          } else if ((e.ctrlKey || e.metaKey) && (e.key === "i" || e.key === "I")) {
            e.preventDefault();
            applyFormattingToElement(inputEl, start, end, "italic");
          }
        }
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const applyFormatting = (formatType: "bold" | "italic") => {
    const { element, start, end } = selectionBox;
    if (!element) return;
    applyFormattingToElement(element, start, end, formatType);
    setSelectionBox((prev) => ({ ...prev, visible: false }));
  };

  const addHistoryEntry = (
    action: "add" | "edit" | "delete" | "reorder",
    section: string,
    description: string,
    itemId?: string,
    itemTitle?: string,
    oldValue?: any,
    newValue?: any,
  ) => {
    const historyEntry: HistoryEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      action,
      section,
      itemId,
      itemTitle,
      oldValue,
      newValue,
      description,
    }

    setResumeData((prev) => ({
      ...prev,
      history: [historyEntry, ...(prev.history ? prev.history.slice(0, 49) : [])], // Safe fallback if history is missing
    }))
  }

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId]
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
      // Add a subtle highlight effect
      element.style.backgroundColor = "rgba(59, 130, 246, 0.1)"
      setTimeout(() => {
        element.style.backgroundColor = ""
      }, 2000)
    }
  }

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    const oldValue = resumeData.personalInfo[field]
    if (oldValue !== value && oldValue !== "") {
      addHistoryEntry(
        "edit",
        "Personal Information",
        `Updated ${field} from "${oldValue}" to "${value}"`,
        undefined,
        field,
        oldValue,
        value,
      )
    }
    setResumeData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }))
  }

  const addEducation = () => {
    const newId = uuidv4()
    addHistoryEntry("add", "Education", "Added new education entry", newId, "New Education")
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: newId,
          institution: "",
          degree: "",
          duration: "",
          location: "",
          gradeFormat: "",
          gradeValue: "",
        },
      ],
    }))
  }

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    const currentItem = resumeData.education.find((edu) => edu.id === id)
    const oldValue = currentItem?.[field]
    if (oldValue !== value && oldValue !== "") {
      addHistoryEntry(
        "edit",
        "Education",
        `Updated ${field} in "${currentItem?.institution || "education entry"}"`,
        id,
        currentItem?.institution || "Education Entry",
        oldValue,
        value,
      )
    }
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu)),
    }))
  }

  const removeEducation = (id: string) => {
    const itemToRemove = resumeData.education.find((edu) => edu.id === id)
    addHistoryEntry(
      "delete",
      "Education",
      `Deleted education entry: ${itemToRemove?.institution || "Unknown"}`,
      id,
      itemToRemove?.institution || "Education Entry",
      itemToRemove,
    )
    setResumeData((prev) => ({
      ...prev,
      history: prev.history ? prev.history : [],
      education: prev.education.filter((edu) => edu.id !== id),
    }))
  }

  const addTechnicalSkill = () => {
    const newId = uuidv4()
    addHistoryEntry("add", "Technical Skills", "Added new technical skill category", newId, "New Skill Category")
    setResumeData((prev) => ({
      ...prev,
      technicalSkills: [...prev.technicalSkills, { id: newId, category: "", skills: "" }],
    }))
  }

  const updateTechnicalSkill = (id: string, field: keyof TechnicalSkill, value: string) => {
    const currentItem = resumeData.technicalSkills.find((skill) => skill.id === id)
    const oldValue = currentItem?.[field]
    if (oldValue !== value && oldValue !== "") {
      addHistoryEntry(
        "edit",
        "Technical Skills",
        `Updated ${field} in "${currentItem?.category || "skill category"}"`,
        id,
        currentItem?.category || "Skill Category",
        oldValue,
        value,
      )
    }
    setResumeData((prev) => ({
      ...prev,
      technicalSkills: prev.technicalSkills.map((skill) => (skill.id === id ? { ...skill, [field]: value } : skill)),
    }))
  }

  const removeTechnicalSkill = (id: string) => {
    const itemToRemove = resumeData.technicalSkills.find((skill) => skill.id === id)
    addHistoryEntry(
      "delete",
      "Technical Skills",
      `Deleted skill category: ${itemToRemove?.category || "Unknown"}`,
      id,
      itemToRemove?.category || "Skill Category",
      itemToRemove,
    )
    setResumeData((prev) => ({
      ...prev,
      history: prev.history ? prev.history : [],
      technicalSkills: prev.technicalSkills.filter((skill) => skill.id !== id),
    }))
  }

  const addProject = () => {
    const newId = uuidv4()
    addHistoryEntry("add", "Projects", "Added new project", newId, "New Project")
    setResumeData((prev) => ({
      ...prev,
      projects: [...prev.projects, { id: newId, title: "", technologies: "", description: "", links: "" }],
    }))
  }

  const updateProject = (id: string, field: keyof Project, value: string) => {
    const currentItem = resumeData.projects.find((project) => project.id === id)
    const oldValue = currentItem?.[field]
    if (oldValue !== value && oldValue !== "") {
      addHistoryEntry(
        "edit",
        "Projects",
        `Updated ${field} in "${currentItem?.title || "project"}"`,
        id,
        currentItem?.title || "Project",
        oldValue,
        value,
      )
    }
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((project) => (project.id === id ? { ...project, [field]: value } : project)),
    }))
  }

  const removeProject = (id: string) => {
    const itemToRemove = resumeData.projects.find((project) => project.id === id)
    addHistoryEntry(
      "delete",
      "Projects",
      `Deleted project: ${itemToRemove?.title || "Unknown"}`,
      id,
      itemToRemove?.title || "Project",
      itemToRemove,
    )
    setResumeData((prev) => ({
      ...prev,
      history: prev.history ? prev.history : [],
      projects: prev.projects.filter((project) => project.id !== id),
    }))
  }

  const addExperience = () => {
    const newId = uuidv4()
    addHistoryEntry("add", "Experience", "Added new work experience", newId, "New Experience")
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: newId,
          company: "",
          position: "",
          duration: "",
          location: "",
          description: "",
        },
      ],
    }))
  }

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    const currentItem = resumeData.experience.find((exp) => exp.id === id)
    const oldValue = currentItem?.[field]
    if (oldValue !== value && oldValue !== "") {
      addHistoryEntry(
        "edit",
        "Experience",
        `Updated ${field} in "${currentItem?.company || "experience"}"`,
        id,
        currentItem?.company || "Experience",
        oldValue,
        value,
      )
    }
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)),
    }))
  }

  const removeExperience = (id: string) => {
    const itemToRemove = resumeData.experience.find((exp) => exp.id === id)
    addHistoryEntry(
      "delete",
      "Experience",
      `Deleted experience: ${itemToRemove?.company || "Unknown"}`,
      id,
      itemToRemove?.company || "Experience",
      itemToRemove,
    )
    setResumeData((prev) => ({
      ...prev,
      history: prev.history ? prev.history : [],
      experience: prev.experience.filter((exp) => exp.id !== id),
    }))
  }

  const addAchievement = () => {
    const newId = uuidv4()
    addHistoryEntry("add", "Achievements", "Added new achievement", newId, "New Achievement")
    setResumeData((prev) => ({
      ...prev,
      achievements: [...prev.achievements, { id: newId, title: "", description: "" }],
    }))
  }

  const updateAchievement = (id: string, field: keyof Achievement, value: string) => {
    const currentItem = resumeData.achievements.find((ach) => ach.id === id)
    const oldValue = currentItem?.[field]
    if (oldValue !== value && oldValue !== "") {
      addHistoryEntry(
        "edit",
        "Achievements",
        `Updated ${field} in "${currentItem?.title || "achievement"}"`,
        id,
        currentItem?.title || "Achievement",
        oldValue,
        value,
      )
    }
    setResumeData((prev) => ({
      ...prev,
      achievements: prev.achievements.map((ach) => (ach.id === id ? { ...ach, [field]: value } : ach)),
    }))
  }

  const removeAchievement = (id: string) => {
    const itemToRemove = resumeData.achievements.find((ach) => ach.id === id)
    addHistoryEntry(
      "delete",
      "Achievements",
      `Deleted achievement: ${itemToRemove?.title || "Unknown"}`,
      id,
      itemToRemove?.title || "Achievement",
      itemToRemove,
    )
    setResumeData((prev) => ({
      ...prev,
      history: prev.history ? prev.history : [],
      achievements: prev.achievements.filter((ach) => ach.id !== id),
    }))
  }

  const addCertification = () => {
    const newId = uuidv4()
    addHistoryEntry("add", "Certifications", "Added new certification", newId, "New Certification")
    setResumeData((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), { id: newId, description: "" }],
    }))
  }

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    const currentItem = (resumeData.certifications || []).find((cert) => cert.id === id)
    const oldValue = currentItem?.[field]
    if (oldValue !== value && oldValue !== "") {
      addHistoryEntry(
        "edit",
        "Certifications",
        `Updated ${field} in certification`,
        id,
        "Certification",
        oldValue,
        value,
      )
    }
    setResumeData((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).map((cert) => (cert.id === id ? { ...cert, [field]: value } : cert)),
    }))
  }

  const removeCertification = (id: string) => {
    const itemToRemove = (resumeData.certifications || []).find((cert) => cert.id === id)
    addHistoryEntry(
      "delete",
      "Certifications",
      `Deleted certification`,
      id,
      "Certification",
      itemToRemove,
    )
    setResumeData((prev) => ({
      ...prev,
      history: prev.history ? prev.history : [],
      certifications: (prev.certifications || []).filter((cert) => cert.id !== id),
    }))
  }

  const addExtracurricular = () => {
    const newId = uuidv4()
    addHistoryEntry("add", "Extracurriculars", "Added new extracurricular activity", newId, "New Activity")
    setResumeData((prev) => ({
      ...prev,
      extracurriculars: [
        ...prev.extracurriculars,
        { id: newId, description: "" },
      ],
    }))
  }

  const updateExtracurricular = (id: string, field: keyof Extracurricular, value: string) => {
    const currentItem = resumeData.extracurriculars.find((extra) => extra.id === id)
    const oldValue = currentItem?.[field]
    if (oldValue !== value && oldValue !== "") {
      addHistoryEntry(
        "edit",
        "Extracurriculars",
        `Updated ${field} in extracurricular activity`,
        id,
        "Extracurricular Activity",
        oldValue,
        value,
      )
    }
    setResumeData((prev) => ({
      ...prev,
      extracurriculars: prev.extracurriculars.map((extra) => (extra.id === id ? { ...extra, [field]: value } : extra)),
    }))
  }

  const removeExtracurricular = (id: string) => {
    const itemToRemove = resumeData.extracurriculars.find((extra) => extra.id === id)
    addHistoryEntry(
      "delete",
      "Extracurriculars",
      `Deleted extracurricular activity`,
      id,
      "Extracurricular Activity",
      itemToRemove,
    )
    setResumeData((prev) => ({
      ...prev,
      history: prev.history ? prev.history : [],
      extracurriculars: prev.extracurriculars.filter((extra) => extra.id !== id),
    }))
  }

  // Custom sections management
  const addCustomSection = () => {
    const newSection: CustomSection = {
      id: uuidv4(),
      title: "",
      layout: "full",
      items: [],
    }
    addHistoryEntry("add", "Custom Sections", "Added new custom section", newSection.id, "New Custom Section")
    setResumeData((prev) => ({
      ...prev,
      customSections: [...prev.customSections, newSection],
      sectionOrder: [...prev.sectionOrder, `custom-${newSection.id}`],
    }))
  }

  const updateCustomSection = (sectionId: string, updatedSection: CustomSection) => {
    const currentSection = resumeData.customSections.find((section) => section.id === sectionId)
    if (currentSection && JSON.stringify(currentSection) !== JSON.stringify(updatedSection)) {
      addHistoryEntry(
        "edit",
        "Custom Sections",
        `Updated custom section: ${updatedSection.title || "Untitled"}`,
        sectionId,
        updatedSection.title || "Custom Section",
        currentSection,
        updatedSection,
      )
    }
    setResumeData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((section) => (section.id === sectionId ? updatedSection : section)),
    }))
  }

  const removeCustomSection = (sectionId: string) => {
    const itemToRemove = resumeData.customSections.find((section) => section.id === sectionId)
    addHistoryEntry(
      "delete",
      "Custom Sections",
      `Deleted custom section: ${itemToRemove?.title || "Unknown"}`,
      sectionId,
      itemToRemove?.title || "Custom Section",
      itemToRemove,
    )
    setResumeData((prev) => ({
      ...prev,
      history: prev.history ? prev.history : [],
      customSections: prev.customSections.filter((section) => section.id !== sectionId),
      sectionOrder: prev.sectionOrder.filter((order) => order !== `custom-${sectionId}`),
    }))
  }

  // Section reordering
  const reorderSections = (startIndex: number, endIndex: number) => {
    const oldOrder = [...resumeData.sectionOrder]
    addHistoryEntry(
      "reorder",
      "Section Order",
      `Reordered sections from position ${startIndex} to ${endIndex}`,
      undefined,
      "Section Order",
      oldOrder,
    )
    setResumeData((prev) => {
      const newOrder = Array.from(prev.sectionOrder)
      const [removed] = newOrder.splice(startIndex, 1)
      newOrder.splice(endIndex, 0, removed)
      return { ...prev, sectionOrder: newOrder }
    })
  }

  const sectionTitles: { [key: string]: string } = {
    education: "Education",
    technicalSkills: "Technical Skills",
    experience: "Professional Experience",
    projects: "Projects",
    achievements: "Achievements",
    certifications: "Certifications",
    extracurriculars: "Extracurriculars",
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">

      {/* Section Reordering Panel */}
      <section className="border border-border p-4 rounded-lg bg-card/50 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Manage Section Order</h2>
            <p className="text-xs text-muted-foreground">Adjust layout order of sections in your resume</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLayoutOpen(!isLayoutOpen)}
            className="text-xs"
          >
            {isLayoutOpen ? "Hide Layout Manager" : "Show Layout Manager"}
          </Button>
        </div>
        {isLayoutOpen && (
          <div className="space-y-2 mt-3 pt-3 border-t border-border">
            {(resumeData.sectionOrder || ["education", "technicalSkills", "experience", "projects", "achievements", "certifications", "extracurriculars"]).map((sectionKey, index, arr) => {
              let title = sectionTitles[sectionKey] || sectionKey
              if (sectionKey.startsWith("custom-")) {
                const customId = sectionKey.replace("custom-", "")
                const custom = resumeData.customSections.find((s) => s.id === customId)
                title = custom?.title ? `Custom: ${custom.title}` : "Untitled Custom Section"
              }

              return (
                <div key={sectionKey} className="flex items-center justify-between p-2 bg-background border border-border rounded-md shadow-sm">
                  <span className="text-xs font-medium text-foreground">{title}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0}
                      onClick={() => reorderSections(index, index - 1)}
                      title="Move Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === arr.length - 1}
                      onClick={() => reorderSections(index, index + 1)}
                      title="Move Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Personal Information */}
      <section className="space-y-4" ref={el => { sectionRefs.current["personal-info"] = el }} id="personal-info">
        <h2 className="text-xl font-semibold text-foreground">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={resumeData.personalInfo.name}
              onChange={(e) => updatePersonalInfo("name", e.target.value)}
              placeholder="Your Name"
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={resumeData.personalInfo.location}
              onChange={(e) => updatePersonalInfo("location", e.target.value)}
              placeholder="City, State, Country"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={resumeData.personalInfo.phone}
              onChange={(e) => updatePersonalInfo("phone", e.target.value)}
              placeholder="+91-1234567890"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={resumeData.personalInfo.email}
              onChange={(e) => updatePersonalInfo("email", e.target.value)}
              placeholder="name@gmail.com"
            />
          </div>
          <div>
            <Label htmlFor="linkedin">LinkedIn Username</Label>
            <Input
              id="linkedin"
              value={resumeData.personalInfo.linkedin}
              onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
              placeholder="your username"
            />
          </div>
          <div>
            <Label htmlFor="github">GitHub Username</Label>
            <Input
              id="github"
              value={resumeData.personalInfo.github}
              onChange={(e) => updatePersonalInfo("github", e.target.value)}
              placeholder="your username"
            />
          </div>
          <div>
            <Label htmlFor="leetcode">LeetCode Username</Label>
            <Input
              id="leetcode"
              value={resumeData.personalInfo.leetcode}
              onChange={(e) => updatePersonalInfo("leetcode", e.target.value)}
              placeholder="your username"
            />
          </div>
        </div>
      </section>

      {/* Education */}
      <section className="space-y-4" ref={el => { sectionRefs.current["education"] = el }} id="education">
        <h2 className="text-xl font-semibold text-foreground">Education</h2>
        {resumeData.education.map((edu) => (
          <div key={edu.id} className="border border-border p-4 rounded-md space-y-3 relative">
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={() => removeEducation(edu.id)}
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
            <div>
              <Label htmlFor={`institution-${edu.id}`}>Institution</Label>
              <Input
                id={`institution-${edu.id}`}
                value={edu.institution}
                onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                placeholder="University Name"
              />
            </div>
            <div>
              <Label htmlFor={`degree-${edu.id}`}>Degree/Field of Study</Label>
              <Input
                id={`degree-${edu.id}`}
                value={edu.degree}
                onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                placeholder="Bachelor of Science in Computer Science"
              />
            </div>
            <div>
              <Label htmlFor={`duration-${edu.id}`}>Duration</Label>
              <Input
                id={`duration-${edu.id}`}
                value={edu.duration}
                onChange={(e) => updateEducation(edu.id, "duration", e.target.value)}
                placeholder="2020 - 2024"
              />
            </div>
            <div>
              <Label htmlFor={`location-edu-${edu.id}`}>Location</Label>
              <Input
                id={`location-edu-${edu.id}`}
                value={edu.location}
                onChange={(e) => updateEducation(edu.id, "location", e.target.value)}
                placeholder="City, State"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`grade-format-${edu.id}`}>Grade Format</Label>
                <Select
                  value={edu.gradeFormat}
                  onValueChange={(value: "CGPA" | "Percentage" | "") => updateEducation(edu.id, "gradeFormat", value)}
                >
                  <SelectTrigger id={`grade-format-${edu.id}`}>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CGPA">CGPA</SelectItem>
                    <SelectItem value="Percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {edu.gradeFormat && (
                <div>
                  <Label htmlFor={`grade-value-${edu.id}`}>
                    {edu.gradeFormat === "CGPA" ? "CGPA Value" : "Percentage Value"}
                  </Label>
                  <Input
                    id={`grade-value-${edu.id}`}
                    value={edu.gradeValue}
                    onChange={(e) => updateEducation(edu.id, "gradeValue", e.target.value)}
                    placeholder={edu.gradeFormat === "CGPA" ? "3.8/4.0" : "90%"}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full bg-transparent" onClick={addEducation}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Education
        </Button>
      </section>

      {/* Technical Skills */}
      <section className="space-y-4" ref={el => { sectionRefs.current["technical-skills"] = el }} id="technical-skills">
        <h2 className="text-xl font-semibold text-foreground">Technical Skills</h2>
        {resumeData.technicalSkills.map((skill) => (
          <div key={skill.id} className="border border-border p-4 rounded-md space-y-3 relative">
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={() => removeTechnicalSkill(skill.id)}
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
            <div>
              <Label htmlFor={`category-${skill.id}`}>Category</Label>
              <Input
                id={`category-${skill.id}`}
                value={skill.category}
                onChange={(e) => updateTechnicalSkill(skill.id, "category", e.target.value)}
                placeholder="Programming Languages"
              />
            </div>
            <div>
              <Label htmlFor={`skills-${skill.id}`}>Skills</Label>
              <Textarea
                id={`skills-${skill.id}`}
                value={skill.skills}
                onChange={(e) => updateTechnicalSkill(skill.id, "skills", e.target.value)}
                placeholder="Python, Java, JavaScript, C++"
              />
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full bg-transparent" onClick={addTechnicalSkill}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Technical Skill
        </Button>
      </section>

      {/* Projects */}
      <section className="space-y-4" ref={el => { sectionRefs.current["projects"] = el }} id="projects">
        <h2 className="text-xl font-semibold text-foreground">Projects</h2>
        {resumeData.projects.map((project) => (
          <div key={project.id} className="border border-border p-4 rounded-md space-y-3 relative">
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={() => removeProject(project.id)}
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
            <div>
              <Label htmlFor={`project-title-${project.id}`}>Title</Label>
              <Input
                id={`project-title-${project.id}`}
                value={project.title}
                onChange={(e) => updateProject(project.id, "title", e.target.value)}
                placeholder="My Awesome Project"
              />
            </div>
            <div>
              <Label htmlFor={`project-technologies-${project.id}`}>Technologies Used</Label>
              <Input
                id={`project-technologies-${project.id}`}
                value={project.technologies}
                onChange={(e) => updateProject(project.id, "technologies", e.target.value)}
                placeholder="React, Node.js, MongoDB"
              />
            </div>
            <div>
              <Label htmlFor={`project-description-${project.id}`}>
                Description (use bullet points for multiple lines)
              </Label>
              <Textarea
                id={`project-description-${project.id}`}
                value={project.description || ""}
                onChange={(e) => updateProject(project.id, "description", e.target.value)}
                placeholder="• Developed a responsive UI\n• Implemented RESTful APIs"
                maxLength={500}
              />
              <CharacterCounter current={(project.description || "").length} max={500} className="mt-1" />
            </div>
            <div>
              <Label htmlFor={`project-links-${project.id}`}>Links (e.g., GitHub, Live Demo - separate with |)</Label>
              <Input
                id={`project-links-${project.id}`}
                value={project.links}
                onChange={(e) => updateProject(project.id, "links", e.target.value)}
                placeholder="github.com/user/repo | live-demo.com"
              />
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full bg-transparent" onClick={addProject}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </section>

      {/* Professional Experience */}
      <section className="space-y-4" ref={el => { sectionRefs.current["experience"] = el }} id="experience">
        <h2 className="text-xl font-semibold text-foreground">Professional Experience</h2>
        {resumeData.experience.map((exp) => (
          <div key={exp.id} className="border border-border p-4 rounded-md space-y-3 relative">
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={() => removeExperience(exp.id)}
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
            <div>
              <Label htmlFor={`company-${exp.id}`}>Company</Label>
              <Input
                id={`company-${exp.id}`}
                value={exp.company}
                onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                placeholder="Tech Solutions Inc."
              />
            </div>
            <div>
              <Label htmlFor={`position-${exp.id}`}>Position</Label>
              <Input
                id={`position-${exp.id}`}
                value={exp.position}
                onChange={(e) => updateExperience(exp.id, "position", e.target.value)}
                placeholder="Software Engineer"
              />
            </div>
            <div>
              <Label htmlFor={`duration-exp-${exp.id}`}>Duration</Label>
              <Input
                id={`duration-exp-${exp.id}`}
                value={exp.duration}
                onChange={(e) => updateExperience(exp.id, "duration", e.target.value)}
                placeholder="Jan 2022 - Present"
              />
            </div>
            <div>
              <Label htmlFor={`location-exp-${exp.id}`}>Location</Label>
              <Input
                id={`location-exp-${exp.id}`}
                value={exp.location}
                onChange={(e) => updateExperience(exp.id, "location", e.target.value)}
                placeholder="San Francisco, CA"
              />
            </div>
            <div>
              <Label htmlFor={`description-exp-${exp.id}`}>Description (use bullet points for multiple lines)</Label>
              <Textarea
                id={`description-exp-${exp.id}`}
                value={exp.description || ""}
                onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                placeholder="• Developed and maintained web applications\n• Collaborated with cross-functional teams"
                maxLength={500}
              />
              <CharacterCounter current={(exp.description || "").length} max={500} className="mt-1" />
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full bg-transparent" onClick={addExperience}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Experience
        </Button>
      </section>

      {/* Achievements */}
      <section className="space-y-4" ref={el => { sectionRefs.current["achievements"] = el }} id="achievements">
        <h2 className="text-xl font-semibold text-foreground">Achievements</h2>
        {resumeData.achievements.map((ach) => (
          <div key={ach.id} className="border border-border p-4 rounded-md space-y-3 relative bg-muted/10">
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 cursor-pointer"
              onClick={() => removeAchievement(ach.id)}
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
            <div>
              <Label htmlFor={`achievement-description-${ach.id}`}>
                Achievement Bullet Point
              </Label>
              <Textarea
                id={`achievement-description-${ach.id}`}
                value={ach.description || ""}
                onChange={(e) => updateAchievement(ach.id, "description", e.target.value)}
                placeholder="e.g., Won first place in national coding competition out of 500+ participants."
                maxLength={500}
                className="mt-1.5"
              />
              <CharacterCounter current={(ach.description || "").length} max={500} className="mt-1" />
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full bg-transparent" onClick={addAchievement}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Achievement
        </Button>
      </section>

      {/* Certifications */}
      <section className="space-y-4" ref={el => { sectionRefs.current["certifications"] = el }} id="certifications">
        <h2 className="text-xl font-semibold text-foreground">Certifications</h2>
        {(resumeData.certifications || []).map((cert) => (
          <div key={cert.id} className="border border-border p-4 rounded-md space-y-3 relative bg-muted/10">
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 cursor-pointer"
              onClick={() => removeCertification(cert.id)}
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
            <div>
              <Label htmlFor={`certification-description-${cert.id}`}>
                Certification / Course / Award
              </Label>
              <Textarea
                id={`certification-description-${cert.id}`}
                value={cert.description || ""}
                onChange={(e) => updateCertification(cert.id, "description", e.target.value)}
                placeholder="e.g., AWS Certified Solutions Architect (2024)"
                maxLength={500}
                className="mt-1.5"
              />
              <CharacterCounter current={(cert.description || "").length} max={500} className="mt-1" />
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full bg-transparent" onClick={addCertification}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Certification
        </Button>
      </section>

      {/* Extracurriculars */}
      <section className="space-y-4" ref={el => { sectionRefs.current["extracurriculars"] = el }} id="extracurriculars">
        <h2 className="text-xl font-semibold text-foreground">Extracurriculars</h2>
        {resumeData.extracurriculars.map((extra) => (
          <div key={extra.id} className="border border-border p-4 rounded-md space-y-3 relative bg-muted/10">
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 cursor-pointer"
              onClick={() => removeExtracurricular(extra.id)}
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
            <div>
              <Label htmlFor={`extracurricular-description-${extra.id}`}>
                Extracurricular Activity / Volunteer Work
              </Label>
              <Textarea
                id={`extracurricular-description-${extra.id}`}
                value={extra.description || ""}
                onChange={(e) => updateExtracurricular(extra.id, "description", e.target.value)}
                placeholder="e.g., Volunteer Developer at local NGO, leading a team of 4 people."
                maxLength={500}
                className="mt-1.5"
              />
              <CharacterCounter current={(extra.description || "").length} max={500} className="mt-1" />
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full bg-transparent" onClick={addExtracurricular}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Extracurricular
        </Button>
      </section>

      {/* Custom Sections */}
      <section className="space-y-4" ref={el => { sectionRefs.current["custom-sections"] = el }} id="custom-sections">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Custom Sections</h2>
          <Button variant="outline" onClick={addCustomSection} size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>
        {resumeData.customSections.map((section) => (
          <div key={section.id} className="border border-border p-4 rounded-md">
            <CustomSectionForm
              section={section}
              onUpdate={(updatedSection) => updateCustomSection(section.id, updatedSection)}
              onDelete={() => removeCustomSection(section.id)}
            />
          </div>
        ))}
      </section>

      {/* Floating Selection Formatting Bubble */}
      {selectionBox.visible && (
        <div
          className="absolute z-[9999] flex items-center gap-1.5 bg-slate-950 text-white rounded-lg shadow-2xl px-2 py-1 border border-slate-800 text-xs select-none transition-all duration-150 transform -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `${selectionBox.x}px`,
            top: `${selectionBox.y}px`,
          }}
        >
          <button
            onClick={() => applyFormatting("bold")}
            className="p-1 hover:bg-slate-800 rounded font-bold cursor-pointer transition-colors duration-150 flex items-center justify-center w-6 h-6 text-xs text-slate-100 hover:text-white"
            title="Bold"
          >
            B
          </button>
          <div className="w-[1px] h-3 bg-slate-800" />
          <button
            onClick={() => applyFormatting("italic")}
            className="p-1 hover:bg-slate-800 rounded italic cursor-pointer transition-colors duration-150 flex items-center justify-center w-6 h-6 text-xs text-slate-100 hover:text-white"
            title="Italic"
          >
            I
          </button>
          {/* Arrow pointing down */}
          <div className="absolute left-1/2 bottom-0 w-1.5 h-1.5 bg-slate-950 border-r border-b border-slate-800 transform -translate-x-1/2 translate-y-1/2 rotate-45" />
        </div>
      )}
    </div>
  )
}
