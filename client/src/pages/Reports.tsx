import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Award, Target, Zap, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, subDays, subWeeks, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  const presets = [
    { label: 'This Week', range: { from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) } },
    { label: 'Last Week', range: { from: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), to: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }) } },
    { label: 'This Month', range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } },
    { label: 'Last Month', range: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) } },
  ];

  const startDate = dateRange?.from || startOfWeek(new Date());
  const endDate = dateRange?.to || endOfWeek(new Date());

  // Get daily summaries for the period
  const dailySummaries = useLiveQuery(async () => {
    const summaries = await db.dailySummaries.toArray();
    return summaries.filter(s => {
      const d = new Date(s.date);
      return d >= startDate && d <= endDate;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [startDate, endDate]);

  const checklistLogs = useLiveQuery(() => 
    db.dailyChecklistLogs.toArray()
  );

  const checklistItems = useLiveQuery(() => 
    db.checklistItems.toArray()
  );

  const completedTasks = useLiveQuery(async () => {
    const tasks = await db.tasks.where('status').equals('completed').toArray();
    return tasks.filter(t => t.completedAt && t.completedAt >= startDate.getTime() && t.completedAt <= endDate.getTime());
  }, [startDate, endDate]);

  const pomodoroSessions = useLiveQuery(async () => {
    const sessions = await db.pomodoroSessions.toArray();
    return sessions.filter(s => {
      const d = new Date(s.date);
      return d >= startDate && d <= endDate;
    });
  }, [startDate, endDate]);

  const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });

  const dailyDetails = daysInRange.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const summary = dailySummaries?.find(s => s.date === dateStr);
    const logs = checklistLogs?.filter(l => l.date === dateStr);
    const tasks = completedTasks?.filter(t => t.completedAt && format(new Date(t.completedAt), 'yyyy-MM-dd') === dateStr);
    
    return {
      date: day,
      dateStr,
      summary,
      logs: logs?.map(l => ({ ...l, item: checklistItems?.find(i => i.id === l.checklistItemId) })),
      tasks,
    };
  }).reverse();

  // Chart data
  const chartData = daysInRange.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const summary = dailySummaries?.find(s => s.date === dateStr);
    const tasksCount = completedTasks?.filter(t => t.completedAt && format(new Date(t.completedAt), 'yyyy-MM-dd') === dateStr).length || 0;
    return {
      date: format(day, 'MMM d'),
      fitnessScore: summary ? Math.round(summary.fitnessScore) : 0,
      tasksCompleted: tasksCount,
    };
  });

  return (
    <div className="p-4 space-y-6 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Reports & Insights</h1>
          <p className="text-sm text-muted-foreground">Detailed progress breakdown</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal w-[280px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
              <div className="p-3 border-t grid grid-cols-2 gap-2">
                {presets.map(p => (
                  <Button key={p.label} variant="ghost" size="sm" onClick={() => setDateRange(p.range)}>
                    {p.label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Fitness & Task Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/.2)" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="fitnessScore" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Fitness %" />
              <Line type="monotone" dataKey="tasksCompleted" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="Tasks" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Daily Breakdown</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {dailyDetails.map(day => (
              <div key={day.dateStr} className="border-b pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{format(day.date, 'EEEE, MMM d')}</span>
                  <Badge variant={day.summary && day.summary.fitnessScore > 70 ? 'default' : 'secondary'}>
                    {day.summary ? `${Math.round(day.summary.fitnessScore)}% Score` : 'No data'}
                  </Badge>
                </div>
                {day.logs && day.logs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {day.logs.map(log => (
                      <Badge key={log.id} variant="outline" className="text-[10px] py-0">
                        {log.item?.title}: {log.value === true ? 'Yes' : log.value}
                      </Badge>
                    ))}
                  </div>
                )}
                {day.tasks && day.tasks.length > 0 && (
                  <div className="text-[11px] text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 inline mr-1 text-primary" />
                    {day.tasks.length} tasks completed
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
