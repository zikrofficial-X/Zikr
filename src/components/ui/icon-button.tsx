import { cn } from '@/lib/utils';
export function IconButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={cn('rounded-full border border-brand-gold/40 p-2 text-brand-gold hover:bg-brand-gold/10', className)} {...props} />; }
