import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { DashboardStore } from '../core/dashboard.store';
import { PrefsService } from '../core/prefs.service';
import { SettingsUiService } from '../core/settings-ui.service';
import { UiIconComponent } from '../shared/ui-icon.component';

/**
 * Diálogo de Configurações completo (Fase 2): abas Aparência, Tags, Grupos e
 * Idioma. Tags e grupos são gerenciados contra a API real (renomear/excluir
 * tag em todos os serviços; renomear/excluir/adicionar categorias).
 */
@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [FormsModule, UiIconComponent],
  template: `
    @if (ui.open()) {
      <div class="dialog-backdrop" (click)="ui.close()">
        <div class="dialog settings" (click)="$event.stopPropagation()">
          <div class="nav">
            <div class="tab" [class.active]="ui.tab() === 'aparencia'" (click)="ui.tab.set('aparencia')">Aparência</div>
            <div class="tab" [class.active]="ui.tab() === 'tags'" (click)="ui.tab.set('tags')">Tags</div>
            <div class="tab" [class.active]="ui.tab() === 'grupos'" (click)="ui.tab.set('grupos')">Grupos</div>
            <div class="tab" [class.active]="ui.tab() === 'idioma'" (click)="ui.tab.set('idioma')">Idioma</div>
          </div>

          <div class="content">
            <div class="head">
              <h3 style="margin:0">Configurações</h3>
              <button type="button" class="btn btn-icon btn-ghost" (click)="ui.close()" aria-label="Fechar">
                <app-ui-icon name="close" [size]="14" />
              </button>
            </div>

            <!-- APARÊNCIA -->
            @if (ui.tab() === 'aparencia') {
              <div>
                <div class="section-title">Tema</div>
                <div class="seg" style="width:100%">
                  <label class="seg-opt" style="flex:1; justify-content:center">
                    <input type="radio" name="th" [checked]="prefs.theme() === 'dark'" (change)="prefs.setTheme('dark')" />Escuro
                  </label>
                  <label class="seg-opt" style="flex:1; justify-content:center">
                    <input type="radio" name="th" [checked]="prefs.theme() === 'light'" (change)="prefs.setTheme('light')" />Claro
                  </label>
                </div>
              </div>
              <div>
                <div class="section-title">Cor de destaque</div>
                <div class="swatch-row">
                  <div class="swatch purple" [class.selected]="prefs.accent() === 'purple'" (click)="prefs.setAccent('purple')" title="Roxo"></div>
                  <div class="swatch orange" [class.selected]="prefs.accent() === 'orange'" (click)="prefs.setAccent('orange')" title="Laranja"></div>
                  <div class="swatch teal" [class.selected]="prefs.accent() === 'teal'" (click)="prefs.setAccent('teal')" title="Verde-azulado"></div>
                  <div class="swatch blue" [class.selected]="prefs.accent() === 'blue'" (click)="prefs.setAccent('blue')" title="Azul"></div>
                </div>
              </div>
              <div>
                <div class="section-title">Tags nos cards</div>
                <div class="seg" style="width:100%">
                  <label class="seg-opt" style="flex:1; justify-content:center">
                    <input type="radio" name="st" [checked]="prefs.showTags()" (change)="prefs.setShowTags(true)" />Mostrar
                  </label>
                  <label class="seg-opt" style="flex:1; justify-content:center">
                    <input type="radio" name="st" [checked]="!prefs.showTags()" (change)="prefs.setShowTags(false)" />Ocultar
                  </label>
                </div>
              </div>
              <div>
                <div class="section-title">Endereço nos cards</div>
                <div class="seg" style="width:100%">
                  <label class="seg-opt" style="flex:1; justify-content:center">
                    <input type="radio" name="sip" [checked]="prefs.showIp()" (change)="prefs.setShowIp(true)" />Mostrar
                  </label>
                  <label class="seg-opt" style="flex:1; justify-content:center">
                    <input type="radio" name="sip" [checked]="!prefs.showIp()" (change)="prefs.setShowIp(false)" />Ocultar
                  </label>
                </div>
              </div>
              <div>
                <div class="section-title">Ícones coloridos</div>
                <div class="seg" style="width:100%">
                  <label class="seg-opt" style="flex:1; justify-content:center">
                    <input type="radio" name="ci" [checked]="prefs.coloredIcons()" (change)="prefs.setColoredIcons(true)" />Coloridos
                  </label>
                  <label class="seg-opt" style="flex:1; justify-content:center">
                    <input type="radio" name="ci" [checked]="!prefs.coloredIcons()" (change)="prefs.setColoredIcons(false)" />Monocromático
                  </label>
                </div>
              </div>
            }

            <!-- TAGS -->
            @if (ui.tab() === 'tags') {
              <div class="section-title">Tags em uso</div>
              @for (t of store.tagUsage(); track t.name) {
                <div class="manage-row">
                  <input class="input" [ngModel]="tagDraft(t.name)" (ngModelChange)="setTagDraft(t.name, $event)" />
                  <span class="count">{{ t.count }}×</span>
                  @if (tagDirty(t.name)) {
                    <button type="button" class="btn btn-secondary" (click)="saveTag(t.name)">Salvar</button>
                  }
                  @if (tagConfirm() === t.name) {
                    <button type="button" class="btn btn-primary" (click)="confirmRemoveTag(t.name)">Confirmar</button>
                    <button type="button" class="btn btn-secondary" (click)="tagConfirm.set(null)">Cancelar</button>
                  } @else {
                    <button type="button" class="btn btn-icon btn-ghost" (click)="tagConfirm.set(t.name)" aria-label="Remover">
                      <app-ui-icon name="close" [size]="14" />
                    </button>
                  }
                </div>
              }
              @if (store.tagUsage().length === 0) {
                <div class="empty">Nenhuma tag em uso.</div>
              }
            }

            <!-- GRUPOS -->
            @if (ui.tab() === 'grupos') {
              <div class="section-title">Grupos</div>
              @for (g of store.grouped(); track g.section._id) {
                <div class="manage-row">
                  <input class="input" [ngModel]="groupDraft(g.section._id, g.section.name)" (ngModelChange)="setGroupDraft(g.section._id, $event)" />
                  <span class="count">{{ g.items.length }} itens</span>
                  @if (groupDirty(g.section._id, g.section.name)) {
                    <button type="button" class="btn btn-secondary" (click)="saveGroup(g.section._id, g.section.icon, g.section.color)">Salvar</button>
                  }
                  @if (groupConfirm() === g.section._id) {
                    <button type="button" class="btn btn-primary" [disabled]="g.items.length > 0"
                            [title]="g.items.length > 0 ? 'Mova os serviços antes' : ''" (click)="confirmRemoveGroup(g.section._id)">Confirmar</button>
                    <button type="button" class="btn btn-secondary" (click)="groupConfirm.set(null)">Cancelar</button>
                  } @else {
                    <button type="button" class="btn btn-icon btn-ghost" (click)="groupConfirm.set(g.section._id)" aria-label="Remover">
                      <app-ui-icon name="close" [size]="14" />
                    </button>
                  }
                </div>
              }
              <div class="add-row">
                <input class="input" placeholder="Nome do novo grupo" [(ngModel)]="newGroupName" />
                <button type="button" class="btn btn-primary" [disabled]="!newGroupName.trim()" (click)="addGroup()">Adicionar</button>
              </div>
              @if (error()) { <div class="err">{{ error() }}</div> }
            }

            <!-- IDIOMA -->
            @if (ui.tab() === 'idioma') {
              <div class="section-title">Selecionar idioma</div>
              <div class="lang-row">
                <label class="radio"><input type="radio" name="lang" checked /><span class="dot"></span>Português (Brasil)</label>
              </div>
              <div class="lang-row">
                <label class="radio" style="opacity:.5"><input type="radio" name="lang" disabled /><span class="dot"></span>English</label>
                <span class="tag tag-neutral soon">em breve</span>
              </div>
              <div class="lang-row">
                <label class="radio" style="opacity:.5"><input type="radio" name="lang" disabled /><span class="dot"></span>Español</label>
                <span class="tag tag-neutral soon">em breve</span>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .settings { width: min(680px, 92vw); max-height: 80vh; padding: 0; overflow: hidden; flex-direction: row; }
    .nav { width: 176px; flex: none; border-right: 1px solid var(--color-divider); padding: var(--space-4) var(--space-3);
      display: flex; flex-direction: column; gap: 2px; }
    .tab { display: flex; align-items: center; padding: 8px 10px; border-radius: var(--radius-md); font-size: 13.5px;
      cursor: pointer; color: color-mix(in srgb, var(--color-text) 72%, transparent); }
    .tab:hover { background: color-mix(in srgb, var(--color-text) 6%, transparent); }
    .tab.active { background: color-mix(in srgb, var(--color-accent) 14%, transparent); color: var(--color-accent-300); }
    .content { flex: 1; min-width: 0; padding: var(--space-6); overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-4); }
    .head { display: flex; align-items: center; justify-content: space-between; }
    .section-title { font-size: 10.5px; text-transform: uppercase; letter-spacing: .08em;
      color: color-mix(in srgb, var(--color-text) 55%, transparent); }
    .swatch-row { display: flex; gap: 8px; }
    .swatch { width: 30px; height: 30px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
    .swatch.purple { background: oklch(66% 0.125 289.2); }
    .swatch.orange { background: oklch(66% 0.14 55); }
    .swatch.teal { background: oklch(62% 0.1 175); }
    .swatch.blue { background: oklch(72% 0.14 210); }
    .swatch.selected { border-color: var(--color-text); }
    .manage-row { display: flex; align-items: center; gap: 8px; }
    .manage-row .input { flex: 1; }
    .count { font-size: 11px; opacity: .55; min-width: 56px; text-align: right; flex: none; }
    .add-row { display: flex; gap: 8px; margin-top: var(--space-2); padding-top: var(--space-3); border-top: 1px solid var(--color-divider); }
    .empty { padding: var(--space-6) 0; text-align: center; font-size: 13px; color: color-mix(in srgb, var(--color-text) 45%, transparent); }
    .err { color: #ff6b6b; font-size: 12.5px; }
    .lang-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; }
    .lang-row + .lang-row { border-top: 1px solid var(--color-divider); }
    .soon { font-size: 10px; }
  `],
})
export class SettingsDialogComponent {
  private api = inject(ApiService);
  readonly store = inject(DashboardStore);
  readonly prefs = inject(PrefsService);
  readonly ui = inject(SettingsUiService);

