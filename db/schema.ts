import { pgTable, text, serial, timestamp, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  cvUrl: text("cv_url").notNull(),
  cvAnalysis: json("cv_analysis").$type<{
    skills: string[];
    experience: { company: string; role: string; duration: string }[];
    education: { degree: string; institution: string; year: string }[];
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id),
  status: text("status").notNull().default("in_progress"),
  technicalScore: integer("technical_score"),
  softSkillScore: integer("soft_skill_score"),
  report: json("report").$type<{
    technical: { category: string; score: number; notes: string }[];
    softSkills: { category: string; score: number; notes: string }[];
    overall: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").references(() => interviews.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export type Candidate = typeof candidates.$inferSelect;
export type Interview = typeof interviews.$inferSelect;
export type Message = typeof messages.$inferSelect;

export const insertCandidateSchema = createInsertSchema(candidates);
export const selectCandidateSchema = createSelectSchema(candidates);
