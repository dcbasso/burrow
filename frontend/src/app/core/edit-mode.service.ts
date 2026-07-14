import { Injectable, effect, signal } from '@angular/core';

const KEY = 'homelab.editMode';

/**
 * Modo de edição do dashboard. Quando `false` (bloqueado), os controles de
 * CRUD e reordenação ficam escondidos — o painel vira só leitura/atalhos.
 * Persiste em localStorage. Começa bloqueado por padrão.
 */
@Injectable({ providedIn: 'root' })
export class EditModeService {
  readonly enabled = signal<boolean>(localStorage.getItem(KEY) === '1');

  constructor() {
    effect(() => localStorage.setItem(KEY, this.enabled() ? '1' : '0'));
  }

  toggle(): void {
    this.enabled.update((v) => !v);
  }
}
