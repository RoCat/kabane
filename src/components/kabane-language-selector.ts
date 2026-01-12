/**
 * Language Selector Component
 *
 * Dropdown to switch between available locales.
 */

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { localized } from '@lit/localize';
import { getLocale, setAndPersistLocale } from '../localization';
import { themeStyles, resetStyles } from '../styles';

type Locale = 'en' | 'fr';

const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
};

const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
};

const allLocales: Locale[] = ['en', 'fr'];

@localized()
@customElement('kabane-language-selector')
export class KabaneLanguageSelector extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      :host {
        display: inline-block;
      }

      .language-selector {
        position: relative;
      }

      .language-btn {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        background: transparent;
        border: 1px solid var(--color-border-default);
        color: var(--color-text-secondary);
        padding: var(--space-xs) var(--space-sm);
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: var(--font-size-sm);
        transition: all 0.2s;
      }

      .language-btn:hover {
        background: var(--color-bg-tertiary);
        color: var(--color-text-primary);
      }

      .flag {
        font-size: 1.1em;
      }

      .dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: var(--space-xs);
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        min-width: 140px;
        z-index: 100;
        overflow: hidden;
      }

      .dropdown-item {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        width: 100%;
        padding: var(--space-sm) var(--space-md);
        background: transparent;
        border: none;
        color: var(--color-text-secondary);
        cursor: pointer;
        font-size: var(--font-size-sm);
        text-align: left;
        transition: background 0.2s;
      }

      .dropdown-item:hover {
        background: var(--color-bg-tertiary);
      }

      .dropdown-item.active {
        color: var(--color-accent-secondary);
        font-weight: 500;
      }

      .dropdown-item .check {
        width: 16px;
        text-align: center;
      }
    `,
  ];

  @state()
  private isOpen = false;

  private get currentLocale(): Locale {
    return getLocale() as Locale;
  }

  connectedCallback() {
    super.connectedCallback();
    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleOutsideClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleOutsideClick);
  }

  private handleOutsideClick = (e: MouseEvent) => {
    if (!this.contains(e.target as Node)) {
      this.isOpen = false;
    }
  };

  private toggleDropdown(e: Event) {
    e.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  private async selectLocale(locale: Locale) {
    if (locale !== this.currentLocale) {
      await setAndPersistLocale(locale);
    }
    this.isOpen = false;
  }

  render() {
    return html`
      <div class="language-selector">
        <button class="language-btn" @click=${this.toggleDropdown}>
          <span class="flag">${localeFlags[this.currentLocale]}</span>
          <span>${localeNames[this.currentLocale]}</span>
          <span>▾</span>
        </button>

        ${this.isOpen
          ? html`
              <div class="dropdown">
                ${allLocales.map(
                  locale => html`
                    <button
                      class="dropdown-item ${locale === this.currentLocale ? 'active' : ''}"
                      @click=${() => this.selectLocale(locale)}
                    >
                      <span class="flag">${localeFlags[locale]}</span>
                      <span>${localeNames[locale]}</span>
                      <span class="check">${locale === this.currentLocale ? '✓' : ''}</span>
                    </button>
                  `,
                )}
              </div>
            `
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'kabane-language-selector': KabaneLanguageSelector;
  }
}
