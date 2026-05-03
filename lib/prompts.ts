export interface PromptTemplate {
  id: string;
  title: string;
  template: string;
}

export interface PromptCategory {
  category: string;
  prompts: PromptTemplate[];
}

export const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    category: "Professional Summary",
    prompts: [
      {
        id: "summary-standard",
        title: "Create/Update Professional Summary",
        template: "Write a 3-4 sentence professional summary and update my resume with it directly. Details: Job Title is [Job Title], with [X] years of experience in [Industry]. Key strengths include [Skill 1] and [Skill 2]. Most notable achievement: [Biggest career achievement with numbers]. Target role: [Target Job Title]."
      },
      {
        id: "summary-career-change",
        title: "Write Career Transition Summary",
        template: "Write a professional summary for someone transitioning from [Current Role/Industry] to [Target Role/Industry] and update my resume with it. Transferable skills: [Skill 1], [Skill 2]. Frame the transition strategically, focusing on how my background provides a unique advantage. 3-4 sentences."
      }
    ]
  },
  {
    category: "Experience & Bullet Points",
    prompts: [
      {
        id: "experience-add-job",
        title: "Add New Work Experience",
        template: "Add a new work experience entry to my resume and write 4-5 high-impact bullet points for it. Company: [Company Name], Position: [Position], Duration: [Duration, e.g. 2024 - Present], Location: [Location, e.g. San Francisco, CA]. Key responsibilities/achievements: [list details]. Automatically bold important tech keywords and metrics."
      },
      {
        id: "experience-improve-bullets",
        title: "Improve Work Achievements (Quantify)",
        template: "Rewrite and strengthen the bullet points for my experience at [Company Name] and update my resume directly. I want to highlight these achievements: [list achievements or numbers]. Focus on impact, start each bullet with a strong action verb, and bold key metrics/skills."
      }
    ]
  },
  {
    category: "Skills Section",
    prompts: [
      {
        id: "skills-organize",
        title: "Categorize Technical Skills",
        template: "Organize my technical skills section into clean, structured categories and update my resume: [paste skills]. Group related items under headers like Languages, Frameworks, Developer Tools, and Cloud/DevOps. Place the most relevant skills first."
      },
      {
        id: "skills-job-match",
        title: "Optimize Skills for Job Description",
        template: "Analyze this job description, identify the key technical skills needed, select the ones I have, and update my skills section: [paste job description]. Suggest any common expected skills I might be missing."
      }
    ]
  },
  {
    category: "ATS & Job Tailoring",
    prompts: [
      {
        id: "tailor-resume-job",
        title: "Tailor Entire Resume for a Role",
        template: "Tailor my entire resume to align directly with this job description and update it. Adjust my professional summary, highlight matching technical skills, and reword my experience bullet points to focus on the key requirements of the role: [paste job description]. Bold matching keywords."
      }
    ]
  },
  {
    category: "Certifications & Custom Sections",
    prompts: [
      {
        id: "custom-certifications",
        title: "Add Certifications (Bullet Layout)",
        template: "Add a new custom section named 'Certifications' using the 'bullet' layout style and populate it with these items: [list certifications, e.g. AWS Certified Solutions Architect (2024)]. Update my resume directly."
      },
      {
        id: "custom-new-section",
        title: "Add Custom Section (Select Layout)",
        template: "Add a custom section named '[Section Name]' with layout style '[Layout Style: bullet/text/full]' and populate it with these items: [list details]. Update my resume directly."
      }
    ]
  },
  {
    category: "Academic & Publications",
    prompts: [
      {
        id: "custom-publications",
        title: "Add Publications (Full Layout)",
        template: "Add a new custom section named 'Publications' using the 'full' layout style and populate it with these items: [list publications with title, publisher/journal, date, description]. Update my resume directly."
      }
    ]
  }
];
