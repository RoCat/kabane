/**
 * Shared CSS styles for Kabane components
 * Uses CSS custom properties for theming
 */

import { css } from 'lit';

/**
 * CSS custom properties (design tokens)
 * Dark theme by default, matching GitHub's dark mode
 */
export const themeStyles = css`
  :host {
    /* Colors */
    --color-bg-primary: #0d1117;
    --color-bg-secondary: #161b22;
    --color-bg-tertiary: #21262d;
    --color-bg-canvas: #010409;

    --color-border-default: #30363d;
    --color-border-muted: #21262d;

    --color-text-primary: #c9d1d9;
    --color-text-secondary: #8b949e;
    --color-text-muted: #6e7681;
    --color-text-link: #58a6ff;

    --color-accent-primary: #238636;
    --color-accent-secondary: #1f6feb;
    --color-accent-danger: #da3633;
    --color-accent-warning: #d29922;

    /* Ticket type colors */
    --color-epic: #a371f7;
    --color-story: #3fb950;
    --color-bug: #f85149;
    --color-task: #58a6ff;

    /* Priority colors */
    --color-priority-low: #8b949e;
    --color-priority-medium: #d29922;
    --color-priority-high: #f85149;
    --color-priority-critical: #da3633;

    /* Spacing */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 32px;

    /* Border radius */
    --radius-sm: 4px;
    --radius-md: 6px;
    --radius-lg: 12px;

    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.4);

    /* Typography */
    --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    --font-mono: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;

    --font-size-xs: 12px;
    --font-size-sm: 14px;
    --font-size-md: 16px;
    --font-size-lg: 20px;
    --font-size-xl: 24px;

    --line-height: 1.5;

    /* Transitions */
    --transition-fast: 150ms ease;
    --transition-normal: 250ms ease;

    /* Layout */
    --header-height: 60px;
    --sidebar-width: 280px;
  }
`;

/**
 * Reset and base styles
 */
export const resetStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  :host {
    font-family: var(--font-family);
    font-size: var(--font-size-md);
    line-height: var(--line-height);
    color: var(--color-text-primary);
  }
`;

/**
 * Common button styles
 */
export const buttonStyles = css`
  button {
    font-family: inherit;
    font-size: var(--font-size-sm);
    cursor: pointer;
    border: none;
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    transition: all var(--transition-fast);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--color-accent-primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2ea043;
  }

  .btn-secondary {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-default);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--color-border-default);
  }

  .btn-danger {
    background: var(--color-accent-danger);
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #b62324;
  }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-secondary);
  }

  .btn-ghost:hover:not(:disabled) {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .btn-icon {
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
`;

/**
 * Form input styles
 */
export const inputStyles = css`
  input,
  textarea,
  select {
    font-family: inherit;
    font-size: var(--font-size-sm);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    transition: border-color var(--transition-fast);
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: none;
    border-color: var(--color-accent-secondary);
  }

  input::placeholder,
  textarea::placeholder {
    color: var(--color-text-muted);
  }

  label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: 500;
    margin-bottom: var(--space-xs);
    color: var(--color-text-secondary);
  }
`;

/**
 * Card container styles
 */
export const cardStyles = css`
  .card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    padding: var(--space-md);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-md);
  }

  .card-title {
    font-size: var(--font-size-md);
    font-weight: 600;
    margin: 0;
  }
`;

/**
 * Badge/tag styles
 */
export const badgeStyles = css`
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 2px var(--space-sm);
    font-size: var(--font-size-xs);
    font-weight: 500;
    border-radius: var(--radius-sm);
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
  }

  .badge-epic {
    background: rgba(163, 113, 247, 0.2);
    color: var(--color-epic);
  }

  .badge-story {
    background: rgba(63, 185, 80, 0.2);
    color: var(--color-story);
  }

  .badge-bug {
    background: rgba(248, 81, 73, 0.2);
    color: var(--color-bug);
  }

  .badge-task {
    background: rgba(88, 166, 255, 0.2);
    color: var(--color-task);
  }

  .badge-priority-low {
    background: rgba(139, 148, 158, 0.2);
    color: var(--color-priority-low);
  }

  .badge-priority-medium {
    background: rgba(210, 153, 34, 0.2);
    color: var(--color-priority-medium);
  }

  .badge-priority-high {
    background: rgba(248, 81, 73, 0.2);
    color: var(--color-priority-high);
  }

  .badge-priority-critical {
    background: rgba(218, 54, 51, 0.3);
    color: var(--color-priority-critical);
  }
`;

/**
 * Layout utilities
 */
export const layoutStyles = css`
  .flex {
    display: flex;
  }

  .flex-col {
    flex-direction: column;
  }

  .items-center {
    align-items: center;
  }

  .justify-center {
    justify-content: center;
  }

  .justify-between {
    justify-content: space-between;
  }

  .gap-xs {
    gap: var(--space-xs);
  }
  .gap-sm {
    gap: var(--space-sm);
  }
  .gap-md {
    gap: var(--space-md);
  }
  .gap-lg {
    gap: var(--space-lg);
  }

  .w-full {
    width: 100%;
  }

  .h-full {
    height: 100%;
  }
`;
