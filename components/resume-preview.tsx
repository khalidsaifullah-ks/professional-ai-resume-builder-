"use client"

import React, { useMemo, useRef, useState, useLayoutEffect } from "react"
import { Mail, Phone, Linkedin, Github, Code } from 'lucide-react'
import type { ResumeData } from "@/app/page"

// A4 sizing in px at ~96dpi for consistent measurement
const A4_HEIGHT_PX = 1122.52 // 297mm * 3.779528
const A4_WIDTH_MM = 210
const TOP_MARGIN_PX = 37.79 // 10mm
const RIGHT_MARGIN_PX = 22.68 // 6mm
const BOTTOM_MARGIN_PX = 56.69 // 15mm
const LEFT_MARGIN_PX = 30.24 // 8mm
const AVAILABLE_CONTENT_HEIGHT_PX = A4_HEIGHT_PX - TOP_MARGIN_PX - BOTTOM_MARGIN_PX

// Pagination heuristics
const MIN_FOOTER_SPACE_PX = 32 // safety buffer to prevent bottom overflow and footer overlapping
const KEEP_WITH_NEXT_TYPES = new Set(["section-heading"]) // keep headings with first item
const ATOMIC_TYPES = new Set(["header"]) // header block stays intact

type UnitType =
  | "header"
  | "section-heading"
  | "education-item"
  | "skill-item"
  | "experience-item"
  | "project-item"
  | "achievement-item"
  | "certification-item"
  | "extracurricular-item"
  | "custom-heading"
  | "custom-item"
  | "spacer"

interface Unit {
  key: string
  type: UnitType
  render: () => React.ReactNode
}

export function renderFormattedText(text: string): React.ReactNode {
  if (!text) return "";
  
  const regex = /(\*\*.*?\*\*|<b>.*?<\/b>|<strong>.*?<\/strong>|\*.*?\*|<i>.*?<\/i>|<em>.*?<\/em>)/g;
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} style={{ fontWeight: "bold" }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("<b>") && part.endsWith("</b>")) {
      return <strong key={index} style={{ fontWeight: "bold" }}>{part.slice(3, -4)}</strong>;
    }
    if (part.startsWith("<strong>") && part.endsWith("</strong>")) {
      return <strong key={index} style={{ fontWeight: "bold" }}>{part.slice(8, -9)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index} style={{ fontStyle: "italic" }}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("<i>") && part.endsWith("</i>")) {
      return <em key={index} style={{ fontStyle: "italic" }}>{part.slice(3, -4)}</em>;
    }
    if (part.startsWith("<em>") && part.endsWith("</em>")) {
      return <em key={index} style={{ fontStyle: "italic" }}>{part.slice(4, -5)}</em>;
    }
    return part;
  });
}

/**
 * Build content as small "units" so the paginator can pack them across pages.
 * We keep headings with at least the first item, and avoid leaving a tiny widow at the bottom.
 */
function formatProfileLink(username: string, baseUrl: string): { href: string; display: string } {
  if (!username) return { href: "", display: "" }
  const clean = username.trim()
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    try {
      const url = new URL(clean)
      const display = url.pathname.replace(/^\/+|\/+$/g, "") || clean
      return { href: clean, display }
    } catch (e) {
      return { href: clean, display: clean }
    }
  }
  if (clean.includes(".com/")) {
    const part = clean.split(".com/")[1] || clean
    return { href: `https://${clean}`, display: part }
  }
  return { href: `${baseUrl}${clean}`, display: clean }
}

