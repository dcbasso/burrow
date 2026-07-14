import { Injectable, signal } from '@angular/core';

export type SettingsTab = 'aparencia' | 'tags' | 'grupos' | 'idioma';

/** Controla a visibilidade e a aba ativa do diálogo de Configurações completo. */
@Injectable({ providedIn: 'root' })
export class SettingsUiService {
  readonly open = signal(false);
  readonly tab = signal<SettingsTab>('aparencia');

  openAt(tab: SettingsTab = 'aparencia'): void {
    this.tab.set(tab);
    this.open.set(true);
  }
  close(): void {
    this.open.set(false);
  }
}
