import { pgTable, text, serial, timestamp, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

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
  candidateId: integer("candidate_id").references(() => candidates.id).notNull(),
  status: text("status").notNull().default("in_progress"),
  technicalScore: integer("technical_score"),
  softSkillScore: integer("soft_skill_score"),
  report: json("report").$type<{
    technical: { category: string; score: number; notes: string }[];
    softSkills: { category: string; score: number; notes: string }[];
    overall: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").references(() => interviews.id).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Types
export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;

export type Interview = typeof interviews.$inferSelect;
export type NewInterview = typeof interviews.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

// Schemas
export const insertCandidateSchema = createInsertSchema(candidates);
export const selectCandidateSchema = createSelectSchema(candidates);