function buildUnits(resumeData: ResumeData): Unit[] {
  const units: Unit[] = []

  // Header block (atomic)
  units.push({
    key: "header",
    type: "header",
    render: () => (
      <div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            width: "100%",
            marginBottom: 8,
          }}
        >
          <h1
            style={{
              fontSize: "20pt",
              lineHeight: "1.1",
              letterSpacing: "2px",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontWeight: "bold",
              textTransform: "uppercase",
              marginBottom: 0,
            }}
          >
            {resumeData.personalInfo.name || "YOUR NAME"}
          </h1>
          {resumeData.personalInfo.location && (
            <div style={{ fontSize: "11pt", fontFamily: "Arial, Helvetica, sans-serif", marginBottom: 0 }}>
              {resumeData.personalInfo.location}
            </div>
          )}
        </div>

        <div
          className="flex justify-center items-center flex-wrap"
          style={{
            fontSize: "10pt",
            lineHeight: "1.2",
            fontFamily: "Arial, Helvetica, sans-serif",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: 0,
            marginBottom: 8,
          }}
        >
          {resumeData.personalInfo.phone && (
            <div
              className="whitespace-nowrap"
              style={{
                display: "inline-block",
                whiteSpace: "nowrap",
                margin: "2px 8px",
              }}
            >
              <Phone
                className="w-3 h-3 flex-shrink-0"
                style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4, marginTop: "-2px" }}
              />
              <a
                href={`tel:${resumeData.personalInfo.phone}`}
                style={{ textDecoration: "none", color: "#000", display: "inline-block", verticalAlign: "middle" }}
              >
                {resumeData.personalInfo.phone}
              </a>
            </div>
          )}
          {resumeData.personalInfo.email && (
            <div
              className="whitespace-nowrap"
              style={{
                display: "inline-block",
                whiteSpace: "nowrap",
                margin: "2px 8px",
              }}
            >
              <Mail
                className="w-3 h-3 flex-shrink-0"
                style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4, marginTop: "-2px" }}
              />
              <a
                href={`mailto:${resumeData.personalInfo.email}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "#000", display: "inline-block", verticalAlign: "middle" }}
              >
                {resumeData.personalInfo.email}
              </a>
            </div>
          )}
          {resumeData.personalInfo.linkedin && (() => {
            const link = formatProfileLink(resumeData.personalInfo.linkedin, "https://linkedin.com/in/")
            return (
              <div
                className="whitespace-nowrap"
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  margin: "2px 8px",
                }}
              >
                <Linkedin
                  className="w-3 h-3 flex-shrink-0"
                  style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4, marginTop: "-2px" }}
                />
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", color: "#000", display: "inline-block", verticalAlign: "middle" }}
                >
                  {link.display}
                </a>
              </div>
            )
          })()}
          {resumeData.personalInfo.github && (() => {
            const link = formatProfileLink(resumeData.personalInfo.github, "https://github.com/")
            return (
              <div
                className="whitespace-nowrap"
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  margin: "2px 8px",
                }}
              >
                <Github
                  className="w-3 h-3 flex-shrink-0"
                  style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4, marginTop: "-2px" }}
                />
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", color: "#000", display: "inline-block", verticalAlign: "middle" }}
                >
                  {link.display}
                </a>
              </div>
            )
          })()}
          {resumeData.personalInfo.leetcode && (() => {
            const link = formatProfileLink(resumeData.personalInfo.leetcode, "https://leetcode.com/u/")
            return (
              <div
                className="whitespace-nowrap"
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  margin: "2px 8px",
                }}
              >
                <Code
                  className="w-3 h-3 flex-shrink-0"
                  style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4, marginTop: "-2px" }}
                />
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", color: "#000", display: "inline-block", verticalAlign: "middle" }}
                >
                  {link.display}
                </a>
              </div>
            )
          })()}
        </div>
      </div>
    ),
  })

  // Helper to push a section heading
  const pushHeading = (title: string, key: string) => {
    units.push({
      key,
      type: "section-heading",
      render: () => (
        <h2
          className="font-bold uppercase mb-2 border-b border-black pb-1"
          style={{
            fontSize: "12pt",
            borderBottomWidth: "1px",
            fontFamily: "Arial, Helvetica, sans-serif",
            textAlign: "left",
            marginBottom: 8,
            paddingBottom: 2,
          }}
        >
          {title}
        </h2>
      ),
    })
  }

  const order = [...(resumeData.sectionOrder || ["education", "technicalSkills", "experience", "projects", "achievements", "certifications", "extracurriculars"])]

  // Make sure all custom sections are in the order list
  resumeData.customSections.forEach((custom) => {
    const key = `custom-${custom.id}`
    if (!order.includes(key)) {
      order.push(key)
    }
  })

  order.forEach((sectionKey) => {
    if (sectionKey === "education") {
      // Education
      if (resumeData.education && resumeData.education.length > 0) {
        pushHeading("Education", "heading-education")
        resumeData.education.forEach((edu, idx) => {
          units.push({
            key: `edu-${edu.id}-${idx}`,
            type: "education-item",
            render: () => (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: "auto", paddingRight: 24 }}>
                    <h3
                      style={{
                        fontSize: "11pt",
                        marginBottom: 2,
                        fontFamily: "Arial, Helvetica, sans-serif",
                        fontWeight: "bold",
                      }}
                    >
                      {renderFormattedText(edu.institution)}
                    </h3>
                    <p style={{ fontSize: "10pt", margin: 0, fontFamily: "Arial, Helvetica, sans-serif" }}>
                      {renderFormattedText(edu.degree)}
                      {edu.gradeFormat &&
                        edu.gradeValue &&
                        `; ${edu.gradeFormat}: ${edu.gradeFormat === "Percentage" && !edu.gradeValue.endsWith("%") ? `${edu.gradeValue}%` : edu.gradeValue}`}
                    </p>
                  </div>
                  <div style={{ fontSize: "10pt", paddingLeft: 8, textAlign: "right" }}>
                    <div style={{ fontWeight: "bold", whiteSpace: "nowrap", marginBottom: 0 }}>{edu.duration}</div>
                    <div style={{ fontStyle: "italic", margin: 0 }}>{edu.location}</div>
                  </div>
                </div>
              </div>
            ),
          })
        })
      }
    } else if (sectionKey === "technicalSkills") {
      // Technical Skills
      if (resumeData.technicalSkills && resumeData.technicalSkills.length > 0) {
        pushHeading("Technical Skills", "heading-skills")
        resumeData.technicalSkills.forEach((skill, idx) => {
          units.push({
            key: `skill-${skill.id}-${idx}`,
            type: "skill-item",
            render: () => (
              <div
                style={{
                  fontSize: "10pt",
                  margin: "2px 0 6px 0",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  textAlign: "left",
                }}
              >
                <span style={{ fontWeight: "bold" }}>{skill.category}:</span> <span>{renderFormattedText(skill.skills)}</span>
              </div>
            ),
          })
        })
      }
    } else if (sectionKey === "experience") {
      // Experience
      if (resumeData.experience && resumeData.experience.length > 0) {
        pushHeading("Professional Experience", "heading-experience")
        resumeData.experience.forEach((exp, idx) => {
          units.push({
            key: `exp-${exp.id}-${idx}`,
            type: "experience-item",
            render: () => (
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 4,
                  }}
                >
                  <div style={{ flex: 1, paddingRight: 24, maxWidth: "70%" }}>
                    <h3
                      style={{
                        fontSize: "11pt",
                        marginBottom: 2,
                        fontFamily: "Arial, Helvetica, sans-serif",
                        fontWeight: "bold",
                      }}
                    >
                      {renderFormattedText(exp.company)}
                    </h3>
                    <p
                      style={{
                        fontSize: "10pt",
                        margin: 0,
                        fontFamily: "Arial, Helvetica, sans-serif",
                        fontWeight: "bold",
                      }}
                    >
                      {renderFormattedText(exp.position)}
                    </p>
                  </div>
                  <div style={{ fontSize: "10pt", paddingLeft: 8, textAlign: "right" }}>
                    <div style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>{exp.duration}</div>
                    <div style={{ fontStyle: "italic" }}>{exp.location}</div>
                  </div>
                </div>

                {exp.description && (
                  <div style={{ fontSize: "10pt", lineHeight: "1.2", fontFamily: "Arial, Helvetica, sans-serif" }}>
                    {exp.description.split("\n").map((line, i) => (
                      <div
                        key={i}
                        style={{
                          margin: "2px 0",
                          paddingLeft: "1em",
                          textIndent: "-1em",
                          textAlign: "left",
                        }}
                      >
                        <span>• </span>{renderFormattedText(line.replace(/^•\s*/, ""))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          })
        })
      }
    } else if (sectionKey === "projects") {
      // Projects
      if (resumeData.projects && resumeData.projects.length > 0) {
        pushHeading("Projects", "heading-projects")
        resumeData.projects.forEach((project, idx) => {
          units.push({
            key: `proj-${project.id}-${idx}`,
            type: "project-item",
            render: () => (
              <div style={{ marginBottom: 8 }}>
                <h3
                  style={{
                    fontSize: "11pt",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontWeight: "bold",
                    marginBottom: 2,
                  }}
                >
                  {renderFormattedText(project.title)}
                  {project.links && (
                    <span style={{ fontSize: "10pt", fontWeight: "normal" }}>
                      {" | "}
                      {project.links.split("|").map((link, index) => {
                        const trimmed = link.trim()
                        let display = trimmed
                        let href = trimmed
                        if (trimmed.startsWith("github.com/")) {
                          display = "GitHub"
                          href = `https://${trimmed}`
                        } else if (trimmed.startsWith("leetcode.com/")) {
                          display = "LeetCode"
                          href = `https://${trimmed}`
                        } else if (!trimmed.startsWith("http")) {
                          href = `https://${trimmed}`
                        }
                        return (
                          <span key={index}>
                            {index > 0 && " | "}
                            <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#000" }}>
                              {display}
                            </a>
                          </span>
                        )
                      })}
                    </span>
                  )}
                </h3>

                {project.technologies && (
                  <p
                    style={{
                      fontSize: "10pt",
                      margin: "2px 0 2px 0",
                      fontWeight: 500,
                      fontFamily: "Arial, Helvetica, sans-serif",
                    }}
                  >
                    {renderFormattedText(project.technologies)}
                  </p>
                )}

                {project.description && (
                  <div style={{ fontSize: "10pt", lineHeight: "1.2", fontFamily: "Arial, Helvetica, sans-serif" }}>
                    {project.description.split("\n").map((line, i) => (
                      <div
                        key={i}
                        style={{
                          margin: "2px 0",
                          paddingLeft: "1em",
                          textIndent: "-1em",
                          textAlign: "left",
                        }}
                      >
                        <span>• </span>{renderFormattedText(line.replace(/^•\s*/, ""))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          })
        })
      }
    } else if (sectionKey === "achievements") {
      // Achievements
      if (resumeData.achievements && resumeData.achievements.length > 0) {
        pushHeading("Achievements", "heading-achievements")
        units.push({
          key: "achievements-list",
          type: "achievement-item",
          render: () => (
            <div style={{ fontSize: "10pt", lineHeight: "1.2", fontFamily: "Arial, Helvetica, sans-serif", marginBottom: 8 }}>
              {resumeData.achievements.map((ach, idx) => {
                const lines = ach.description ? ach.description.split("\n") : [];
                return lines.map((line, lIdx) => (
                  <div
                    key={`${ach.id}-${lIdx}`}
                    style={{
                      margin: "3px 0",
                      paddingLeft: "1em",
                      textIndent: "-1em",
                      textAlign: "left",
                    }}
                  >
                    <span>• </span>{renderFormattedText(line.replace(/^•\s*/, ""))}
                  </div>
                ));
              })}
            </div>
          ),
        })
      }
    } else if (sectionKey === "certifications") {
      // Certifications
      if (resumeData.certifications && resumeData.certifications.length > 0) {
        pushHeading("Certifications", "heading-certifications")
        units.push({
          key: "certifications-list",
          type: "certification-item",
          render: () => (
            <div style={{ fontSize: "10pt", lineHeight: "1.2", fontFamily: "Arial, Helvetica, sans-serif", marginBottom: 8 }}>
              {resumeData.certifications.map((cert) => {
                const lines = cert.description ? cert.description.split("\n") : [];
                return lines.map((line, lIdx) => (
                  <div
                    key={`${cert.id}-${lIdx}`}
                    style={{
                      margin: "3px 0",
                      paddingLeft: "1em",
                      textIndent: "-1em",
                      textAlign: "left",
                    }}
                  >
                    <span>• </span>{renderFormattedText(line.replace(/^•\s*/, ""))}
                  </div>
                ));
              })}
            </div>
          ),
        })
      }
    } else if (sectionKey === "extracurriculars") {
      // Extracurriculars
      if (resumeData.extracurriculars && resumeData.extracurriculars.length > 0) {
        pushHeading("Extracurriculars", "heading-extracurriculars")
        units.push({
          key: "extracurriculars-list",
          type: "extracurricular-item",
          render: () => (
            <div style={{ fontSize: "10pt", lineHeight: "1.2", fontFamily: "Arial, Helvetica, sans-serif", marginBottom: 8 }}>
              {resumeData.extracurriculars.map((extra) => {
                const lines = extra.description ? extra.description.split("\n") : [];
                return lines.map((line, lIdx) => (
                  <div
                    key={`${extra.id}-${lIdx}`}
                    style={{
                      margin: "3px 0",
                      paddingLeft: "1em",
                      textIndent: "-1em",
                      textAlign: "left",
                    }}
                  >
                    <span>• </span>{renderFormattedText(line.replace(/^•\s*/, ""))}
                  </div>
                ));
              })}
            </div>
          ),
        })
      }
    } else if (sectionKey.startsWith("custom-")) {
      // Custom Sections
      const customId = sectionKey.replace("custom-", "")
      const custom = resumeData.customSections.find((c) => c.id === customId)
      if (custom && custom.items.length > 0) {
        if (custom.title) {
          units.push({
            key: `custom-heading-${custom.id}`,
            type: "section-heading",
            render: () => (
              <h2
                className="font-bold uppercase mb-2 border-b border-black pb-1"
                style={{
                  fontSize: "12pt",
                  borderBottomWidth: "1px",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  marginBottom: 8,
                  paddingBottom: 2,
                }}
              >
                {custom.title}
              </h2>
            ),
          })
        }
        if (custom.layout === "bullet") {
          units.push({
            key: `custom-list-${custom.id}`,
            type: "custom-item",
            render: () => (
              <div style={{ fontSize: "10pt", lineHeight: "1.2", fontFamily: "Arial, Helvetica, sans-serif", marginBottom: 8 }}>
                {custom.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      margin: "3px 0",
                      paddingLeft: "1em",
                      textIndent: "-1em",
                      textAlign: "left",
                    }}
                  >
                    <span>• </span>{renderFormattedText(item.title)}
                  </div>
                ))}
              </div>
            ),
          })
        } else if (custom.layout === "text") {
          custom.items.forEach((item, idx) => {
            units.push({
              key: `custom-text-${custom.id}-${item.id}-${idx}`,
              type: "custom-item",
              render: () => (
                <div style={{ marginBottom: 8, fontSize: "10pt", fontFamily: "Arial, Helvetica, sans-serif" }}>
                  {item.title && (
                    <h3 style={{ fontSize: "11pt", fontWeight: "bold", marginBottom: 2 }}>
                      {item.title}
                    </h3>
                  )}
                  {item.description && (
                    <p style={{ margin: 0, textAlign: "left", lineHeight: "1.2" }}>
                      {renderFormattedText(item.description)}
                    </p>
                  )}
                </div>
              ),
            })
          })
        } else {
          custom.items.forEach((item, idx) => {
            units.push({
              key: `custom-item-${custom.id}-${item.id}-${idx}`,
              type: "custom-item",
              render: () => (
                <div style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ flex: 1, paddingRight: 24, maxWidth: "70%" }}>
                      <h3
                        style={{
                          fontSize: "11pt",
                          marginBottom: 2,
                          fontFamily: "Arial, Helvetica, sans-serif",
                          fontWeight: "bold",
                        }}
                      >
                        {item.title}
                      </h3>
                      {(item.subtitle || item.location) && (
                        <p
                          style={{
                            fontSize: "10pt",
                            margin: 0,
                            fontFamily: "Arial, Helvetica, sans-serif",
                            fontStyle: "italic",
                          }}
                        >
                          {item.subtitle}
                          {item.subtitle && item.location ? " · " : ""}
                          {item.location}
                        </p>
                      )}
                    </div>
                    <div style={{ fontSize: "10pt", paddingLeft: 8, textAlign: "right" }}>
                      {item.duration && <div style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>{item.duration}</div>}
                    </div>
                  </div>
                  {item.description && (
                    <div style={{ fontSize: "10pt", lineHeight: "1.2", fontFamily: "Arial, Helvetica, sans-serif" }}>
                      {item.description.split("\n").map((line, i) => (
                        <div
                          key={i}
                          style={{
                            margin: "2px 0",
                            paddingLeft: "1em",
                            textIndent: "-1em",
                          }}
                        >
                          <span>• </span>{renderFormattedText(line.replace(/^•\s*/, ""))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
            })
          })
        }
      }
    }
  })

  return units
}

