import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/severity';

/** Animated sun/moon toggle. Persists choice; syncs <html class="dark">. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      onClick={toggle}
      className={cn(
        'relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg border border-line bg-raised text-ink-soft',
        'hover:text-ink transition-colors',
        className,
      )}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
      title={`Switch to ${dark ? 'light' : 'dark'} mode`}
    >
      <Sun
        className={cn('absolute h-4.5 w-4.5 transition-all duration-300', dark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100')}
        aria-hidden
      />
      <Moon
        className={cn('absolute h-4.5 w-4.5 transition-all duration-300', dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0')}
        aria-hidden
      />
    </button>
  );
}