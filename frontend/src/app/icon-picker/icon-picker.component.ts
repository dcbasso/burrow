import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ICON_CATALOG } from './icons';
import { TranslatePipe } from '../core/translate.pipe';

/**
 * Seletor de ícone: mostra o ícone atual, um campo de busca e uma grade clicável
 * de ícones FontAwesome. Usado nos forms de serviço e de categoria.
 * Uso: <app-icon-picker [(value)]="form.icon"></app-icon-picker>
 */
@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, TranslatePipe],
  template: `
    <div class="picker">
      <div class="preview">
        <i [class]="value || 'fas fa-question'"></i>
        <span class="cls">{{ value || ('iconPicker.none' | t) }}</span>
      </div>
      <mat-form-field appearance="outline" class="search">
        <mat-label>{{ 'iconPicker.search' | t }}</mat-label>
        <input matInput [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="ex: server, docker, chart" />
      </mat-form-field>
      <div class="grid">
        @for (icon of filtered(); track icon) {
          <button type="button" class="cell" [class.active]="icon === value"
                  [title]="icon" (click)="pick(icon)">
            <i [class]="icon"></i>
          </button>
        }
        @if (filtered().length === 0) {
          <span class="empty">{{ 'iconPicker.empty' | t }}</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .picker { display: flex; flex-direction: column; gap: 8px; }
    .preview { display: flex; align-items: center; gap: 12px; min-height: 28px; }
    .preview i { font-size: 24px; width: 28px; text-align: center; }
    .preview .cls { font-family: monospace; font-size: 12px; opacity: .7; }
    .search { width: 100%; }
    .grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
      gap: 6px; max-height: 200px; overflow-y: auto; padding: 4px;
      border: 1px solid rgba(0,0,0,.12); border-radius: 8px;
    }
    .cell {
      display: flex; align-items: center; justify-content: center;
      height: 44px; border: 1px solid transparent; border-radius: 8px;
      background: transparent; cursor: pointer; font-size: 18px; color: inherit;
    }
    .cell:hover { background: rgba(0,0,0,.06); }
    .cell.active { border-color: #1976d2; background: rgba(25,118,210,.12); }
    .empty { grid-column: 1 / -1; padding: 12px; opacity: .6; font-size: 13px; }
  `],
})
export class IconPickerComponent {
  @Input() value: string | undefined = '';
  @Output() valueChange = new EventEmitter<string>();

  readonly query = signal('');
  private readonly catalog = ICON_CATALOG;

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.catalog;
    return this.catalog.filter((i) => i.toLowerCase().includes(q));
  });

  pick(icon: string): void {
    this.value = icon;
    this.valueChange.emit(icon);
  }
}
