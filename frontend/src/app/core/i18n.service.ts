import { Injectable, effect, signal } from '@angular/core';
import { TRANSLATIONS } from './i18n/translations';

export type Locale = 'pt' | 'en' | 'es';

/** Idiomas suportados, na ordem exibida no seletor. */
export const LOCALES: Locale[] = ['pt', 'en', 'es'];

const STORAGE_KEY = 'homelab.lang';

/**
 * i18n em runtime, no mesmo padrão de signals do resto do app: o idioma é um
 * signal e `t()` lê esse signal, então qualquer binding de template que use o
 * pipe `| t` (ou chame `i18n.t()`) re-renderiza sozinho ao trocar de idioma —
 * sem rebuild, sem recarregar a página. Persistido em localStorage; o inicial
 * vem do navegador (pt/es reconhecidos, inglês como fallback).
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly locale = signal<Locale>(this.initialLocale());

  constructor() {
    effect(() => {
      const l = this.locale();
      localStorage.setItem(STORAGE_KEY, l);
      // Mantém o <html lang> coerente para acessibilidade/SEO.
      document.documentElement.lang = l === 'pt' ? 'pt-br' : l;
    });
  }

  setLocale(l: Locale): void {
    this.locale.set(l);
  }

  /**
   * Traduz `key` no idioma atual, interpolando `{param}` com `params`.
   * Sem tradução no idioma atual, cai para o inglês; sem nem isso, devolve a
   * própria chave (fica visível que faltou traduzir).
   */
  t(key: string, params?: Record<string, string | number>): string {
    let str = TRANSLATIONS[this.locale()][key] ?? TRANSLATIONS.en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  }

  private initialLocale(): Locale {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt' || saved === 'en' || saved === 'es') return saved;
    const nav = (navigator.language || 'en').toLowerCase();
    if (nav.startsWith('pt')) return 'pt';
    if (nav.startsWith('es')) return 'es';
    return 'en';
  }
}