function paginateUnits(units: Unit[], heights: number[]): number[][] {
  const pages: number[][] = []
  let currentPage: number[] = []
  let currentHeight = 0

  const canFit = (h: number) => currentHeight + h + MIN_FOOTER_SPACE_PX <= AVAILABLE_CONTENT_HEIGHT_PX

  for (let i = 0; i < units.length; i++) {
    const h = heights[i] || 0
    const u = units[i]

    // Try to keep headings with the next item
    if (KEEP_WITH_NEXT_TYPES.has(u.type)) {
      const nextIndex = i + 1
      const nextHeight = heights[nextIndex] || 0
      const need = h + nextHeight

      // If next item doesn't exist, treat like a normal unit
      if (nextIndex >= units.length) {
        if (canFit(h)) {
          currentPage.push(i)
          currentHeight += h
        } else {
          pages.push(currentPage)
          currentPage = [i]
          currentHeight = h
        }
      } else {
        if (canFit(need)) {
          currentPage.push(i, nextIndex)
          currentHeight += need
          i = nextIndex // we consumed the next item already
        } else {
          // move heading to next page with its first item
          if (currentPage.length > 0) pages.push(currentPage)
          currentPage = [i, nextIndex]
          currentHeight = need
          i = nextIndex
        }
      }
      continue
    }

    // Atomic block must fit entirely; otherwise, push to new page
    if (ATOMIC_TYPES.has(u.type)) {
      if (currentPage.length === 0 && !canFit(h)) {
        // Edge case: huge atomic block; still place on empty page
        currentPage.push(i)
        pages.push(currentPage)
        currentPage = []
        currentHeight = 0
        continue
      }
      if (!canFit(h)) {
        pages.push(currentPage)
        currentPage = [i]
        currentHeight = h
      } else {
        currentPage.push(i)
        currentHeight += h
      }
      continue
    }

    // General case
    if (canFit(h)) {
      currentPage.push(i)
      currentHeight += h
    } else {
      // Widow/orphan control: if there's only a tiny space left, move to next page
      pages.push(currentPage)
      currentPage = [i]
      currentHeight = h
    }
  }

  if (currentPage.length > 0) pages.push(currentPage)
  return pages
}