  // Rascunhos de edição (por chave) e estados de confirmação de exclusão.
  private tagDrafts = signal<Record<string, string>>({});
  private groupDrafts = signal<Record<string, string>>({});
  readonly tagConfirm = signal<string | null>(null);
  readonly groupConfirm = signal<string | null>(null);
  newGroupName = '';
  readonly error = signal<string | null>(null);

  // --- tags ---
  tagDraft(name: string): string { return this.tagDrafts()[name] ?? name; }
  setTagDraft(name: string, val: string): void { this.tagDrafts.update((d) => ({ ...d, [name]: val })); }
  tagDirty(name: string): boolean {
    const d = this.tagDrafts()[name];
    return d !== undefined && d.trim() !== '' && d.trim() !== name;
  }
  saveTag(oldName: string): void {
    const to = (this.tagDrafts()[oldName] ?? '').trim();
    if (!to || to === oldName) return;
    this.api.renameTag(oldName, to).subscribe(() => {
      this.tagDrafts.update((d) => { const n = { ...d }; delete n[oldName]; return n; });
      this.store.reload();
    });
  }
  confirmRemoveTag(name: string): void {
    this.api.removeTag(name).subscribe(() => { this.tagConfirm.set(null); this.store.reload(); });
  }

  // --- grupos ---
  groupDraft(id: string, name: string): string { return this.groupDrafts()[id] ?? name; }
  setGroupDraft(id: string, val: string): void { this.groupDrafts.update((d) => ({ ...d, [id]: val })); }
  groupDirty(id: string, name: string): boolean {
    const d = this.groupDrafts()[id];
    return d !== undefined && d.trim() !== '' && d.trim() !== name;
  }
  saveGroup(id: string, icon: string, color: string): void {
    const name = (this.groupDrafts()[id] ?? '').trim();
    if (!name) return;
    this.api.updateSection(id, { name, icon, color }).subscribe(() => {
      this.groupDrafts.update((d) => { const n = { ...d }; delete n[id]; return n; });
      this.store.reload();
    });
  }
  confirmRemoveGroup(id: string): void {
    this.error.set(null);
    this.api.deleteSection(id).subscribe({
      next: () => { this.groupConfirm.set(null); this.store.reload(); },
      error: (e) => this.error.set(e?.error?.error ?? 'Erro ao excluir'),
    });
  }
  addGroup(): void {
    const name = this.newGroupName.trim();
    if (!name) return;
    this.error.set(null);
    const nextOrder = this.store.sections().length;
    this.api.createSection({ name, icon: 'fas fa-folder', color: '#9184d9', order: nextOrder }).subscribe({
      next: () => { this.newGroupName = ''; this.store.reload(); },
      error: (e) => this.error.set(e?.error?.error ?? 'Erro ao criar grupo'),
    });
  }
}
