import { Card } from './card';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center py-12 text-center space-y-4">
      <div className="text-5xl">{icon}</div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-brand-cream">{title}</h3>
        {description && (
          <p className="text-sm arabic-muted">{description}</p>
        )}
      </div>
      {action && (
        <a
          href={action.href}
          onClick={action.onClick}
          className="mt-4 inline-block px-4 py-2 rounded-lg bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-colors text-sm font-medium"
        >
          {action.label}
        </a>
      )}
    </Card>
  );
}