export function ResumePreview({ resumeData, selectedFont }: { resumeData: ResumeData; selectedFont?: string }) {
  const [pages, setPages] = useState<number[][]>([])
  const measurementRef = useRef<HTMLDivElement>(null)

  // Build units once per data change
  const units = useMemo(() => buildUnits(resumeData), [resumeData])

  // Measure and paginate
  useLayoutEffect(() => {
    let active = true

    const measure = () => {
      if (!active) return
      const container = measurementRef.current
      if (!container) return

      const children = Array.from(container.children) as HTMLElement[]
      const heights = children.map((el) => el.getBoundingClientRect().height)

      const computedPages = paginateUnits(units, heights)
      setPages(computedPages)
    }

    // Run measurement initially and defer for rendering stability
    const rafId = requestAnimationFrame(measure)

    // Listen for fonts loading completion
    document.fonts.ready.then(() => {
      if (active) measure()
    })

    // Listen for window resize to adjust responsive heights
    window.addEventListener("resize", measure)

    return () => {
      active = false
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", measure)
    }
  }, [units, selectedFont]) // Re-run when font changes as character heights might shift page breaks!

  return (
    <>
      {/* Hidden measurement container */}
      <div
        ref={measurementRef}
        style={{
          position: "absolute",
          visibility: "hidden",
          height: "auto",
          width: `${A4_WIDTH_MM}mm`,
          padding: `${TOP_MARGIN_PX}px ${RIGHT_MARGIN_PX}px ${BOTTOM_MARGIN_PX}px ${LEFT_MARGIN_PX}px`,
          fontSize: "10pt",
          lineHeight: "1.2",
          whiteSpace: "normal",
          "--resume-font-family": selectedFont || "Arial, Helvetica, sans-serif",
        } as React.CSSProperties}
      >
        {units.map((u) => (
          <div key={`measure-${u.key}`}>{u.render()}</div>
        ))}
      </div>

      {/* Visible multi-page render inside a wrapper with id="resume-preview" */}
      <div id="resume-preview" style={{ "--resume-font-family": selectedFont || "Arial, Helvetica, sans-serif" } as React.CSSProperties}>
        {pages.map((pageUnitIndexes, pageIndex) => (
          <div
            key={`page-${pageIndex}`}
            className="bg-white text-black shadow-lg mb-8 print:shadow-none print:mb-0 resume-page"
            style={{
              width: `${A4_WIDTH_MM}mm`,
              height: "297mm",
              margin: "0 auto",
              padding: `${TOP_MARGIN_PX}px ${RIGHT_MARGIN_PX}px ${BOTTOM_MARGIN_PX}px ${LEFT_MARGIN_PX}px`,
              fontSize: "10pt",
              lineHeight: "1.2",
              color: "#000000",
              boxSizing: "border-box",
              overflow: "hidden",
              position: "relative",
              textAlign: "left",
              textJustify: "none",
              wordSpacing: "normal",
              letterSpacing: "normal",
              whiteSpace: "normal",
              textRendering: "geometricPrecision",
              WebkitFontSmoothing: "subpixel-antialiased",
              MozOsxFontSmoothing: "auto",
              fontKerning: "normal",
              fontVariantLigatures: "none",
              fontFeatureSettings: "normal",
              textSizeAdjust: "none",
              WebkitTextSizeAdjust: "none",
              MozTextSizeAdjust: "none",
            }}
          >
            {pageUnitIndexes.map((uIdx) => {
              const unit = units[uIdx]
              return unit && typeof unit.render === "function" ? (
                <div key={unit.key}>{unit.render()}</div>
              ) : null
            })}

            {/* Page number footer */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: 8,
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "8pt",
                color: "#555",
              }}
            >
              Page {pageIndex + 1} of {pages.length}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
