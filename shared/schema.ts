import { z } from "zod";

// ============================================================================
// CHECKLIST SCHEMAS (Section A - Fitness)
// ============================================================================

export const inputTypeEnum = z.enum(["yesno", "number", "slider", "dropdown", "timer"]);

export const checklistItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  inputType: inputTypeEnum,
  targetValue: z.number().optional(),
  unit: z.string().optional(),
  dropdownOptions: z.array(z.string()).optional(),
  order: z.number(),
  reminderTime: z.string().optional(), // HH:mm format
  isActive: z.boolean().default(true),
  createdAt: z.number(), // timestamp
});

export const insertChecklistItemSchema = checklistItemSchema.omit({ id: true, createdAt: true });

export type ChecklistItem = z.infer<typeof checklistItemSchema>;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;

// Daily completion log for a checklist item
export const dailyChecklistLogSchema = z.object({
  id: z.string(),
  checklistItemId: z.string(),
  date: z.string(), // YYYY-MM-DD format
  value: z.union([z.boolean(), z.number(), z.string()]), // depends on input type
  completedAt: z.number(), // timestamp
});

export const insertDailyChecklistLogSchema = dailyChecklistLogSchema.omit({ id: true, completedAt: true });

export type DailyChecklistLog = z.infer<typeof dailyChecklistLogSchema>;
export type InsertDailyChecklistLog = z.infer<typeof insertDailyChecklistLogSchema>;

// Daily summary
export const dailySummarySchema = z.object({
  id: z.string(),
  date: z.string(), // YYYY-MM-DD format
  fitnessScore: z.number(), // 0-100
  totalItems: z.number(),
  completedItems: z.number(),
  isCheatDay: z.boolean().default(false),
  createdAt: z.number(),
});

export const insertDailySummarySchema = dailySummarySchema.omit({ id: true, createdAt: true });

export type DailySummary = z.infer<typeof dailySummarySchema>;
export type InsertDailySummary = z.infer<typeof insertDailySummarySchema>;

// ============================================================================
// TASK SCHEMAS (Section B - Productivity)
// ============================================================================

export const priorityEnum = z.enum(["low", "medium", "high"]);
export const taskStatusEnum = z.enum(["pending", "in-progress", "completed"]);

export const subtaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean().default(false),
});

export const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: priorityEnum,
  status: taskStatusEnum.default("pending"),
  estimatedTime: z.number().optional(), // in minutes
  deadline: z.number().optional(), // timestamp
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  subtasks: z.array(subtaskSchema).default([]),
  createdAt: z.number(),
  completedAt: z.number().optional(),
  totalTimeSpent: z.number().default(0), // in minutes
});

export const insertTaskSchema = taskSchema.omit({ id: true, createdAt: true });

export type Task = z.infer<typeof taskSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Subtask = z.infer<typeof subtaskSchema>;

// Procrastination delay tracking
export const delayReasonEnum = z.enum([
  "tired",
  "later",
  "boring",
  "not_urgent",
  "overwhelmed",
  "distracted",
  "other"
]);

export const procrastinationDelaySchema = z.object({
  id: z.string(),
  taskId: z.string(),
  reason: delayReasonEnum,
  microAction: z.string().optional(), // suggested action
  delayedAt: z.number(), // timestamp
});

export const insertProcrastinationDelaySchema = procrastinationDelaySchema.omit({ id: true, delayedAt: true });

export type ProcrastinationDelay = z.infer<typeof procrastinationDelaySchema>;
export type InsertProcrastinationDelay = z.infer<typeof insertProcrastinationDelaySchema>;

// Pomodoro sessions
export const pomodoroSessionSchema = z.object({
  id: z.string(),
  taskId: z.string().optional(),
  duration: z.number(), // in minutes
  completedAt: z.number(), // timestamp
  date: z.string(), // YYYY-MM-DD
});

export const insertPomodoroSessionSchema = pomodoroSessionSchema.omit({ id: true, completedAt: true });

export type PomodoroSession = z.infer<typeof pomodoroSessionSchema>;
export type InsertPomodoroSession = z.infer<typeof insertPomodoroSessionSchema>;

// ============================================================================
// STREAKS & ACHIEVEMENTS
// ============================================================================

export const streakSchema = z.object({
  id: z.string(),
  type: z.enum(["fitness", "productivity"]),
  currentStreak: z.number().default(0),
  longestStreak: z.number().default(0),
  lastUpdateDate: z.string(), // YYYY-MM-DD
  cheatDaysUsed: z.number().default(0),
});

export const insertStreakSchema = streakSchema.omit({ id: true });

export type Streak = z.infer<typeof streakSchema>;
export type InsertStreak = z.infer<typeof insertStreakSchema>;

// ============================================================================
// MOTIVATION QUOTES
// ============================================================================

export const motivationQuoteSchema = z.object({
  id: z.string(),
  text: z.string(),
  author: z.string(),
  category: z.enum(["fitness", "productivity", "general"]),
});

export type MotivationQuote = z.infer<typeof motivationQuoteSchema>;

// ============================================================================
// ANALYTICS & INSIGHTS
// ============================================================================

export interface WeeklyStats {
  week: string; // ISO week format
  fitnessScore: number;
  tasksCompleted: number;
  pomodoroSessions: number;
  procrastinationCount: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  fitnessScore: number;
  tasksCompleted: number;
  pomodoroSessions: number;
  procrastinationCount: number;
}

export interface HabitInsight {
  habitTitle: string;
  completionRate: number;
  consistencyScore: number;
  trend: "improving" | "declining" | "stable";
}
