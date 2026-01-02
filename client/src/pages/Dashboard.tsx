import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CircularProgress } from '@/components/CircularProgress';
import { StatCard } from '@/components/StatCard';
import { MotivationQuoteCard } from '@/components/MotivationQuoteCard';
import { Flame, CheckCircle2, Droplet, Footprints } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function Dashboard() {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const todaySummary = useLiveQuery(
    () => db.dailySummaries.where('date').equals(today).first()
  );
  
  const fitnessStreak = useLiveQuery(
    () => db.streaks.where('type').equals('fitness').first()
  );
  
  const productivityStreak = useLiveQuery(
    () => db.streaks.where('type').equals('productivity').first()
  );
  
  const todayLogs = useLiveQuery(
    () => db.dailyChecklistLogs.where('date').equals(today).toArray()
  );
  
  const completedTasks = useLiveQuery(async () => {
    const allTasks = await db.tasks.toArray();
    return allTasks.filter(t => {
      if (!t.completedAt) return false;
      const completedDate = format(new Date(t.completedAt), 'yyyy-MM-dd');
      return completedDate === today;
    }).length;
  });
  
  const randomQuote = useLiveQuery(async () => {
    const quotes = await db.motivationQuotes.toArray();
    if (quotes.length === 0) return null;
    return quotes[Math.floor(Math.random() * quotes.length)];
  });

  const checklistItems = useLiveQuery(
    () => db.checklistItems.orderBy('order').toArray(),
    []
  );

  const calculateFitnessScore = () => {
    if (!checklistItems || checklistItems.length === 0) return 0;
    
    const activeItems = checklistItems.filter(i => i.isActive);
    if (activeItems.length === 0) return 0;

    const totalProgress = activeItems.reduce((acc, item) => {
      const log = todayLogs?.find(l => l.checklistItemId === item.id);
      if (!log) return acc;

      switch (item.inputType) {
        case 'yesno':
          return acc + (log.value === true ? 1 : 0);
        case 'number':
        case 'slider':
        case 'timer':
          const target = item.targetValue || 1;
          const current = typeof log.value === 'number' ? log.value : 0;
          return acc + Math.min(current / target, 1);
        case 'dropdown':
          if (log.value === 'High') return acc + 1;
          if (log.value === 'Medium') return acc + 0.5;
          if (log.value === 'Low') return acc + 0.25;
          return acc;
        default:
          return acc;
      }
    }, 0);

    return Math.round((totalProgress / activeItems.length) * 100);
  };

  const fitnessScore = calculateFitnessScore();
  const activeItemsCount = checklistItems?.filter(i => i.isActive).length || 0;
  const score = fitnessScore;
  const completedItems = todayLogs?.filter(log => {
    const item = checklistItems?.find(i => i.id === log.checklistItemId);
    if (!item || !item.isActive) return false;
    
    switch (item.inputType) {
      case 'yesno': return log.value === true;
      case 'number':
      case 'slider':
      case 'timer': return (typeof log.value === 'number' ? log.value : 0) >= (item.targetValue || 1);
      case 'dropdown': return log.value === 'High';
      default: return false;
    }
  }).length || 0;
  const totalItems = activeItemsCount;

  if (fitnessStreak === undefined || productivityStreak === undefined || completedTasks === undefined) {
    return (
      <div className="p-4 space-y-6 pb-20">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold" data-testid="page-title">Today's Progress</h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Daily Score Card */}
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4">
          <CircularProgress value={score}>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold" data-testid="daily-score">{Math.round(score)}</span>
              <span className="text-sm text-muted-foreground">Score</span>
            </div>
          </CircularProgress>
          
          <div className="text-center space-y-1">
            <p className="text-base font-medium" data-testid="completion-summary">
              {completedItems} of {totalItems} habits completed
            </p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-orange-500" data-testid="streak-count">
                {fitnessStreak?.currentStreak ?? 0} day streak
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={Flame} 
          label="Fitness Streak" 
          value={fitnessStreak?.currentStreak ?? 0}
          iconColor="text-orange-500"
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Tasks Done" 
          value={completedTasks ?? 0}
          iconColor="text-primary"
        />
        <StatCard 
          icon={Droplet} 
          label="Habits Logged" 
          value={todayLogs?.length ?? 0}
          iconColor="text-blue-500"
        />
        <StatCard 
          icon={Footprints} 
          label="Work Streak" 
          value={productivityStreak?.currentStreak ?? 0}
          iconColor="text-purple-500"
        />
      </div>

      {/* Motivation Quote */}
      {randomQuote && (
        <MotivationQuoteCard 
          text={randomQuote.text}
          author={randomQuote.author}
        />
      )}
    </div>
  );
}
