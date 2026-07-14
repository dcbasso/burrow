import { Component, Input, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Ícones de interface (linha, ~1.6px, estilo Phosphor) usados pelo shell
 * Nocturne — brand, busca, toggles, chevrons etc. Diferente do FontAwesome
 * dos cards (que continua vindo do icon picker). Uso: <app-ui-icon name="search" />
 */
const PATHS: Record<string, string> = {
  brand:
    '<rect x="3" y="3" width="14" height="5" rx="1"/><rect x="3" y="12" width="14" height="5" rx="1"/><circle cx="6" cy="5.5" r="0.6" fill="currentColor" stroke="none"/><circle cx="6" cy="14.5" r="0.6" fill="currentColor" stroke="none"/>',
  search: '<circle cx="9" cy="9" r="6"/><line x1="17" y1="17" x2="13.2" y2="13.2"/>',
  grid: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/>',
  list: '<line x1="4" y1="5" x2="16" y2="5"/><line x1="4" y1="10" x2="16" y2="10"/><line x1="4" y1="15" x2="16" y2="15"/>',
  lock: '<rect x="5" y="9" width="10" height="7" rx="1.5"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/>',
  unlock: '<rect x="5" y="9" width="10" height="7" rx="1.5"/><path d="M7 9V6.5a3 3 0 0 1 5.7-1.3"/>',
  gear: '<circle cx="10" cy="10" r="2.6"/><path d="M10 2.6v2M10 15.4v2M17.4 10h-2M4.6 10h-2M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4M15.1 15.1l-1.4-1.4M6.3 6.3 4.9 4.9"/>',
  close: '<line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/>',
  external: '<path d="M8 4H4v12h12v-4"/><path d="M12 4h4v4"/><line x1="16" y1="4" x2="9" y2="11"/>',
  info: '<circle cx="10" cy="10" r="7.2"/><line x1="10" y1="9" x2="10" y2="14"/><circle cx="10" cy="6.4" r="0.9" fill="currentColor" stroke="none"/>',
  grip: '<circle cx="7" cy="5" r="1.3" fill="currentColor" stroke="none"/><circle cx="13" cy="5" r="1.3" fill="currentColor" stroke="none"/><circle cx="7" cy="10" r="1.3" fill="currentColor" stroke="none"/><circle cx="13" cy="10" r="1.3" fill="currentColor" stroke="none"/><circle cx="7" cy="15" r="1.3" fill="currentColor" stroke="none"/><circle cx="13" cy="15" r="1.3" fill="currentColor" stroke="none"/>',
  up: '<line x1="10" y1="16" x2="10" y2="5"/><polyline points="6,9 10,5 14,9"/>',
  down: '<line x1="10" y1="4" x2="10" y2="15"/><polyline points="6,11 10,15 14,11"/>',
  plus: '<line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/>',
  edit: '<path d="M13 3.5l3.5 3.5"/><path d="M4 16l1-3.5L14 3.5 16.5 6 7.5 15 4 16Z"/>',
  trash: '<line x1="4" y1="5.5" x2="16" y2="5.5"/><path d="M6.5 5.5V4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1.5"/><path d="M5.5 5.5 6 16a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l.5-10.5"/>',
  folder: '<path d="M3 5.5A1.5 1.5 0 0 1 4.5 4H8l2 2h5.5A1.5 1.5 0 0 1 17 7.5v7A1.5 1.5 0 0 1 15.5 16h-11A1.5 1.5 0 0 1 3 14.5Z"/>',
  logout: '<path d="M8 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"/><polyline points="12,13 16,10 12,7"/><line x1="16" y1="10" x2="8" y2="10"/>',
  sidebar: '<rect x="3" y="3" width="14" height="14" rx="2"/><line x1="8" y1="3" x2="8" y2="17"/>',
  copy: '<rect x="7" y="7" width="9" height="9" rx="1.5"/><path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v6A1.5 1.5 0 0 0 5.5 13H7"/>',
  power: '<path d="M6.6 5.9a6 6 0 1 0 6.8 0"/><line x1="10" y1="3" x2="10" y2="9.5"/>',
  home: '<path d="M3.5 9 10 3.5 16.5 9"/><path d="M5 8.4V15a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8.4"/>',
  globe: '<circle cx="10" cy="10" r="7"/><ellipse cx="10" cy="10" rx="3" ry="7"/><line x1="3" y1="10" x2="17" y2="10"/>',
  mail: '<rect x="3" y="5" width="14" height="10" rx="1.5"/><path d="M3.5 6 10 11l6.5-5"/>',
  github: '<path d="M7.5 16.5c-3 1-3-1.5-4-2m8 4v-2.6a2.3 2.3 0 0 0-.6-1.7c2-.2 4.1-1 4.1-4.4a3.4 3.4 0 0 0-.9-2.4 3.2 3.2 0 0 0-.1-2.4s-.8-.2-2.6 1a8.7 8.7 0 0 0-4.6 0C4.6 4.3 3.8 4.5 3.8 4.5a3.2 3.2 0 0 0-.1 2.4 3.4 3.4 0 0 0-.9 2.4c0 3.4 2.1 4.2 4.1 4.4a2.3 2.3 0 0 0-.6 1.6v2.7"/>',
  linkedin: '<rect x="3" y="3" width="14" height="14" rx="2"/><line x1="6.2" y1="8.5" x2="6.2" y2="14"/><circle cx="6.2" cy="6" r="0.9" fill="currentColor" stroke="none"/><path d="M9.4 14v-3a1.9 1.9 0 0 1 3.8 0v3M9.4 14V8.5"/>',
};

@Component({
  selector: 'app-ui-icon',
  standalone: true,
  template: `<span class="ui-icon" [style.width.px]="size" [style.height.px]="size" [innerHTML]="svg"></span>`,
  styles: [`
    .ui-icon { display: inline-flex; }
    :host { display: inline-flex; }
    ::ng-deep svg { display: block; }
  `],
})
export class UiIconComponent {
  private sanitizer = inject(DomSanitizer);
  @Input() size = 16;
  private _name = '';
  svg: SafeHtml = '';

  @Input() set name(v: string) {
    this._name = v;
    const body = PATHS[v] ?? '';
    const svg = `<svg width="${this.size}" height="${this.size}" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
    this.svg = this.sanitizer.bypassSecurityTrustHtml(svg);
  }
  get name(): string { return this._name; }
}
