import type { ResumeData } from "@/app/page"

export async function generatePDF(resumeData: ResumeData) {
  const originalTitle = document.title
  
  // Set temporary document title so browser "Save as PDF" defaults to correct filename
  const fileName = resumeData.personalInfo.name
    ? `${resumeData.personalInfo.name.trim().replace(/\s+/g, "_")}_Resume`
    : "Resume"
  
  document.title = fileName

  // Dismiss open dropdown/popup focus
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  // Small delay to allow Radix dropdown popup to dismiss before browser print modal
  await new Promise((resolve) => setTimeout(resolve, 50))

  // Trigger browser native print dialog
  window.print()

  // Restore original title after print dialog closes
  document.title = originalTitle
}
