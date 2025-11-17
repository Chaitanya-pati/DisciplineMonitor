import { db } from './db';
import { format, parseISO, differenceInDays } from 'date-fns';

export async function updateFitnessStreak(completionPercentage: number, isCheatDay: boolean = false) {
  const today = format(new Date(), 'yyyy-MM-dd');
  let streak = await db.streaks.where('type').equals('fitness').first();
  
  // Create streak if it doesn't exist
  if (!streak) {
    const newStreak = {
      id: 'fitness-streak',
      type: 'fitness' as const,
      currentStreak: completionPercentage >= 70 || isCheatDay ? 1 : 0,
      longestStreak: completionPercentage >= 70 || isCheatDay ? 1 : 0,
      lastUpdateDate: today,
      cheatDaysUsed: isCheatDay ? 1 : 0,
    };
    await db.streaks.add(newStreak);
    return;
  }

  const lastUpdateDate = parseISO(streak.lastUpdateDate);
  const daysDiff = differenceInDays(parseISO(today), lastUpdateDate);

  let newStreak = streak.currentStreak;
  let longestStreak = streak.longestStreak;
  let cheatDaysUsed = streak.cheatDaysUsed;

  if (daysDiff === 0) {
    // Same day - fully recompute today's qualification status
    const qualifiesNow = completionPercentage >= 70 || isCheatDay;
    
    if (qualifiesNow && newStreak === 0) {
      // First time qualifying today
      newStreak = 1;
    } else if (!qualifiesNow && newStreak > 0) {
      // No longer qualifying today
      newStreak = 0;
    }
    
    // Update cheat day count for same-day changes
    if (isCheatDay) {
      cheatDaysUsed = 1;
    } else if (!qualifiesNow) {
      cheatDaysUsed = 0;
    }
  } else if (daysDiff === 1) {
    // Consecutive day
    if (completionPercentage >= 70 || isCheatDay) {
      newStreak += 1;
      if (isCheatDay) {
        cheatDaysUsed += 1;
      }
    } else {
      // Streak broken
      newStreak = 0;
      cheatDaysUsed = 0;
    }
  } else if (daysDiff > 1) {
    // Missed days, streak broken
    newStreak = completionPercentage >= 70 ? 1 : 0;
    cheatDaysUsed = 0;
  }

  if (newStreak > longestStreak) {
    longestStreak = newStreak;
  }

  await db.streaks.update(streak.id, {
    currentStreak: newStreak,
    longestStreak,
    lastUpdateDate: today,
    cheatDaysUsed,
  });
}

export async function updateProductivityStreak(tasksCompletedToday: number) {
  const today = format(new Date(), 'yyyy-MM-dd');
  let streak = await db.streaks.where('type').equals('productivity').first();
  
  // Create streak if it doesn't exist
  if (!streak) {
    const newStreak = {
      id: 'productivity-streak',
      type: 'productivity' as const,
      currentStreak: tasksCompletedToday > 0 ? 1 : 0,
      longestStreak: tasksCompletedToday > 0 ? 1 : 0,
      lastUpdateDate: today,
      cheatDaysUsed: 0,
    };
    await db.streaks.add(newStreak);
    return;
  }

  const lastUpdateDate = parseISO(streak.lastUpdateDate);
  const daysDiff = differenceInDays(parseISO(today), lastUpdateDate);

  let newStreak = streak.currentStreak;
  let longestStreak = streak.longestStreak;

  if (daysDiff === 0) {
    // Same day - fully recompute today's qualification status
    const qualifiesNow = tasksCompletedToday > 0;
    
    if (qualifiesNow && newStreak === 0) {
      // First time qualifying today
      newStreak = 1;
    } else if (!qualifiesNow && newStreak > 0) {
      // No longer qualifying today
      newStreak = 0;
    }
  } else if (daysDiff === 1) {
    // Consecutive day
    if (tasksCompletedToday > 0) {
      newStreak += 1;
    } else {
      newStreak = 0;
    }
  } else if (daysDiff > 1) {
    // Missed days, streak broken
    newStreak = tasksCompletedToday > 0 ? 1 : 0;
  }

  if (newStreak > longestStreak) {
    longestStreak = newStreak;
  }

  await db.streaks.update(streak.id, {
    currentStreak: newStreak,
    longestStreak,
    lastUpdateDate: today,
  });
}
