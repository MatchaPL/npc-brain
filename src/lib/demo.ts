import type { IconName } from "@/components/icons";

// Fictional workspace data for the enterprise UI (safe to publish).

export const WORKSPACE = { name: "NPC Co., Ltd.", plan: "Business" };

export interface Collection {
  name: string;
  icon: IconName;
  docs: number;
  tint: string; // soft bg
  fg: string; // icon color
}

export const COLLECTIONS: Collection[] = [
  { name: "HR", icon: "people", docs: 24, tint: "#eef2ff", fg: "#2f5aff" },
  { name: "Production", icon: "box", docs: 38, tint: "#f0fdf4", fg: "#16a34a" },
  { name: "Safety", icon: "shield", docs: 16, tint: "#fff7ed", fg: "#ea580c" },
  { name: "Engineering", icon: "wrench", docs: 52, tint: "#f5f3ff", fg: "#7c3aed" },
  { name: "Finance", icon: "dollar", docs: 29, tint: "#ecfeff", fg: "#0891b2" },
];

export interface DocRow {
  name: string;
  collection: string;
  type: "PDF" | "DOCX" | "XLSX" | "MD";
  pages: number;
  updated: string;
  owner: string;
  status: "Indexed" | "Processing" | "Needs review";
}

export const DOCUMENTS: DocRow[] = [
  { name: "Employee Leave Policy 2026", collection: "HR", type: "PDF", pages: 14, updated: "2 days ago", owner: "มนัสนันท์", status: "Indexed" },
  { name: "Expense Reimbursement Guidelines", collection: "Finance", type: "PDF", pages: 9, updated: "5 days ago", owner: "ธีรพงษ์", status: "Indexed" },
  { name: "Line-2 Assembly SOP", collection: "Production", type: "DOCX", pages: 22, updated: "1 day ago", owner: "กิตติ", status: "Indexed" },
  { name: "Machine Safety Checklist", collection: "Safety", type: "PDF", pages: 6, updated: "3 hours ago", owner: "สุภาวดี", status: "Processing" },
  { name: "API Gateway Runbook", collection: "Engineering", type: "MD", pages: 31, updated: "6 hours ago", owner: "อนุชา", status: "Indexed" },
  { name: "Q4 Budget Allocation", collection: "Finance", type: "XLSX", pages: 4, updated: "1 week ago", owner: "ธีรพงษ์", status: "Needs review" },
  { name: "Onboarding Handbook", collection: "HR", type: "PDF", pages: 28, updated: "1 week ago", owner: "มนัสนันท์", status: "Indexed" },
  { name: "Incident Response Plan", collection: "Safety", type: "DOCX", pages: 17, updated: "2 weeks ago", owner: "สุภาวดี", status: "Indexed" },
  { name: "Service Architecture Overview", collection: "Engineering", type: "MD", pages: 40, updated: "2 weeks ago", owner: "อนุชา", status: "Indexed" },
  { name: "Purchase Request Procedure", collection: "Finance", type: "PDF", pages: 8, updated: "3 weeks ago", owner: "สุภาวดี", status: "Indexed" },
];

export interface QuestionRow {
  q: string;
  asker: string;
  when: string;
  sources: number;
}

export const RECENT_QUESTIONS: QuestionRow[] = [
  { q: "How many sick-leave days require a medical certificate?", asker: "Nattapong", when: "12m ago", sources: 3 },
  { q: "What's the per-diem for domestic business travel?", asker: "Ploy", when: "40m ago", sources: 2 },
  { q: "Where is the latest quotation template?", asker: "Kittise", when: "1h ago", sources: 1 },
  { q: "What is the approval limit for a purchase request?", asker: "Warin", when: "2h ago", sources: 2 },
  { q: "Steps to file a machine safety incident?", asker: "Somchai", when: "3h ago", sources: 4 },
];

export interface ActivityRow {
  actor: string;
  action: string;
  target: string;
  when: string;
}

export const ACTIVITY: ActivityRow[] = [
  { actor: "อนุชา", action: "uploaded", target: "API Gateway Runbook", when: "6h ago" },
  { actor: "สุภาวดี", action: "flagged for review", target: "Q4 Budget Allocation", when: "1d ago" },
  { actor: "มนัสนันท์", action: "updated", target: "Employee Leave Policy 2026", when: "2d ago" },
  { actor: "System", action: "re-indexed", target: "Engineering collection", when: "2d ago" },
  { actor: "กิตติ", action: "added", target: "Line-2 Assembly SOP", when: "3d ago" },
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

export const STATS = [
  { label: "Documents", value: "159", sub: "across 5 collections" },
  { label: "Questions this week", value: "1,284", sub: "+12% vs last week" },
  { label: "Knowledge coverage", value: "94%", sub: "of documents indexed" },
  { label: "Avg. answer time", value: "1.8s", sub: "with citations" },
];
