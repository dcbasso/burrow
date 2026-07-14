import { Injectable, signal } from '@angular/core';

/** Controla a visibilidade do diálogo "Sobre" (autoria, versão e licença). */
@Injectable({ providedIn: 'root' })
export class AboutUiService {
  readonly open = signal(false);

  show(): void {
    this.open.set(true);
  }
  close(): void {
    this.open.set(false);
  }
}
