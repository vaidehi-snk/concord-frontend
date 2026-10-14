import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getTheme, setTheme, subscribeTheme } from '../lib/theme';

// Both icons are rendered and CSS shows the right one, so the pre-rendered
// home page and the browser always produce the same markup.
export default function ThemeToggle({ className = '' }) {
  const [theme, setLocal] = useState(null);
  useEffect(() => {
    setLocal(getTheme());
    return subscribeTheme(setLocal);
  }, []);
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={`theme-toggle btn-ghost h-10 w-10 shrink-0 px-0 ${className}`}
      aria-label="Dark theme"
      aria-pressed={theme ? dark : undefined}
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(getTheme() === 'dark' ? 'light' : 'dark')}
    >
      <Moon size={18} className="icon-moon" aria-hidden />
      <Sun size={18} className="icon-sun" aria-hidden />
    </button>
  );
}
