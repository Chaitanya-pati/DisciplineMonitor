import { Home, ListChecks, CheckSquare, BarChart3, Settings } from 'lucide-react';
import { useLocation, Link } from 'wouter';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/fitness', label: 'Fitness', icon: ListChecks },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card pb-safe">
      <div className="flex items-center justify-around h-16 max-w-7xl mx-auto px-2 safe-padding">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 hover-elevate active-elevate-2"
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon 
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-xs font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
