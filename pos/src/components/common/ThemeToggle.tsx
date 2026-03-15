import React from 'react';
import { useTheme } from '@contexts/ThemeContext';

interface ThemeToggleProps {
  /** When true, button is in-flow (e.g. inside sidebar). When false, fixed bottom-left. */
  variant?: 'floating' | 'inline';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'floating' }) => {
  const { theme, toggleTheme } = useTheme();

  const handleClick = () => {
    toggleTheme();
  };

  const isFloating = variant === 'floating';
  const positionClass = isFloating
    ? 'fixed bottom-6 left-6 z-50'
    : '';

  return (
    <button
      onClick={handleClick}
      className={`${positionClass} p-3 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-colors touch-manipulation`}
      aria-label="Toggle theme"
      title={`Current theme: ${theme}. Click to toggle.`}
    >
      {theme === 'light' ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </button>
  );
};
