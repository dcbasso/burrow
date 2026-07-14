import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'dark' | 'light';
export type Accent = 'purple' | 'orange' | 'teal' | 'blue';
export type ViewMode = 'grid' | 'list';

const K = {
  theme: 'homelab.theme',
  accent: 'homelab.accent',
  view: 'homelab.view',
  showTags: 'homelab.showTags',
  showIp: 'homelab.showIp',
  coloredIcons: 'homelab.coloredIcons',
  sidebarOpen: 'homelab.sidebarOpen',
};

/**
 * Preferências de UI do dashboard (Nocturne): tema, cor de destaque, modo de
 * visualização e exibição de tags nos cards. Tudo persistido em localStorage.
 * O tema/accent são aplicados no shell via [data-theme]/[data-accent-color].
 */
@Injectable({ providedIn: 'root' })
export class PrefsService {
  readonly theme = signal<Theme>(this.readTheme());
  readonly accent = signal<Accent>(this.readEnum(K.accent, ['purple', 'orange', 'teal', 'blue'], 'purple'));
  readonly view = signal<ViewMode>(this.readEnum(K.view, ['grid', 'list'], 'grid'));
  readonly showTags = signal<boolean>(localStorage.getItem(K.showTags) !== '0');
  // Endereço (host[:porta]) numa faixa própria abaixo das tags. Ligado por padrão.
  readonly showIp = signal<boolean>(localStorage.getItem(K.showIp) !== '0');
  // Ícones coloridos usam a `color` de cada serviço/categoria; desligado (padrão)
  // usa o tile monocromático accent.
  readonly coloredIcons = signal<boolean>(localStorage.getItem(K.coloredIcons) === '1');
  // Menu lateral esquerdo aberto/recolhido (padrão aberto).
  readonly sidebarOpen = signal<boolean>(localStorage.getItem(K.sidebarOpen) !== '0');

  constructor() {
    effect(() => localStorage.setItem(K.theme, this.theme()));
    effect(() => localStorage.setItem(K.accent, this.accent()));
    effect(() => localStorage.setItem(K.view, this.view()));
    effect(() => localStorage.setItem(K.showTags, this.showTags() ? '1' : '0'));
    effect(() => localStorage.setItem(K.showIp, this.showIp() ? '1' : '0'));
    effect(() => localStorage.setItem(K.coloredIcons, this.coloredIcons() ? '1' : '0'));
    effect(() => localStorage.setItem(K.sidebarOpen, this.sidebarOpen() ? '1' : '0'));
  }

  setTheme(t: Theme): void { this.theme.set(t); }
  toggleTheme(): void { this.theme.update((t) => (t === 'dark' ? 'light' : 'dark')); }
  setAccent(a: Accent): void { this.accent.set(a); }
  setView(v: ViewMode): void { this.view.set(v); }
  setShowTags(v: boolean): void { this.showTags.set(v); }
  setShowIp(v: boolean): void { this.showIp.set(v); }
  setColoredIcons(v: boolean): void { this.coloredIcons.set(v); }
  toggleSidebar(): void { this.sidebarOpen.update((v) => !v); }

  private readTheme(): Theme {
    const saved = localStorage.getItem(K.theme);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  private readEnum<T extends string>(key: string, allowed: T[], fallback: T): T {
    const saved = localStorage.getItem(key) as T | null;
    return saved && allowed.includes(saved) ? saved : fallback;
  }
}
