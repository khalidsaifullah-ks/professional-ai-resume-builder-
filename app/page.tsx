"use client"

import { useState, useEffect, useRef } from "react"
import { ResumeForm } from "@/components/resume-form"
import { ResumePreview } from "@/components/resume-preview"
import { Button } from "@/components/ui/button"
import { Download, RotateCcw, Save, CheckCircle, Settings, Sparkles, BookOpen, ChevronDown, ChevronUp, Upload, MessageSquare, Target } from "lucide-react"
import { generateHTMLToDOCX } from "@/lib/html-to-docx-generator"
import { generatePDF } from "@/lib/pdf-generator"
import { ThemeToggle } from "@/components/theme-toggle"
import { PROMPT_CATEGORIES } from "@/lib/prompts"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const FONTS_LIST = [
  { id: "arial", name: "Arial (Sans-Serif)", value: "Arial, Helvetica, sans-serif" },
  { id: "latex", name: "LaTeX (Computer Modern)", value: '"Computer Modern", "Latin Modern Roman", "CMU Serif", Georgia, "Times New Roman", Times, serif' },
  { id: "georgia", name: "Georgia (Elegant Serif)", value: "Georgia, serif" },
  { id: "times", name: "Times New Roman", value: '"Times New Roman", Times, serif' },
  { id: "monospace", name: "Monospace", value: '"Courier New", Courier, monospace' }
]

export interface PersonalInfo {
  name: string
  location: string
  phone: string
  email: string
  linkedin: string
  github: string
  leetcode: string
}

export interface Education {
  id: string
  institution: string
  degree: string
  duration: string
  location: string
  gradeFormat?: "CGPA" | "Percentage" | ""
  gradeValue?: string
}

export interface TechnicalSkill {
  id: string
  category: string
  skills: string
}

export interface Project {
  id: string
  title: string
  technologies: string
  description: string
  links?: string
}

export interface Experience {
  id: string
  company: string
  position: string
  duration: string
  location: string
  description: string
}

export interface Achievement {
  id: string
  title: string
  description: string
}

export interface Certification {
  id: string
  description: string
}

export interface Extracurricular {
  id: string
  description: string
}

export interface CustomSection {
  id: string
  title: string
  layout?: "full" | "bullet" | "text"
  items: {
    id: string
    title: string
    subtitle?: string
    description: string
    duration?: string
    location?: string
  }[]
}

export interface HistoryEntry {
  id: string
  timestamp: number
  action: "add" | "edit" | "delete" | "reorder"
  section: string
  itemId?: string
  itemTitle?: string
  oldValue?: any
  newValue?: any
  description: string
}

export interface ResumeData {
  personalInfo: PersonalInfo
  education: Education[]
  technicalSkills: TechnicalSkill[]
  projects: Project[]
  experience: Experience[]
  achievements: Achievement[]
  certifications: Certification[]
  extracurriculars: Extracurricular[]
  customSections: CustomSection[]
  sectionOrder: string[]
  history: HistoryEntry[]
}

const initialData: ResumeData = {
  personalInfo: {
    name: "",
    location: "",
    phone: "",
    email: "",
    linkedin: "",
    github: "",
    leetcode: "",
  },
  education: [],
  technicalSkills: [],
  projects: [],
  experience: [],
  achievements: [],
  certifications: [],
  extracurriculars: [],
  customSections: [],
  sectionOrder: ["education", "technicalSkills", "experience", "projects", "achievements", "certifications", "extracurriculars"],
  history: [],
}

const STORAGE_KEY = "halfbaked-resume-data" // Updated storage key to match new branding
const AUTO_SAVE_DELAY = 2000 // 2 seconds
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyAS7cOgH-KH0iaucOhsRsWrOX_q3P84MuY";
const GEMINI_MODEL = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-2.5-flash";

