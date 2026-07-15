import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../core/api.service';
import { DashboardStore, DrawerState } from '../core/dashboard.store';
import { EditModeService } from '../core/edit-mode.service';
import { Section, Service, ServicePort } from '../core/models';
import { UiIconComponent } from '../shared/ui-icon.component';
import { IconPickerComponent } from '../icon-picker/icon-picker.component';
import { I18nService } from '../core/i18n.service';
import { TranslatePipe } from '../core/translate.pipe';

/**
 * Painel lateral direito do serviço, com DOIS modos:
 *  - leitura: mostra os detalhes (URLs, notas, tags) + botão "Abrir serviço".
 *    Se a edição estiver desbloqueada, um botão "Editar" alterna p/ o modo edição.
 *  - edição: formulário completo (mesmos campos do antigo dialog) que salva via
 *    PUT /api/services/:id. Substitui o dialog Material na edição de serviços.
 * Categorias continuam sendo editadas pelo dialog (SectionForm).
 */
@Component({
  selector: 'app-service-drawer',
  standalone: true,
  imports: [UiIconComponent, FormsModule, IconPickerComponent, TranslatePipe],
  template: `
    <div class="backdrop" [class.open]="!!store.drawer()" (click)="store.closeDrawer()"></div>
    <div class="drawer" [class.open]="!!store.drawer()">
      @if (store.drawer(); as d) {
        @if (d.kind === 'service-view') {
          <!-- ── LEITURA ── -->
          @let svc = d.svc;
          <div class="scroll">
            <div class="head">
              <div>
                <div class="card-kicker">{{ 'drawer.serviceDetails' | t }}</div>
                <h3 style="margin:2px 0 0">{{ svc.name }}</h3>
              </div>
              <button type="button" class="btn btn-icon btn-ghost" (click)="store.closeDrawer()" [attr.aria-label]="'common.close' | t">
                <app-ui-icon name="close" [size]="14" />
              </button>
            </div>

            @if ((svc.tags || []).length) {
              <div class="tagrow">
                @for (t of svc.tags; track t) { <span class="tag tag-accent">{{ t }}</span> }
              </div>
            }
            <hr class="hr" style="margin: var(--space-1) 0" />

            @if (svc.publicUrl) {
              <div class="row">
                <span class="label">{{ 'drawer.publicUrlLabel' | t }}</span>
                <div class="urlrow">
                  <span class="val">{{ svc.publicUrl }}</span>
                  <button type="button" class="btn btn-icon btn-ghost" (click)="copy(svc.publicUrl!)"
                          [title]="'drawer.copyPublicUrl' | t" [attr.aria-label]="'drawer.copyPublicUrl' | t">
                    <app-ui-icon name="copy" [size]="14" />
                  </button>
                  <a class="btn btn-icon btn-ghost" [href]="svc.publicUrl" target="_blank" rel="noopener"
                     [title]="'drawer.openNewTab' | t" [attr.aria-label]="'drawer.openPublicUrlAria' | t">
                    <app-ui-icon name="external" [size]="14" />
                  </a>
                </div>
              </div>
            }
            @if (svc.localUrl) {
              <div class="row">
                <span class="label">{{ 'drawer.localUrlLabel' | t }}</span>
                <div class="urlrow">
                  <span class="val">{{ svc.localUrl }}</span>
                  <button type="button" class="btn btn-icon btn-ghost" (click)="copy(svc.localUrl)"
                          [title]="'drawer.copyLocalUrl' | t" [attr.aria-label]="'drawer.copyLocalUrl' | t">
                    <app-ui-icon name="copy" [size]="14" />
                  </button>
                  <a class="btn btn-icon btn-ghost" [href]="svc.localUrl" target="_blank" rel="noopener"
                     [title]="'drawer.openNewTab' | t" [attr.aria-label]="'drawer.openLocalUrlAria' | t">
                    <app-ui-icon name="external" [size]="14" />
                  </a>
                </div>
              </div>
            }
            @if ((svc.ports || []).length) {
              <div class="row">
                <span class="label">{{ 'drawer.ports' | t }}</span>
                <div class="ports">
                  @for (p of svc.ports; track p.number) {
                    <span class="port"><b>{{ p.number }}</b> {{ p.name }}</span>
                  }
                </div>
              </div>
            }
            @if (svc.note) {
              <div class="row"><span class="label">{{ 'drawer.notes' | t }}</span><span class="note">{{ svc.note }}</span></div>
            }
            @if (!svc.publicUrl && !svc.localUrl && !svc.note && !(svc.ports || []).length) {
              <p class="text-muted" style="font-size:13.5px">{{ 'drawer.noDetails' | t }}</p>
            }
          </div>
          <!-- Abrir: interno e externo são destinos diferentes, então viram botões
               diferentes. Quem só tem um dos dois continua com um botão só. -->
          <div class="foot">
            @if (edit.enabled()) {
              <button type="button" class="btn btn-secondary" (click)="startEdit(svc)">
                <app-ui-icon name="edit" [size]="14" /> {{ 'common.edit' | t }}
              </button>
            }
            <div class="opens">
              @if (svc.localUrl) {
                <a class="btn btn-primary" [href]="svc.localUrl" target="_blank" rel="noopener">
                  <app-ui-icon name="home" [size]="14" /> {{ 'drawer.openInternal' | t }}
                </a>
              }
              @if (svc.publicUrl) {
                <a class="btn" [class.btn-primary]="!svc.localUrl" [class.btn-secondary]="!!svc.localUrl"
                   [href]="svc.publicUrl" target="_blank" rel="noopener">
                  <app-ui-icon name="globe" [size]="14" /> {{ 'drawer.openExternal' | t }}
                </a>
              }
              @if (!svc.localUrl && !svc.publicUrl) {
                <span class="text-muted" style="font-size:13px">{{ 'drawer.noUrl' | t }}</span>
              }
            </div>
          </div>
        } @else if (d.kind === 'service-form') {
          <!-- ── SERVIÇO: NOVO / EDIÇÃO ── -->
          <div class="scroll">
            <div class="head">
              <div>
                <div class="card-kicker">{{ (d.svc ? 'drawer.editServiceTitle' : 'drawer.newServiceTitle') | t }}</div>
                <h3 style="margin:2px 0 0">{{ model.name || ('drawer.noName' | t) }}</h3>
              </div>
              <button type="button" class="btn btn-icon btn-ghost" (click)="store.closeDrawer()" [attr.aria-label]="'common.close' | t">
                <app-ui-icon name="close" [size]="14" />
              </button>
            </div>

            <div class="field">
              <label class="lbl">{{ 'form.name' | t }}</label>
              <input class="input" [(ngModel)]="model.name" name="name" />
            </div>

            <div class="field">
              <label class="lbl">{{ 'form.category' | t }}</label>
              <select class="input" [(ngModel)]="model.sectionId" name="sectionId">
                @for (s of store.sections(); track s._id) {
                  <option [value]="s._id">{{ s.name }}</option>
                }
              </select>
            </div>

            <div class="field">
              <label class="lbl">{{ 'form.cardIcon' | t }}</label>
              <app-icon-picker [(value)]="model.icon"></app-icon-picker>
            </div>

            <div class="inline">
              <div class="field">
                <label class="lbl">{{ 'form.color' | t }}</label>
                <input type="color" [(ngModel)]="model.color" name="color" class="color" />
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="model.enabled" name="enabled" /> {{ 'form.active' | t }}
              </label>
            </div>

            <div class="field">
              <label class="lbl">{{ 'form.publicUrl' | t }}</label>
              <input class="input" [(ngModel)]="model.publicUrl" name="publicUrl" placeholder="https://..." />
            </div>

            <div class="field">
              <label class="lbl">{{ 'form.localUrl' | t }}</label>
              <input class="input" [(ngModel)]="model.localUrl" name="localUrl" placeholder="http://192.168..." />
            </div>

            <div class="field">
              <label class="lbl">{{ 'form.tags' | t }}</label>
              <input class="input" [(ngModel)]="tagsText" name="tags" placeholder="vm docker core" />
            </div>

            <div class="field">
              <label class="lbl">{{ 'form.portsLabel' | t }}</label>
              @for (p of portRows; track $index) {
                <div class="portrow">
                  <input class="input" [(ngModel)]="p.name" [name]="'portName' + $index" placeholder="WebUI" />
                  <input class="input num" type="number" [(ngModel)]="p.number" [name]="'portNum' + $index"
                         placeholder="8080" min="1" max="65535" />
                  <button type="button" class="btn btn-icon btn-ghost" (click)="removePort($index)"
                          [attr.aria-label]="'form.removePort' | t">
                    <app-ui-icon name="close" [size]="12" />
                  </button>
                </div>
              }
              <button type="button" class="btn btn-secondary btn-sm" (click)="addPort()">{{ 'form.addPort' | t }}</button>
            </div>

            <div class="field">
              <label class="lbl">{{ 'form.note' | t }}</label>
              <textarea class="input" [(ngModel)]="model.note" name="note" rows="2"></textarea>
            </div>
          </div>
          <div class="foot">
            <button type="button" class="btn btn-ghost" (click)="cancel(d)">{{ 'common.cancel' | t }}</button>
            <button type="button" class="btn btn-primary btn-block"
                    [disabled]="!model.name || !model.sectionId || !model.icon || saving()"
                    (click)="saveService(d.svc)">{{ (saving() ? 'common.saving' : 'common.save') | t }}</button>
          </div>
        } @else if (d.kind === 'section-form') {
          <!-- ── CATEGORIA: NOVA / EDIÇÃO ── -->
          <div class="scroll">
            <div class="head">
              <div>
                <div class="card-kicker">{{ (d.sec ? 'drawer.editSectionTitle' : 'drawer.newSectionTitle') | t }}</div>
                <h3 style="margin:2px 0 0">{{ sectionModel.name || ('drawer.noName' | t) }}</h3>
              </div>
              <button type="button" class="btn btn-icon btn-ghost" (click)="store.closeDrawer()" [attr.aria-label]="'common.close' | t">
                <app-ui-icon name="close" [size]="14" />
              </button>
            </div>

            <div class="field">
              <label class="lbl">{{ 'form.name' | t }}</label>
              <input class="input" [(ngModel)]="sectionModel.name" name="secName" />
            </div>

            <div class="field">
              <label class="lbl">{{ 'form.icon' | t }}</label>
              <app-icon-picker [(value)]="sectionModel.icon"></app-icon-picker>
            </div>

            <div class="inline">
              <div class="field">
                <label class="lbl">{{ 'form.color' | t }}</label>
                <input type="color" [(ngModel)]="sectionModel.color" name="secColor" class="color" />
              </div>
              <div class="field">
                <label class="lbl">{{ 'form.order' | t }}</label>
                <input class="input num" type="number" [(ngModel)]="sectionModel.order" name="secOrder" />
              </div>
            </div>
          </div>
          <div class="foot">
            <button type="button" class="btn btn-ghost" (click)="store.closeDrawer()">{{ 'common.cancel' | t }}</button>
            <button type="button" class="btn btn-primary btn-block"
                    [disabled]="!sectionModel.name || !sectionModel.icon || saving()"
                    (click)="saveSection(d.sec)">{{ (saving() ? 'common.saving' : 'common.save') | t }}</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .backdrop { position: fixed; inset: 0; background: color-mix(in srgb, var(--color-neutral-900) 55%, transparent);
      opacity: 0; pointer-events: none; transition: opacity .2s ease; z-index: 30; }
    .backdrop.open { opacity: 1; pointer-events: auto; }
    .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 400px; max-width: 100vw;
      background: var(--color-surface); box-shadow: var(--shadow-lg); transform: translateX(100%);
      transition: transform .25s ease; z-index: 31; display: flex; flex-direction: column; }
    .drawer.open { transform: translateX(0); }
    .scroll { flex: 1; min-height: 0; overflow-y: auto; padding: var(--space-6);
      display: flex; flex-direction: column; gap: var(--space-4); }
    .foot { flex: none; padding: var(--space-4) var(--space-6); border-top: 1px solid var(--color-divider);
      display: flex; align-items: center; gap: var(--space-3); }
    .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .tagrow { display: flex; gap: 6px; flex-wrap: wrap; }
    .row { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 10.5px; text-transform: uppercase; letter-spacing: .08em;
      color: color-mix(in srgb, var(--color-text) 55%, transparent); }
    .val { font-size: 14px; font-family: ui-monospace, Menlo, monospace; word-break: break-all; }
    /* URL + botão de copiar: o botão não encolhe, a URL quebra. */
    .urlrow { display: flex; align-items: flex-start; gap: 6px; }
    .urlrow .val { flex: 1; min-width: 0; }
    .urlrow .btn-icon { flex: none; }
    /* Os dois destinos dividem a largura do rodapé. */
    .opens { flex: 1; display: flex; gap: var(--space-3); }
    .opens .btn { flex: 1; justify-content: center; }
    .note { font-size: 13.5px; opacity: .85; }
    /* Leitura: uma linha por porta, número em mono pra alinhar a coluna. */
    .ports { display: flex; flex-direction: column; gap: 3px; }
    .port { font-size: 13.5px; }
    .port b { font-family: ui-monospace, Menlo, monospace; margin-right: 8px; }
    /* Edição: nome ocupa o resto, número tem largura fixa, X à direita. */
    .portrow { display: flex; align-items: center; gap: 6px; }
    .portrow .num { width: 92px; flex: none; }
    .btn-sm { align-self: flex-start; padding: 5px 10px; font-size: 12.5px; }
    /* Campos do modo edição */
    .field { display: flex; flex-direction: column; gap: 6px; }
    .lbl { font-size: 11px; text-transform: uppercase; letter-spacing: .06em;
      color: color-mix(in srgb, var(--color-text) 60%, transparent); }
    .input { width: 100%; padding: 9px 11px; border-radius: var(--radius-md); font: inherit;
      color: var(--color-text); background: var(--color-bg);
      border: 1px solid var(--color-divider); }
    .input:focus { outline: none; border-color: var(--color-accent); }
    textarea.input { resize: vertical; }
    .inline { display: flex; align-items: center; gap: var(--space-6); }
    .color { width: 56px; height: 36px; border: none; background: none; cursor: pointer; padding: 0; }
    .toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; cursor: pointer; }
  `],
})
export class ServiceDrawerComponent {
  readonly store = inject(DashboardStore);
  readonly edit = inject(EditModeService);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private i18n = inject(I18nService);

