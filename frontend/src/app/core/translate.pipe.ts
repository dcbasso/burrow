import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

/**
 * Pipe de tradução: `{{ 'chave' | t }}` ou `{{ 'chave' | t:{ name: x } }}`.
 * Impuro de propósito — a chave não muda, quem muda é o idioma (signal interno),
 * então precisa reavaliar a cada ciclo de detecção para refletir a troca.
 */
@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}
