import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Download, Upload, Trash2, Moon, Sun } from 'lucide-react';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/ThemeProvider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const handleExportData = async () => {
    try {
      const data = {
        checklistItems: await db.checklistItems.toArray(),
        dailyChecklistLogs: await db.dailyChecklistLogs.toArray(),
        dailySummaries: await db.dailySummaries.toArray(),
        tasks: await db.tasks.toArray(),
        procrastinationDelays: await db.procrastinationDelays.toArray(),
        pomodoroSessions: await db.pomodoroSessions.toArray(),
        streaks: await db.streaks.toArray(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Data exported successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data.',
        variant: 'destructive',
      });
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        await db.checklistItems.bulkPut(data.checklistItems ?? []);
        await db.dailyChecklistLogs.bulkPut(data.dailyChecklistLogs ?? []);
        await db.dailySummaries.bulkPut(data.dailySummaries ?? []);
        await db.tasks.bulkPut(data.tasks ?? []);
        await db.procrastinationDelays.bulkPut(data.procrastinationDelays ?? []);
        await db.pomodoroSessions.bulkPut(data.pomodoroSessions ?? []);
        await db.streaks.bulkPut(data.streaks ?? []);

        toast({
          title: 'Success',
          description: 'Data imported successfully!',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to import data. Please check the file format.',
          variant: 'destructive',
        });
      }
    };

    input.click();
  };

  const handleClearAllData = async () => {
    try {
      await db.checklistItems.clear();
      await db.dailyChecklistLogs.clear();
      await db.dailySummaries.clear();
      await db.tasks.clear();
      await db.procrastinationDelays.clear();
      await db.pomodoroSessions.clear();
      
      // Reset streaks
      const today = new Date().toISOString().split('T')[0];
      await db.streaks.clear();
      await db.streaks.bulkAdd([
        { id: 'fitness-streak', type: 'fitness', currentStreak: 0, longestStreak: 0, lastUpdateDate: today, cheatDaysUsed: 0 },
        { id: 'productivity-streak', type: 'productivity', currentStreak: 0, longestStreak: 0, lastUpdateDate: today, cheatDaysUsed: 0 }
      ]);

      toast({
        title: 'Success',
        description: 'All data has been cleared.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear data.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 space-y-6 pb-20 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="page-title">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your preferences</p>
      </div>

      {/* Appearance */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Toggle dark theme</p>
            </div>
          </div>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
            data-testid="toggle-dark-mode"
          />
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Data Management</h2>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExportData}
            data-testid="button-export"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleImportData}
            data-testid="button-import"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Data
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                data-testid="button-clear-data"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your habits,
                  tasks, progress logs, and statistics from this device.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-clear">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAllData}
                  className="bg-destructive hover:bg-destructive/90"
                  data-testid="button-confirm-clear"
                >
                  Delete Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      {/* About */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-2">About FitFlow</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Version 1.0.0 - Your personal fitness and productivity companion
        </p>
        <p className="text-sm text-muted-foreground">
          All data is stored locally on your device using IndexedDB. Use the export feature
          to create backups of your progress.
        </p>
      </Card>
    </div>
  );
}
