import Dexie, { type Table } from 'dexie';
import type {
  ChecklistItem,
  DailyChecklistLog,
  DailySummary,
  Task,
  ProcrastinationDelay,
  PomodoroSession,
  Streak,
  MotivationQuote
} from '@shared/schema';

class FitFlowDatabase extends Dexie {
  checklistItems!: Table<ChecklistItem, string>;
  dailyChecklistLogs!: Table<DailyChecklistLog, string>;
  dailySummaries!: Table<DailySummary, string>;
  tasks!: Table<Task, string>;
  procrastinationDelays!: Table<ProcrastinationDelay, string>;
  pomodoroSessions!: Table<PomodoroSession, string>;
  streaks!: Table<Streak, string>;
  motivationQuotes!: Table<MotivationQuote, string>;

  constructor() {
    super('FitFlowDB');

    this.version(1).stores({
      checklistItems: 'id, order, isActive, createdAt',
      dailyChecklistLogs: 'id, checklistItemId, date, completedAt',
      dailySummaries: 'id, date, createdAt',
      tasks: 'id, status, priority, deadline, createdAt, completedAt',
      procrastinationDelays: 'id, taskId, delayedAt',
      pomodoroSessions: 'id, taskId, date, completedAt',
      streaks: 'id, type, lastUpdateDate',
      motivationQuotes: 'id, category'
    });
  }
}

export const db = new FitFlowDatabase();

// Initialize with default motivation quotes
export async function initializeDatabase() {
  const quotesCount = await db.motivationQuotes.count();

  if (quotesCount === 0) {
    const defaultQuotes: MotivationQuote[] = [
      // Fitness quotes
      { id: '1', text: 'The body achieves what the mind believes.', author: 'Napoleon Hill', category: 'fitness' },
      { id: '2', text: 'Take care of your body. It\'s the only place you have to live.', author: 'Jim Rohn', category: 'fitness' },
      { id: '3', text: 'Fitness is not about being better than someone else. It\'s about being better than you used to be.', author: 'Khloe Kardashian', category: 'fitness' },
      { id: '4', text: 'The only bad workout is the one that didn\'t happen.', author: 'Unknown', category: 'fitness' },
      { id: '5', text: 'Your health is an investment, not an expense.', author: 'Unknown', category: 'fitness' },

      // Productivity quotes
      { id: '6', text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney', category: 'productivity' },
      { id: '7', text: 'Productivity is never an accident. It is always the result of commitment to excellence.', author: 'Paul J. Meyer', category: 'productivity' },
      { id: '8', text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss', category: 'productivity' },
      { id: '9', text: 'Until we can manage time, we can manage nothing else.', author: 'Peter Drucker', category: 'productivity' },
      { id: '10', text: 'Action is the foundational key to all success.', author: 'Pablo Picasso', category: 'productivity' },

      // General
      { id: '11', text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier', category: 'general' },
      { id: '12', text: 'The secret of getting ahead is getting started.', author: 'Mark Twain', category: 'general' },
      { id: '13', text: 'Don\'t watch the clock; do what it does. Keep going.', author: 'Sam Levenson', category: 'general' },
      { id: '14', text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt', category: 'general' },
      { id: '15', text: 'The future depends on what you do today.', author: 'Mahatma Gandhi', category: 'general' },
    ];

    try {
      await db.motivationQuotes.bulkAdd(defaultQuotes);
    } catch (error) {
      // Ignore ConstraintError - quotes already exist
      console.debug('Quotes already initialized');
    }
  }

  // Initialize streaks if they don't exist
  const streaksCount = await db.streaks.count();
  if (streaksCount === 0) {
    const today = new Date().toISOString().split('T')[0];
    try {
      await db.streaks.bulkAdd([
        { id: 'fitness-streak', type: 'fitness', currentStreak: 0, longestStreak: 0, lastUpdateDate: today, cheatDaysUsed: 0 },
        { id: 'productivity-streak', type: 'productivity', currentStreak: 0, longestStreak: 0, lastUpdateDate: today, cheatDaysUsed: 0 }
      ]);
    } catch (error) {
      // Ignore ConstraintError - streaks already exist
    }
  }
}