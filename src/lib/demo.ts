import type { IconName } from "@/components/icons";

// Fictional workspace data for the enterprise UI (safe to publish).

export const WORKSPACE = { name: "NPC Co., Ltd.", plan: "Business" };
export const CURRENT_USER = { name: "Nitipoom", role: "Admin" };

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Collections ──
export interface Collection {
  name: string;
  slug: string;
  icon: IconName;
  docs: number;
  pages: number;
  updated: string;
  indexed: number; // %
  tint: string;
  fg: string;
}

export const COLLECTIONS: Collection[] = [
  { name: "HR", slug: "hr", icon: "people", docs: 24, pages: 312, updated: "2 days ago", indexed: 96, tint: "#eef2ff", fg: "#2f5aff" },
  { name: "Production", slug: "production", icon: "box", docs: 38, pages: 540, updated: "1 day ago", indexed: 100, tint: "#f0fdf4", fg: "#16a34a" },
  { name: "Engineering", slug: "engineering", icon: "wrench", docs: 52, pages: 890, updated: "6 hours ago", indexed: 94, tint: "#f5f3ff", fg: "#7c3aed" },
  { name: "Finance", slug: "finance", icon: "dollar", docs: 29, pages: 402, updated: "1 week ago", indexed: 90, tint: "#ecfeff", fg: "#0891b2" },
  { name: "Safety", slug: "safety", icon: "shield", docs: 16, pages: 208, updated: "3 hours ago", indexed: 88, tint: "#fff7ed", fg: "#ea580c" },
];

export function findCollection(slug: string) {
  return COLLECTIONS.find((c) => c.slug === slug);
}

// ── Documents ──
export interface DocRow {
  name: string;
  slug: string;
  collection: string;
  type: "PDF" | "DOCX" | "XLSX" | "MD";
  pages: number;
  chunks: number;
  language: "Thai" | "English";
  version: string;
  updated: string;
  lastIndexed: string;
  owner: string;
  uploadedBy: string;
  status: "Indexed" | "Processing" | "Needs review";
}

function doc(
  name: string,
  collection: string,
  type: DocRow["type"],
  pages: number,
  language: DocRow["language"],
  version: string,
  updated: string,
  lastIndexed: string,
  owner: string,
  status: DocRow["status"],
): DocRow {
  return {
    name,
    slug: slugify(name),
    collection,
    type,
    pages,
    chunks: Math.round(pages * 5.4),
    language,
    version,
    updated,
    lastIndexed,
    owner,
    uploadedBy: "Admin",
    status,
  };
}

export const DOCUMENTS: DocRow[] = [
  doc("Employee Leave Policy 2026", "HR", "PDF", 14, "Thai", "2.0", "2 days ago", "2 hours ago", "มนัสนันท์", "Indexed"),
  doc("Expense Reimbursement Guidelines", "Finance", "PDF", 9, "Thai", "1.3", "5 days ago", "5 days ago", "ธีรพงษ์", "Indexed"),
  doc("Line-2 Assembly SOP", "Production", "DOCX", 22, "Thai", "3.1", "1 day ago", "1 day ago", "กิตติ", "Indexed"),
  doc("Machine Safety Checklist", "Safety", "PDF", 6, "Thai", "1.0", "3 hours ago", "processing", "สุภาวดี", "Processing"),
  doc("API Gateway Runbook", "Engineering", "MD", 31, "English", "4.2", "6 hours ago", "6 hours ago", "อนุชา", "Indexed"),
  doc("Q4 Budget Allocation", "Finance", "XLSX", 4, "English", "1.0", "1 week ago", "1 week ago", "ธีรพงษ์", "Needs review"),
  doc("Onboarding Handbook", "HR", "PDF", 28, "Thai", "2.4", "1 week ago", "1 week ago", "มนัสนันท์", "Indexed"),
  doc("Incident Response Plan", "Safety", "DOCX", 17, "English", "2.0", "2 weeks ago", "2 weeks ago", "สุภาวดี", "Indexed"),
  doc("Service Architecture Overview", "Engineering", "MD", 40, "English", "5.0", "2 weeks ago", "2 weeks ago", "อนุชา", "Indexed"),
  doc("Purchase Request Procedure", "Finance", "PDF", 8, "Thai", "1.2", "3 weeks ago", "3 weeks ago", "สุภาวดี", "Indexed"),
];

export function findDoc(slug: string) {
  return DOCUMENTS.find((d) => d.slug === slug);
}
export function docsInCollection(name: string) {
  return DOCUMENTS.filter((d) => d.collection === name);
}

// ── Activity / questions / people ──
export interface ActivityRow {
  actor: string;
  action: string;
  target: string;
  when: string;
  kind: "upload" | "index" | "ask" | "update";
}

export const ACTIVITY: ActivityRow[] = [
  { actor: "Admin", action: "uploaded", target: "Employee Handbook", when: "2h ago", kind: "upload" },
  { actor: "System", action: "indexed", target: "Safety Manual", when: "3h ago", kind: "index" },
  { actor: "Somchai", action: "asked about", target: "Leave Policy", when: "4h ago", kind: "ask" },
  { actor: "อนุชา", action: "updated", target: "Engineering SOP", when: "6h ago", kind: "update" },
  { actor: "สุภาวดี", action: "flagged for review", target: "Q4 Budget Allocation", when: "1d ago", kind: "update" },
];

export const POPULAR_QUESTIONS = [
  "How do I request leave?",
  "Where is the onboarding handbook?",
  "Who approves purchase requests?",
  "Machine safety checklist",
  "What is the domestic travel per-diem?",
];

export interface Person {
  name: string;
  role: string;
  dept: string;
  questions: number;
}

export const PEOPLE: Person[] = [
  { name: "มนัสนันท์ ศรีวัฒน์", role: "Head of People", dept: "HR", questions: 142 },
  { name: "ธีรพงษ์ อินทร", role: "Finance Manager", dept: "Finance", questions: 98 },
  { name: "อนุชา พัฒน์", role: "Staff Engineer", dept: "Engineering", questions: 210 },
  { name: "สุภาวดี จันทร์", role: "Procurement Lead", dept: "Finance", questions: 76 },
  { name: "กิตติ วรกุล", role: "Production Manager", dept: "Production", questions: 65 },
];

// ── Workspace overview (Home) ──
export const OVERVIEW: { label: string; value: string; icon: IconName }[] = [
  { label: "Documents", value: "159", icon: "documents" },
  { label: "Knowledge Collections", value: "5", icon: "knowledge" },
  { label: "Team Members", value: "24", icon: "people" },
  { label: "Indexed Documents", value: "150", icon: "circleCheck" },
  { label: "Knowledge Health", value: "98%", icon: "activity" },
];