  model: Partial<Service> = {};
  sectionModel: Partial<Section> = {};
  tagsText = '';
  // Linhas do editor de portas. `number` fica nullable porque a linha nasce vazia
  // (o input type=number entrega null enquanto o usuário não digita).
  portRows: { name: string; number: number | null }[] = [];
  readonly saving = signal(false);

  constructor() {
    // Sempre que o painel abre num formulário, semeia o modelo — com o item atual
    // (edição) ou com os padrões de um item novo (criação).
    effect(() => {
      const d = this.store.drawer();
      if (d?.kind === 'service-form') this.seedService(d.svc);
      if (d?.kind === 'section-form') this.seedSection(d.sec);
    });
  }

  private seedService(svc: Service | null): void {
    this.model = svc
      ? { ...svc }
      : {
          name: '', sectionId: this.store.sections()[0]?._id, icon: 'fas fa-cube',
          color: '#2496ed', tags: [], ports: [], publicUrl: null, localUrl: '', note: '',
          enabled: true, order: 0,
        };
    this.tagsText = (this.model.tags ?? []).join(' ');
    this.portRows = (this.model.ports ?? []).map((p) => ({ name: p.name, number: p.number }));
  }

  private seedSection(sec: Section | null): void {
    this.sectionModel = sec
      ? { ...sec }
      : { name: '', icon: 'fas fa-folder', color: '#e57000', order: this.store.sections().length };
  }

