import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function Settings() {
  return (
    <div className="p-4 space-y-6 pb-20 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your preferences</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-4">About</h2>
            <p className="text-sm text-muted-foreground">
              Life Tracker - Your personal productivity and fitness companion
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-medium mb-4">Data Management</h2>
            <p className="text-sm text-muted-foreground">
              All your data is stored locally on your device
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}