export default function ResumePage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string }[]>([]);
  const [customApiKey, setCustomApiKey] = useState<string>("")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [customInstructions, setCustomInstructions] = useState("")
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importInput, setImportInput] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [jobDescription, setJobDescription] = useState("")
  const [isTailoring, setIsTailoring] = useState(false)
  const [isTailorOpen, setIsTailorOpen] = useState(false)
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  const chatMessagesEndRef = useRef<HTMLDivElement>(null)
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [selectedFont, setSelectedFont] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("halfbaked-resume-font") || "Arial, Helvetica, sans-serif"
    }
    return "Arial, Helvetica, sans-serif"
  })

  useEffect(() => {
    localStorage.setItem("halfbaked-resume-font", selectedFont)
  }, [selectedFont])

  const [pendingUpdate, setPendingUpdate] = useState<any | null>(null)
  const [undoStack, setUndoStack] = useState<any[]>([])
  const [toastMessage, setToastMessage] = useState<{ text: string; actionText?: string; onAction?: () => void } | null>(null)

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Auto-grow textarea height
  useEffect(() => {
    const textarea = chatInputRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    const newHeight = Math.min(textarea.scrollHeight, 160)
    textarea.style.height = `${Math.max(newHeight, 48)}px`
  }, [chatInput])

  // Scroll chat to bottom
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages, isChatLoading])

  const getActiveApiKey = () => {
    return customApiKey || GEMINI_API_KEY;
  }

  const ensureApiKey = (actionName: string) => {
    if (!customApiKey.trim()) {
      setIsSettingsOpen(true);
      setToastMessage({
        text: `Please configure your custom Gemini API Key first to ${actionName}.`,
      });
      return false;
    }
    return true;
  };

  const applyPendingUpdate = () => {
    if (pendingUpdate) {
      setUndoStack(prev => [...prev, resumeData])
      setResumeData({
        ...resumeData,
        ...pendingUpdate,
        history: []
      })
      setPendingUpdate(null)
      setToastMessage({
        text: "Resume updated successfully!",
        actionText: "Undo",
        onAction: () => {
          if (undoStack.length > 0) {
            const previous = undoStack[undoStack.length - 1];
            setUndoStack(prev => prev.slice(0, -1));
            setResumeData(previous);
            setToastMessage({ text: "Changes reverted." });
          }
        }
      })
    }
  }

  async function handleConversationalReview() {
    if (!ensureApiKey("review your resume")) return;
    // Add user message
    setChatMessages(prev => [
      ...prev,
      { sender: "user", text: "Please review my resume." }
    ]);
    
    // Add AI temporary loading message
    setChatMessages(prev => [
      ...prev,
      { sender: "ai", text: "Analyzing your resume details and preparing feedback..." }
    ]);

    try {
      const activeKey = getActiveApiKey();
      const prompt = `Analyze this resume and give personalized feedback, tips, improvements, and suggest better wording, formatting, or missing sections.
Resume Data: ${JSON.stringify(resumeData)}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${activeKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`AI review failed: ${response.status}`);
      }
      const data = await response.json();
      let feedback = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No feedback returned.";
      
      // Clean basic markdown formatting
      feedback = feedback.replace(/\*\*(.*?)\*\*/g, '$1') // bold
      feedback = feedback.replace(/\*(.*?)\*/g, '$1') // italics
      feedback = feedback.replace(/`([^`]*)`/g, '$1') // inline code
      feedback = feedback.replace(/^#+\s*/gm, '') // headings
      feedback = feedback.replace(/^- /gm, '') // bullet points
      feedback = feedback.replace(/\n{2,}/g, '\n') // collapse newlines

      // Replace the loading message with the real feedback!
      setChatMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.map(m => m.sender).lastIndexOf("ai");
        if (lastIdx !== -1) {
          updated[lastIdx] = { sender: "ai", text: feedback };
        } else {
          updated.push({ sender: "ai", text: feedback });
        }
        return updated;
      });

    } catch (err) {
      const errorMsg = "Error getting review: " + (err instanceof Error ? err.message : "Unknown error");
      setChatMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.map(m => m.sender).lastIndexOf("ai");
        if (lastIdx !== -1) {
          updated[lastIdx] = { sender: "ai", text: errorMsg };
        } else {
          updated.push({ sender: "ai", text: errorMsg });
        }
        return updated;
      });
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        const base64Data = result.split(",")[1]
        resolve(base64Data)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  function fileToText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  async function fetchGeminiWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 3,
    initialDelay = 1000
  ): Promise<Response> {
    let attempt = 0
    while (attempt < maxRetries) {
      try {
        const response = await fetch(url, options)
        if (response.ok) {
          return response
        }
        
        // Retry on 503 (Service Unavailable) or 429 (Rate Limit)
        if (response.status === 503 || response.status === 429) {
          attempt++
          if (attempt >= maxRetries) {
            return response
          }
          const delay = initialDelay * Math.pow(2, attempt - 1)
          console.warn(`Gemini API returned status ${response.status}. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
        
        return response
      } catch (error) {
        attempt++
        if (attempt >= maxRetries) {
          throw error
        }
        const delay = initialDelay * Math.pow(2, attempt - 1)
        console.warn(`Fetch error: ${error instanceof Error ? error.message : String(error)}. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
    throw new Error("API request failed after max retries")
  }

  async function handleAIImportDirect(file: File) {
    if (!ensureApiKey("autofill your resume")) return;
    setIsImporting(true)
    try {
      const activeKey = getActiveApiKey()
      const parts: any[] = []

      if (file.type === "text/plain") {
        const fileText = await fileToText(file)
        parts.push({ text: `Attached Resume File Content:\n${fileText}` })
      } else {
        const base64 = await fileToBase64(file)
        parts.push({
          inlineData: {
            mimeType: file.type,
            data: base64
          }
        })
      }

      let prompt = `You are a professional resume parsing assistant. Parse the provided resume file or details into the required JSON format.

# STRICT OUTPUT FORMAT

Return ONLY a valid JSON object.

The JSON below is the REQUIRED output format.
It is NOT an example.

Your response MUST exactly match the structure below.

## General Rules

- Return only JSON.
- Do not use markdown.
- Do not wrap the JSON inside \`\`\`json\`\`\`.
- Do not add explanations.
- Do not add comments.
- Do not add extra fields.
- Do not rename fields.
- Do not remove fields.
- Preserve the exact nesting.
- Preserve the exact data types.
- The response must be directly parsable using JSON.parse().

## Resume Rules

- Generate an ATS-friendly resume.
- Keep the resume to **one page whenever possible**.
- Prefer using **at most SIX major sections**.

Preferred section order:

1. Education
2. Technical Skills
3. Experience
4. Projects
5. Achievements
6. Certifications

Extracurriculars are optional.

Custom Sections are optional.

Always try to fit information into the existing sections first.

Only create Custom Sections when:

• information does not naturally belong to any existing section.

OR

• merging two small sections results in a cleaner one-page resume.

Example:

Instead of

- Certifications
- Extracurriculars

you may create

"Certifications & Activities"

as a Custom Section.

Do NOT create unnecessary Custom Sections.

## Personal Information Rules

linkedin = LinkedIn username only

github = GitHub username only

leetcode = LeetCode username only

Never use profile URLs.

## Skills Rules

skills must be a comma separated string.

## Projects Rules

technologies must be a comma separated string.

description must contain bullet points separated using newline (\\n).

links should contain repository name, demo URL or other project reference.

## Experience Rules

description must contain bullet points separated using newline (\\n).

# CUSTOM SECTION FORMAT

A Custom Section MUST use EXACTLY ONE layout.

────────────────────────────────

layout = "full"

Use when every entry has

- title
- subtitle
- duration
- location
- description

Each item MUST be

{
"id":"",
"title":"",
"subtitle":"",
"description":"Bullet 1\\nBullet 2",
"duration":"",
"location":""
}

All fields are used.

────────────────────────────────

layout = "bullet"

Use for short bullet lists.

Examples

Languages

Interests

Responsibilities

Volunteer Work

Each bullet is ONE item.

Each item MUST be

{
"id":"",
"title":"Bullet text",
"subtitle":"",
"description":"",
"duration":"",
"location":""
}

Only title is used.

All remaining fields MUST stay empty.

────────────────────────────────

layout = "text"

Use for paragraph style sections.

Examples

Summary

Research

Objective

Publication Notes

Each item MUST be

{
"id":"",
"title":"Heading",
"subtitle":"",
"description":"Paragraph",
"duration":"",
"location":""
}

Only title and description are used.

subtitle, duration and location MUST remain empty.

────────────────────────────────

Never mix layouts inside one custom section.

Every item inside a custom section MUST follow its selected layout.

## IDs

Generate unique IDs.

Examples

edu1

skill1

proj1

exp1

ach1

cert1

extra1

Custom Sections may use UUIDs.

## sectionOrder

Include only sections that actually contain data.

If a custom section exists, reference it as

custom-<customSectionId>

## history

Always return

[]

────────────────────────────────────────

REQUIRED JSON FORMAT

{
  "personalInfo": {
    "name": "",
    "location": "",
    "phone": "",
    "email": "",
    "linkedin": "",
    "github": "",
    "leetcode": ""
  },

  "education": [
    {
      "id": "edu1",
      "institution": "",
      "degree": "",
      "duration": "",
      "location": "",
      "gradeFormat": "",
      "gradeValue": ""
    }
  ],

  "technicalSkills": [
    {
      "id": "skill1",
      "category": "",
      "skills": ""
    }
  ],

  "projects": [
    {
      "id": "proj1",
      "title": "",
      "technologies": "",
      "description": "",
      "links": ""
    }
  ],

  "experience": [
    {
      "id": "exp1",
      "company": "",
      "position": "",
      "duration": "",
      "location": "",
      "description": ""
    }
  ],

  "achievements": [
    {
      "id": "ach1",
      "description": ""
    }
  ],

  "certifications": [
    {
      "id": "cert1",
      "description": ""
    }
  ],

  "extracurriculars": [
    {
      "id": "extra1",
      "description": ""
    }
  ],

  "customSections": [
    {
      "id": "custom-section-id",
      "title": "",
      "layout": "full",
      "items": [
        {
          "id": "custom-item-id",
          "title": "",
          "subtitle": "",
          "description": "",
          "duration": "",
          "location": ""
        }
      ]
    }
  ],

  "sectionOrder": [
    "education",
    "technicalSkills",
    "experience",
    "projects",
    "achievements",
    "certifications",
    "extracurriculars",
    "custom-<customSectionId>"
  ],

  "history": []
}`

      parts.push({ text: prompt })

      const response = await fetchGeminiWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${activeKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      })
      if (!response.ok) {
        throw new Error(`AI import failed: ${response.status}`)
      }
      const resData = await response.json()
      const parsedText = resData?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!parsedText) throw new Error("Empty response from AI")

      const parsedJSON = JSON.parse(parsedText)
      const finalJSON = {
        ...initialData,
        ...parsedJSON,
        sectionOrder: parsedJSON.sectionOrder || initialData.sectionOrder,
        customSections: parsedJSON.customSections || [],
        history: []
      }

      setPendingUpdate(finalJSON)
      setSelectedFile(null)
      
      setChatMessages(prev => [
        ...prev,
        { sender: "ai", text: `I have parsed your uploaded file (${file.name})! Please review the proposed changes and click 'Accept Changes' at the top of the AI Assistant panel to populate your resume.` }
      ])
    } catch (err) {
      console.error(err)
      setChatMessages(prev => [
        ...prev,
        { sender: "ai", text: "Error parsing resume: " + (err instanceof Error ? err.message : "Unknown error") }
      ])
    } finally {
      setIsImporting(false)
    }
  }

  async function handleTailorResume() {
    if (!ensureApiKey("tailor your resume")) return;
    if (!jobDescription.trim()) return
    setIsTailoring(true)
    try {
      const activeKey = getActiveApiKey()
      const prompt = `You are a professional resume optimization assistant. Tailor the current resume JSON to match and align with the target Job Description below.

Rules:
1. Return ONLY a valid JSON object matching the original resume schema structure. No markdown formatting, no backticks, no comments, no extra text outside the JSON.
2. Review and rewrite project descriptions, technical skills, and experience bullet points to emphasize skills, keywords, and qualifications mentioned in the job description.
3. Keep all factual details like company names, job positions, institution names, locations, dates, and personal details exactly the same.
4. For all list items, preserve their original string IDs.
5. Single-Page Constraint: Always prioritize fitting the resume on exactly ONE page. A single page can mostly accommodate a maximum of 6 major sections/items in total (e.g., Education, Technical Skills, Professional Experience, Projects, Achievements, and one more like Certifications or Extracurriculars ). Keep content and bullet points concise to stay within this limit.

Current Resume JSON:
${JSON.stringify(resumeData)}

Target Job Description:
${jobDescription}`

      const response = await fetchGeminiWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${activeKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      })
      if (!response.ok) {
        throw new Error(`AI tailoring failed: ${response.status}`)
      }
      const resData = await response.json()
      const parsedText = resData?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!parsedText) throw new Error("Empty response from AI")

      const parsedJSON = JSON.parse(parsedText)
      const finalJSON = {
        ...resumeData,
        ...parsedJSON,
        history: []
      }

      setPendingUpdate(finalJSON)
      setIsTailorOpen(false)
      setJobDescription("")
      
      // Append conversational success message to chat
      setChatMessages(prev => [
        ...prev,
        { sender: "ai", text: "I have optimized your resume to align with the job description! I highlighted matching skills, tailored experiences, and adjusted project descriptions. Please click 'Accept Changes' at the top of the AI Assistant panel to apply these changes." }
      ])
    } catch (err) {
      console.error(err)
      alert("Error tailoring resume: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setIsTailoring(false)
    }
  }
  // PDF feature removed
  const [resumeData, setResumeData] = useState<ResumeData>(initialData)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  // Remove history UI and state

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        if (!parsed.sectionOrder) {
          parsed.sectionOrder = [
            "education",
            "technicalSkills",
            "experience",
            "projects",
            "achievements",
            "extracurriculars",
          ]
        }
        if (!parsed.customSections) {
          parsed.customSections = []
        }
        // Remove history restoration
        setResumeData(parsed)
        setLastSaved(new Date(parsed.lastSaved || Date.now()))
      } catch (error) {
        console.error("Error loading saved data:", error)
      }
    }

    const savedKey = localStorage.getItem("user-gemini-api-key")
    if (savedKey) {
      setCustomApiKey(savedKey)
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()

    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Auto-saving removed

  const handleDownloadHTMLDOCX = async () => {
    await generateHTMLToDOCX(resumeData)
  }

  const handleDownloadPDF = async () => {
    await generatePDF(resumeData)
  }

  const handleDownloadJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(resumeData, null, 2)
    )}`
    const downloadAnchor = document.createElement("a")
    downloadAnchor.setAttribute("href", jsonString)
    const name = resumeData.personalInfo.name ? resumeData.personalInfo.name.replace(/\s+/g, "_") : "Resume"
    downloadAnchor.setAttribute("download", `${name}_Resume.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
      setResumeData(initialData)
      localStorage.removeItem(STORAGE_KEY)
      setLastSaved(null)
    }
  }

  const handleManualSave = () => {
    const dataToSave = {
      ...resumeData,
      lastSaved: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    setLastSaved(new Date())
  }

  async function fetchGeminiChatResponse(message: string) {
    const activeKey = getActiveApiKey();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${activeKey}`;
    
    const systemInstruction = `You are an AI Resume Assistant. The user is currently building/editing their resume.
Current Resume JSON:
${JSON.stringify(resumeData)}

Your rules:
1. Answer the user's questions about resume writing, formatting, or job search.
2. If the user asks you to modify, add, or delete any content in their resume (e.g. "Add a project called X", "Change my email", "Rewrite my experience bullet points", etc.):
   - Edit the provided Resume JSON according to their request.
   - Return the FULL updated Resume JSON object wrapped inside tags like this: <JSON_UPDATE>YOUR_UPDATED_JSON_OBJECT_HERE</JSON_UPDATE>
   - Ensure the JSON is valid and matches the exact original schema structure. Keep all other sections intact.
   - Provide a brief, friendly text response outside the tags explaining what changes you made. Always mention to the user that they can review and apply these changes by clicking "Accept Changes" at the top of the AI Assistant panel.
3. Achievements, Certifications, and Extracurriculars section rules:
   - Achievements, Certifications, and Extracurriculars entries are simple bullet points. The "description" field contains the text (supporting multiple lines separated by newlines). Other fields (like title, organization, designation, duration) are deprecated and no longer used in these sections, so omit them.
4. Custom sections rules:
   - Custom sections can be added according to the user's needs. Each custom section has a "layout" field which can be "full" (headers + bullets), "bullet" (simple list of bullet points, great for Certifications, Languages, Skills), or "text" (paragraph layout without bullets).
   - Use the appropriate layout style based on the content (e.g., set layout to "bullet" for list of certifications).
5. Auto-bolding:
   - Automatically bold important keywords (such as skills, metrics, technologies, tools, impact numbers) using markdown **keyword** in summary, experiences, projects, achievements, and custom sections. You can also use *italic* for secondary emphasis.
6. If the user is just asking a question and not requesting an edit, do NOT output any <JSON_UPDATE> tags.
7. Single-Page Constraint & Page-Sense Guidelines:
   - Always prioritize fitting the resume on exactly ONE page. A single page can mostly accommodate a maximum of 6 major sections/items in total (e.g., Education, Technical Skills, Professional Experience, Projects, Achievements, and one more like Certifications or Extracurriculars). Keep content and bullet points concise to stay within this limit.`;

    const body = {
      contents: [
        {
          parts: [
            { text: `${systemInstruction}\n\nUser Message: ${message}` }
          ]
        }
      ]
    };
    try {
      const response = await fetchGeminiWithRetry(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";
    } catch (err) {
      return "Error connecting to AI service.";
    }
  }

  function handleSendChat() {
    if (!ensureApiKey("chat with the AI Assistant")) return;
    if (chatInput.trim() && !isChatLoading) {
      setChatMessages(prev => [
        ...prev,
        { sender: "user", text: chatInput }
      ]);
      const userMessage = chatInput;
      setChatInput("");
      setIsChatLoading(true);
      
      fetchGeminiChatResponse(userMessage).then(aiText => {
        let cleanText = aiText;
        const jsonMatch = aiText.match(/<JSON_UPDATE>([\s\S]*?)<\/JSON_UPDATE>/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const parsedJSON = JSON.parse(jsonMatch[1].trim());
            if (parsedJSON.personalInfo) {
              setPendingUpdate(parsedJSON);
            }
            cleanText = aiText.replace(/<JSON_UPDATE>[\s\S]*?<\/JSON_UPDATE>/, "").trim();
          } catch (e) {
            console.error("Failed to parse updated JSON from AI:", e);
          }
        }
        setChatMessages(prev => [
          ...prev,
          { sender: "ai", text: cleanText || "I have proposed updates to your resume. Please click Accept Changes above." }
        ]);
      }).catch(err => {
        console.error(err);
        setChatMessages(prev => [
          ...prev,
          { sender: "ai", text: "Error: Failed to fetch response from AI." }
        ]);
      }).finally(() => {
        setIsChatLoading(false);
      });
    }
  }

  function formatAIResponse(text: string) {
    // Split by line breaks or numbered/bullet points, then clean markdown
    const lines = text
      .split(/\n|\r|•|\d+\./)
      .map(line => line.replace(/^([#*>\-\s]+)+/, "").trim())
      .filter(line => line.length > 0);
    return lines;
  }

  return (
    <div className="min-h-screen bg-background print:bg-white print:min-h-0">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto px-3 md:px-6 pt-4 md:pt-6 print:hidden">
        <div className="bg-card border border-border shadow-sm rounded-xl py-3 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-foreground">Resume Builder</h1>
            {lastSaved && (
              <span className="hidden md:inline text-xs text-muted-foreground ml-2">
                (Saved {lastSaved.toLocaleTimeString()})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleManualSave}
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-accent bg-transparent text-xs md:text-sm px-3"
            >
              Save Now
            </Button>
            
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-accent bg-transparent text-xs md:text-sm px-3"
            >
              Reset
            </Button>

            <Select value={selectedFont} onValueChange={setSelectedFont}>
              <SelectTrigger className="w-[170px] h-9 border-border bg-card text-xs text-foreground focus:ring-0 cursor-pointer">
                <SelectValue placeholder="Select Font" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border rounded-lg shadow-lg text-xs z-50">
                {FONTS_LIST.map((f) => (
                  <SelectItem key={f.id} value={f.value} className="cursor-pointer hover:bg-accent py-1.5 px-3">
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="w-[1px] h-5 bg-border mx-2" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-border text-foreground hover:bg-accent bg-transparent h-9 w-9 flex items-center justify-center rounded-lg cursor-pointer"
                  title="Download Resume"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-card border border-border rounded-lg shadow-lg p-1 z-50">
                 <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer text-xs flex items-center gap-2 hover:bg-accent hover:text-accent-foreground py-2 px-3 rounded-md outline-none transition-colors">
                  <span className="font-semibold text-red-600 dark:text-red-400">PDF</span>
                  <span className="text-muted-foreground">Download PDF</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadHTMLDOCX} className="cursor-pointer text-xs flex items-center gap-2 hover:bg-accent hover:text-accent-foreground py-2 px-3 rounded-md outline-none transition-colors">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">DOCX</span>
                  <span className="text-muted-foreground">Download Word</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadJSON} className="cursor-pointer text-xs flex items-center gap-2 hover:bg-accent hover:text-accent-foreground py-2 px-3 rounded-md outline-none transition-colors">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">JSON</span>
                  <span className="text-muted-foreground">Download JSON</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />

            <Button
              onClick={() => setIsSettingsOpen(true)}
              variant="outline"
              size="icon"
              className="border-border text-foreground hover:bg-accent bg-transparent h-9 w-9 flex items-center justify-center rounded-lg"
              title="AI API Key Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content: Resume Form, Live Preview & Collapsible Sidebar Chat */}
      <div className="max-w-[1600px] mx-auto p-3 md:p-6 print:p-0 print:m-0 print:max-w-none">
        <div className={`grid gap-4 md:gap-6 min-h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] transition-all duration-300 print:grid-cols-1 print:h-auto print:gap-0 print:min-h-0 ${
          isChatOpen 
            ? "grid-cols-1 xl:grid-cols-[1fr_1.8fr_1fr] lg:grid-cols-[1.1fr_1.7fr_1.2fr] md:grid-cols-[1fr_1.5fr_1fr]" 
            : "grid-cols-1 md:grid-cols-[1fr_2fr]"
        }`}>
          <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden h-full print:hidden">
            <ResumeForm resumeData={resumeData} setResumeData={setResumeData} />
          </div>
          
          <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden h-full print:shadow-none print:border-none print:bg-transparent print:h-auto print:overflow-visible">
            <div className="h-full flex flex-col print:h-auto print:block">
              <div className="bg-muted px-4 md:px-6 py-3 md:py-4 border-b border-border print:hidden">
                <h2 className="text-base md:text-lg font-semibold text-foreground">Live Preview</h2>
              </div>
              <div className="flex-1 p-2 md:p-4 overflow-y-auto print:p-0 print:m-0 print:overflow-visible">
                <div
                  id="preview-scale-wrapper"
                  className="w-full max-w-[210mm] mx-auto shadow-lg print:shadow-none print:transform-none print:max-w-none print:w-auto"
                  style={{
                    transform: isMobile ? "scale(0.6)" : "scale(0.9)",
                    transformOrigin: "top center",
                    minHeight: "297mm",
                  }}
                >
                  <ResumePreview resumeData={resumeData} selectedFont={selectedFont} />
                </div>

              </div>
            </div>
          </div>

          {/* AI Chat Assistant Sidebar */}
          {isChatOpen && (
            <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden h-full flex flex-col print:hidden">
              <div className="bg-muted px-4 py-3 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-sm md:text-base font-semibold text-foreground">AI Assistant</h2>
                  <p className="text-[10px] text-muted-foreground">Autofill, tailor, or edit resume</p>
                </div>
                <button
                  className="text-muted-foreground hover:text-foreground text-lg font-bold"
                  onClick={() => setIsChatOpen(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              {/* Quick AI Actions Row */}
              <div className="bg-muted/35 p-3 border-b border-border flex flex-col gap-2">
                <div className="flex gap-1.5">
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    accept=".pdf,.txt,image/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setChatMessages(prev => [
                          ...prev,
                          { sender: "user", text: `Uploaded file: ${file.name}. Requesting parsing...` }
                        ]);
                        await handleAIImportDirect(file);
                      }
                    }}
                    className="hidden"
                    id="sidebar-file-upload"
                  />
                  <label
                    htmlFor="sidebar-file-upload"
                    className="flex-1 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold py-1.5 px-1 flex items-center justify-center text-center transition"
                  >
                    Autofill
                  </label>

                  <Button
                    onClick={handleConversationalReview}
                    size="sm"
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-semibold py-1 px-1 h-auto transition"
                  >
                    Review
                  </Button>

                  <Button
                    onClick={() => setIsTailorOpen(!isTailorOpen)}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-semibold py-1 px-1 h-auto transition"
                  >
                    {isTailorOpen ? "Close Tailor" : "Tailor"}
                  </Button>
                </div>

                {/* Job Description Textbox */}
                {isTailorOpen && (
                  <div className="bg-background border border-border rounded-lg p-2 space-y-2 mt-1">
                    <textarea
                      placeholder="Paste target Job Description details..."
                      className="w-full h-24 border border-input rounded p-1.5 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      disabled={isTailoring}
                    />
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsTailorOpen(false);
                          setJobDescription("");
                        }}
                        className="text-[10px] py-1 px-2 h-auto"
                        disabled={isTailoring}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleTailorResume}
                        className="bg-primary text-primary-foreground text-[10px] py-1 px-2 h-auto"
                        disabled={isTailoring || !jobDescription.trim()}
                      >
                        {isTailoring ? "Tailoring..." : "Tailor Now"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Prompt Library Accordion */}
              <div className="border-b border-border bg-card">
                <button
                  onClick={() => setIsPromptLibraryOpen(!isPromptLibraryOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span>Prompt Library</span>
                    <span className="text-[10px] text-muted-foreground font-normal">(38 templates)</span>
                  </div>
                  {isPromptLibraryOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>

                {isPromptLibraryOpen && (
                  <div className="p-2.5 bg-muted/20 border-t border-border max-h-[220px] overflow-y-auto space-y-1.5">
                    {PROMPT_CATEGORIES.map((cat, idx) => {
                      const isCatExpanded = expandedCategory === cat.category;
                      return (
                        <div key={idx} className="border border-border/80 rounded-lg overflow-hidden bg-background">
                          <button
                            onClick={() => setExpandedCategory(isCatExpanded ? null : cat.category)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium hover:bg-accent/40 transition-colors cursor-pointer"
                          >
                            <span className="text-foreground">{cat.category}</span>
                            <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-normal">
                              {cat.prompts.length}
                            </span>
                          </button>
                          
                          {isCatExpanded && (
                            <div className="border-t border-border/60 bg-muted/10 p-1.5 space-y-1">
                              {cat.prompts.map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => {
                                    if (!ensureApiKey("load prompt templates")) return;
                                    setChatInput(p.template);
                                    setTimeout(() => {
                                      chatInputRef.current?.focus();
                                    }, 50);
                                  }}
                                  className="w-full text-left p-1.5 rounded text-[10px] hover:bg-primary/10 hover:text-primary transition-all duration-150 border border-transparent hover:border-primary/20 text-muted-foreground group cursor-pointer"
                                  title="Click to load prompt template"
                                >
                                  <div className="font-semibold text-foreground group-hover:text-primary flex items-center justify-between">
                                    <span>{p.title}</span>
                                    <Sparkles className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                                  </div>
                                  <p className="line-clamp-2 mt-0.5 text-[9px] text-muted-foreground/80 leading-relaxed font-mono">
                                    {p.template}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {pendingUpdate && (
                <div className="bg-purple-50 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-900/50 p-3 flex flex-col gap-2 animate-in slide-in-from-top duration-200">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 animate-pulse" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Pending Resume Update</p>
                      <p className="text-[10px] text-muted-foreground">The AI Assistant has proposed changes to your resume. Review and accept below.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingUpdate(null)}
                      className="h-7 text-[10px] hover:bg-muted cursor-pointer"
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={applyPendingUpdate}
                      className="h-7 text-[10px] bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                    >
                      Accept Changes
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[calc(100vh-420px)]">
                {chatMessages.length === 0 && (
                  <div className="text-muted-foreground text-xs text-center py-8">
                    No messages yet. Ask me to make edits, format text, or use the quick buttons above to parser and tailor your resume!
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={msg.sender === "user" ? "text-right" : "text-left"}>
                    {msg.sender === "ai" ? (
                      <div className="bg-muted text-foreground px-3 py-2 rounded-lg text-xs inline-block mb-1 max-w-[90%] text-left whitespace-pre-line">
                        <ul className="list-disc pl-4 space-y-1">
                          {formatAIResponse(msg.text).map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <span className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs inline-block mb-1 max-w-[90%] text-left">
                        {msg.text}
                      </span>
                    )}
                  </div>
                ))}
                {isChatLoading && (
                  <div className="text-left flex items-start gap-2 animate-pulse">
                    <div className="bg-muted text-foreground px-3 py-2.5 rounded-lg text-xs inline-flex items-center gap-1.5 mb-1 max-w-[95%]">
                      <span className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-1">AI is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatMessagesEndRef} />
              </div>
              
              <div className="p-3 border-t border-border bg-muted/30 flex gap-2 items-center">
                <textarea
                  ref={chatInputRef}
                  className="flex-1 border border-input rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
                  style={{ minHeight: "48px", maxHeight: "160px", height: "48px" }}
                  placeholder="Type instruction..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                  disabled={isChatLoading}
                />
                <Button
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-xs font-semibold"
                  onClick={handleSendChat}
                  size="sm"
                  disabled={isChatLoading || !chatInput.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal for Gemini API Key */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white dark:bg-card rounded-xl shadow-2xl p-6 max-w-md w-full border border-gray-200 dark:border-border relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl font-bold"
              onClick={() => setIsSettingsOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-2 text-center text-foreground">AI Configurations</h2>
            <p className="text-xs mb-4 text-center text-muted-foreground">
              Configure your custom Gemini API key. The key is securely stored only in your local browser and sent directly to Google.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 dark:border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder={customApiKey ? "••••••••••••••••" : "Paste your API key here..."}
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Don't have a key? Get one for free at{" "}
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-semibold"
                  >
                    Google AI Studio
                  </a>
                </span>
              </div>

              <div className="border-t border-gray-200 dark:border-border pt-4">
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Raw Resume JSON Data
                </label>
                <textarea
                  className="w-full h-32 font-mono text-[10px] border border-gray-300 dark:border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  value={JSON.stringify(resumeData, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      if (parsed.personalInfo) {
                        setResumeData(parsed);
                      }
                    } catch (err) {
                      // ignore parse errors while typing
                    }
                  }}
                  placeholder="Paste raw resume JSON here..."
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  You can edit the JSON directly above to update the editor and live preview instantly.
                </span>
              </div>
              
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.removeItem("user-gemini-api-key");
                    setCustomApiKey("");
                    setIsSettingsOpen(false);
                  }}
                  className="text-xs"
                >
                  Clear Key
                </Button>
                <Button
                  onClick={() => {
                    localStorage.setItem("user-gemini-api-key", customApiKey.trim());
                    setIsSettingsOpen(false);
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Actions Stack */}
      {!isChatOpen && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-40 print:hidden items-end">
          {/* AI Assistant Chat Toggle */}
          <button
            onClick={() => {
              setIsChatOpen(true);
              if (!ensureApiKey("chat with the AI Assistant")) return;
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[10px] py-3.5 px-2.5 rounded-l-md shadow-lg flex flex-col items-center gap-1.5 transition-all duration-200 border-l border-t border-b border-purple-500 [writing-mode:vertical-lr] cursor-pointer w-9"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="tracking-wider uppercase">Chat</span>
          </button>

          {/* Autofill Pill */}
          <button
            onClick={() => {
              setIsChatOpen(true);
              if (!ensureApiKey("autofill your resume")) return;
              setTimeout(() => {
                document.getElementById("sidebar-file-upload")?.click();
              }, 150);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10px] py-3.5 px-2.5 rounded-l-md shadow-lg flex flex-col items-center gap-1.5 transition-all duration-200 border-l border-t border-b border-blue-500 [writing-mode:vertical-lr] cursor-pointer w-9"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="tracking-wider uppercase">Autofill</span>
          </button>

          {/* Review Pill */}
          <button
            onClick={() => {
              setIsChatOpen(true);
              if (!ensureApiKey("review your resume")) return;
              setTimeout(() => {
                handleConversationalReview();
              }, 150);
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] py-3.5 px-2.5 rounded-l-md shadow-lg flex flex-col items-center gap-1.5 transition-all duration-200 border-l border-t border-b border-amber-500 [writing-mode:vertical-lr] cursor-pointer w-9"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="tracking-wider uppercase">Review</span>
          </button>

          {/* Tailor Pill */}
          <button
            onClick={() => {
              setIsChatOpen(true);
              if (!ensureApiKey("tailor your resume")) return;
              setTimeout(() => {
                setIsTailorOpen(true);
              }, 150);
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold text-[10px] py-3.5 px-2.5 rounded-l-md shadow-lg flex flex-col items-center gap-1.5 transition-all duration-200 border-l border-t border-b border-green-500 [writing-mode:vertical-lr] cursor-pointer w-9"
          >
            <Target className="w-3.5 h-3.5" />
            <span className="tracking-wider uppercase">Tailor</span>
          </button>
        </div>
      )}

      {/* Custom Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-lg shadow-2xl py-2.5 px-4 flex items-center gap-3 border border-slate-800 text-xs z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-200 print:hidden">
          <span>{toastMessage.text}</span>
          {toastMessage.actionText && (
            <button
              onClick={toastMessage.onAction}
              className="text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider cursor-pointer ml-1"
            >
              {toastMessage.actionText}
            </button>
          )}
          <button
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-white font-bold ml-1 text-sm cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  )
}