  addPort(): void {
    this.portRows.push({ name: '', number: null });
  }

  removePort(i: number): void {
    this.portRows.splice(i, 1);
  }

  /** Descarta linhas incompletas — meia porta não vale como metadado de busca. */
  private cleanPorts(): ServicePort[] {
    return this.portRows
      .map((p) => ({ name: p.name.trim(), number: Number(p.number) }))
      .filter((p) => p.name && Number.isInteger(p.number) && p.number >= 1 && p.number <= 65535);
  }

  startEdit(svc: Service): void {
    this.store.editService(svc);
  }

  /** Cancelar volta pra leitura quando havia um serviço; num item novo, fecha o painel. */
  cancel(d: DrawerState): void {
    if (d?.kind === 'service-form' && d.svc) this.store.viewService(d.svc);
    else this.store.closeDrawer();
  }

  /** `svc` nulo = criação (POST); com id = edição (PUT). */
  saveService(svc: Service | null): void {
    const tags = this.tagsText.split(/\s+/).map((t) => t.trim()).filter(Boolean);
    const publicUrl = this.model.publicUrl?.trim() ? this.model.publicUrl.trim() : null;
    const body = { ...this.model, tags, ports: this.cleanPorts(), publicUrl };
    const req = svc ? this.api.updateService(svc._id, body) : this.api.createService(body);
    this.saving.set(true);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open(this.i18n.t(svc ? 'drawer.serviceUpdated' : 'drawer.serviceCreated'));
        this.store.closeDrawer();
        this.store.reload();
      },
      error: () => {
        this.saving.set(false);
        this.snack.open(this.i18n.t('common.saveFailed'), 'ok', { duration: 4000 });
      },
    });
  }

  /** `sec` nulo = criação (POST); com id = edição (PUT). */
  saveSection(sec: Section | null): void {
    const body = { ...this.sectionModel };
    const req = sec ? this.api.updateSection(sec._id, body) : this.api.createSection(body);
    this.saving.set(true);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open(this.i18n.t(sec ? 'drawer.sectionUpdated' : 'drawer.sectionCreated'));
        this.store.closeDrawer();
        this.store.reload();
      },
      error: () => {
        this.saving.set(false);
        this.snack.open(this.i18n.t('common.saveFailed'), 'ok', { duration: 4000 });
      },
    });
  }

  /**
   * Copia pra área de transferência. `navigator.clipboard` só existe em contexto
   * seguro (https ou localhost) — acessando o painel por IP na LAN ele é undefined,
   * daí o fallback no textarea + execCommand.
   */
  async copy(text: string): Promise<void> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      this.snack.open(this.i18n.t('drawer.linkCopied'), undefined, { duration: 2000 });
    } catch {
      this.snack.open(this.i18n.t('drawer.copyFailed'), 'ok', { duration: 4000 });
    }
  }
}
