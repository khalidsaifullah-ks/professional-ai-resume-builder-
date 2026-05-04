import type { ResumeData } from "@/app/page"

export async function generatePDF(resumeData: ResumeData) {
  const originalTitle = document.title
  
  // Set temporary document title so browser "Save as PDF" defaults to correct filename
  const fileName = resumeData.personalInfo.name
    ? `${resumeData.personalInfo.name.trim().replace(/\s+/g, "_")}_Resume`
    : "Resume"
  
  document.title = fileName

  // Trigger browser native print dialog
  window.print()

  // Restore original title after print dialog closes
  document.title = originalTitle
}
