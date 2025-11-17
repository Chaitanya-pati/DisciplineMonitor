import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Award, Target, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, subDays, subWeeks } from 'date-fns';

export default function Reports() {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  const today = new Date();
  const startDate = timeRange === 'week' 
    ? startOfWeek(today, { weekStartsOn: 1 })
    : subWeeks(today, 4);

  // Get daily summaries for the period
  const dailySummaries = useLiveQuery(async () => {
    const summaries = await db.dailySummaries.toArray();
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    
    return summaries.filter(s => s.date >= startDateStr).sort((a, b) => a.date.localeCompare(b.date));
  }, [startDate]);

  // Get completed tasks for the period
  const completedTasks = useLiveQuery(async () => {
    const tasks = await db.tasks.where('status').equals('completed').toArray();
    const startTime = startDate.getTime();
    
    return tasks.filter(t => t.completedAt && t.completedAt >= startTime);
  }, [startDate]);

  // Get pomodoro sessions for the period
  const pomodoroSessions = useLiveQuery(async () => {
    const sessions = await db.pomodoroSessions.toArray();
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    
    return sessions.filter(s => s.date >= startDateStr);
  }, [startDate]);

  // Get procrastination delays
  const delays = useLiveQuery(async () => {
    const allDelays = await db.procrastinationDelays.toArray();
    const startTime = startDate.getTime();
    
    return allDelays.filter(d => d.delayedAt >= startTime);
  }, [startDate]);

  // Calculate chart data
  const chartData = dailySummaries?.map(summary => {
    const date = summary.date;
    const tasksCompleted = completedTasks?.filter(t => {
      if (!t.completedAt) return false;
      const taskDate = format(new Date(t.completedAt), 'yyyy-MM-dd');
      return taskDate === date;
    }).length ?? 0;

    const pomodoros = pomodoroSessions?.filter(p => p.date === date).length ?? 0;

    return {
      date: format(new Date(date), 'MMM d'),
      fitnessScore: Math.round(summary.fitnessScore),
      tasksCompleted,
      pomodoros,
    };
  }) ?? [];

  // Calculate insights
  const avgFitnessScore = dailySummaries && dailySummaries.length > 0
    ? Math.round(dailySummaries.reduce((sum, s) => sum + s.fitnessScore, 0) / dailySummaries.length)
    : 0;

  const totalTasksCompleted = completedTasks?.length ?? 0;
  const totalPomodoros = pomodoroSessions?.length ?? 0;
  const totalDelays = delays?.length ?? 0;

  // Get streaks
  const fitnessStreak = useLiveQuery(() => db.streaks.where('type').equals('fitness').first());
  const productivityStreak = useLiveQuery(() => db.streaks.where('type').equals('productivity').first());

  const InsightCard = ({ icon: Icon, title, value, trend }: {
    icon: any;
    title: string;
    value: string;
    trend?: 'up' | 'down' | 'stable';
  }) => (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <Icon className="w-5 h-5 text-primary" />
        {trend && (
          <Badge variant="outline" className="text-xs">
            {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1 text-green-500" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3 mr-1 text-red-500" />}
            {trend === 'stable' && <Minus className="w-3 h-3 mr-1" />}
            {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
          </Badge>
        )}
      </div>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <p className="text-2xl font-bold" data-testid={`insight-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        {value}
      </p>
    </Card>
  );

  return (
    <div className="p-4 space-y-6 pb-20 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="page-title">Reports & Insights</h1>
        <p className="text-sm text-muted-foreground">Track your progress over time</p>
      </div>

      {/* Time Period Selector */}
      <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as 'week' | 'month')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="week" data-testid="tab-week">This Week</TabsTrigger>
          <TabsTrigger value="month" data-testid="tab-month">Last Month</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Key Insights */}
      <div className="grid grid-cols-2 gap-4">
        <InsightCard
          icon={Target}
          title="Avg Fitness Score"
          value={`${avgFitnessScore}%`}
          trend={avgFitnessScore > 70 ? 'up' : avgFitnessScore < 50 ? 'down' : 'stable'}
        />
        <InsightCard
          icon={Award}
          title="Tasks Completed"
          value={totalTasksCompleted.toString()}
          trend="up"
        />
        <InsightCard
          icon={Zap}
          title="Focus Sessions"
          value={totalPomodoros.toString()}
        />
        <InsightCard
          icon={Award}
          title="Best Streak"
          value={`${Math.max(fitnessStreak?.longestStreak ?? 0, productivityStreak?.longestStreak ?? 0)} days`}
        />
      </div>

      {/* Fitness Progress Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Fitness Progress</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="fitnessScore" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Productivity Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Productivity Overview</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Bar dataKey="tasksCompleted" fill="hsl(var(--chart-1))" name="Tasks" />
            <Bar dataKey="pomodoros" fill="hsl(var(--chart-2))" name="Pomodoros" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Additional Insights */}
      {totalDelays > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Anti-Procrastination Insights</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You delayed tasks {totalDelays} times this period. Most common reasons:
          </p>
          <div className="space-y-2">
            <Badge variant="secondary">Focus on breaking tasks into smaller steps</Badge>
            <Badge variant="secondary">Try the Pomodoro technique for better focus</Badge>
          </div>
        </Card>
      )}
    </div>
  );
}
