import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const cases = sqliteTable("cases", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").notNull().default("created"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const materials = sqliteTable("materials", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  originalName: text("original_name").notNull(),
  storageKey: text("storage_key").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  category: text("category"),
  status: text("status").notNull().default("uploaded"),
  extractedText: text("extracted_text"),
  extractedMeta: text("extracted_meta"),
  errorMsg: text("error_msg"),
  createdAt: integer("created_at").notNull(),
});

export const analysisResults = sqliteTable("analysis_results", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  timeline: text("timeline").notNull().default("[]"),
  summary: text("summary").notNull().default("{}"),
  todos: text("todos").notNull().default("[]"),
  suggestions: text("suggestions").notNull().default("[]"),
  engineUsed: text("engine_used").notNull().default("local-rules-v1"),
  createdAt: integer("created_at").notNull(),
});
