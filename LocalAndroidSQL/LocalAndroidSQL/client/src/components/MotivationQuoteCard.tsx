import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface MotivationQuoteCardProps {
  text: string;
  author: string;
}

export function MotivationQuoteCard({ text, author }: MotivationQuoteCardProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
      <div className="flex gap-3">
        <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
        <div className="flex flex-col gap-2">
          <p className="text-base italic leading-relaxed" data-testid="quote-text">
            "{text}"
          </p>
          <p className="text-sm text-muted-foreground font-medium" data-testid="quote-author">
            — {author}
          </p>
        </div>
      </div>
    </Card>
  );
}
