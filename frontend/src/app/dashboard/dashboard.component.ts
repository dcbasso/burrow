import { Component, OnInit, effect, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ApiService } from '../core/api.service';
import { DashboardStore, GroupVM } from '../core/dashboard.store';
import { EditModeService } from '../core/edit-mode.service';
import { PrefsService } from '../core/prefs.service';
import { Section, Service } from '../core/models';
import { UiIconComponent } from '../shared/ui-icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [UiIconComponent, DragDropModule],
  template: `
    @if (edit.enabled()) {
      <div class="actions">
        <button type="button" class="btn btn-primary" (click)="newService()">
          <app-ui-icon name="plus" [size]="14" /> Novo serviço
        </button>
        <button type="button" class="btn btn-secondary" (click)="newSection()">
          <app-ui-icon name="folder" [size]="14" /> Nova categoria
        </button>
      </div>
    }

    @if (store.loading()) {
      <p class="empty">Carregando…</p>
    } @else if (store.sections().length === 0) {
      <p class="empty">
        Nenhuma categoria ainda.
        @if (edit.enabled()) { Crie a primeira com "Nova categoria". }
        @else { Desbloqueie a edição (cadeado) para começar. }
      </p>
    }

    <!-- GRADE -->
    @if (prefs.view() === 'grid') {
      <div cdkDropList [cdkDropListDisabled]="!edit.enabled()" (cdkDropListDropped)="dropGroup($event)">
        @for (g of store.visibleGroups(); track g.section._id) {
          <div class="group-block" cdkDrag [cdkDragDisabled]="!edit.enabled()" [class.editing]="edit.enabled()">
            <div class="group-head">
              @if (edit.enabled()) {
                <span class="grip" cdkDragHandle title="Arrastar categoria"><app-ui-icon name="grip" [size]="15" /></span>
              }
              <span class="group-rule"></span>
              <div class="icon-tile" [class.colored]="prefs.coloredIcons()"
                   [style.background]="tileBg(g.section.color)" [style.color]="tileFg(g.section.color)">
                <i [class]="g.section.icon"></i>
              </div>
              <div class="group-name">{{ g.section.name }}</div>
              <span class="tag tag-neutral">{{ g.items.length }}</span>
              <span class="group-rule"></span>
              @if (edit.enabled()) {
                <button type="button" class="btn btn-icon btn-ghost" (click)="editSection(g.section)" title="Editar categoria">
                  <app-ui-icon name="edit" [size]="14" />
                </button>
                <button type="button" class="btn btn-icon btn-ghost" (click)="deleteSection(g.section)" title="Excluir categoria">
                  <app-ui-icon name="trash" [size]="14" />
                </button>
              }
            </div>

            <div class="grid" cdkDropList [cdkDropListDisabled]="!edit.enabled()"
                 (cdkDropListDropped)="dropCard(g, $event)">
              @for (svc of g.items; track svc._id; let i = $index, count = $count) {
                <div class="card om-card elev-sm" [class.off]="!svc.enabled" [class.editing]="edit.enabled()"
                     [class.with-ip]="prefs.showIp()" [style.--ci]="svc.color"
                     cdkDrag [cdkDragDisabled]="!edit.enabled()" (click)="store.viewService(svc)">
                  @if (edit.enabled()) {
                    <span class="card-grip" cdkDragHandle title="Arrastar serviço" (click)="$event.stopPropagation()">
                      <app-ui-icon name="grip" [size]="15" />
                    </span>
                  }
                  <div class="card-body">
                    <div class="card-icon" [class.colored]="prefs.coloredIcons()"
                         [style.color]="tileFg(svc.color)">
                      <i [class]="svc.icon"></i>
                    </div>
                    <div class="card-title" [title]="svc.name">{{ svc.name }}</div>
                    @if (prefs.showTags() && (svc.tags || []).length) {
                      <div class="tagrow">
                        @for (t of shownTags(svc); track t) { <span class="tag tag-accent">{{ t }}</span> }
                        @if (hiddenTags(svc); as rest) {
                          <span class="tag tag-neutral tag-more" [title]="rest">…</span>
                        }
                      </div>
                    }
                    @if (prefs.showIp() && cardAddress(svc); as addr) {
                      <span class="card-ip" [title]="addr">{{ addr }}</span>
                    }
                  </div>

                  @if (edit.enabled()) {
                    <div class="card-actions" (click)="$event.stopPropagation()">
                      <button type="button" class="btn btn-icon btn-ghost" (click)="move(g, i, -1)" [disabled]="i === 0" title="Mover pra cima">
                        <app-ui-icon name="up" [size]="14" />
                      </button>
                      <button type="button" class="btn btn-icon btn-ghost" (click)="move(g, i, 1)" [disabled]="i === count - 1" title="Mover pra baixo">
                        <app-ui-icon name="down" [size]="14" />
                      </button>
                      <button type="button" class="btn btn-icon btn-ghost" (click)="toggleEnabled(svc)"
                              [class.on]="svc.enabled" [title]="svc.enabled ? 'Desativar' : 'Ativar'">
                        <app-ui-icon name="power" [size]="14" />
                      </button>
                      <button type="button" class="btn btn-icon btn-ghost" (click)="editService(svc)" title="Editar">
                        <app-ui-icon name="edit" [size]="14" />
                      </button>
                      <button type="button" class="btn btn-icon btn-ghost" (click)="deleteService(svc)" title="Excluir">
                        <app-ui-icon name="trash" [size]="14" />
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
      @if (!store.loading() && store.visibleGroups().length === 0 && store.sections().length > 0) {
        <div class="empty">Nenhum serviço encontrado.</div>
      }
    }

    <!-- LISTA -->
    @if (prefs.view() === 'list') {
      <table class="table" style="margin-top: var(--space-4)">
        <thead><tr><th>Serviço</th><th>Grupo</th><th>Tags</th><th>Endereços</th><th>Portas</th><th></th></tr></thead>
        <tbody>
          @for (r of store.flat(); track r.svc._id) {
            <tr class="row-clickable" [class.off]="!r.svc.enabled" [style.--ci]="r.svc.color"
                (click)="store.viewService(r.svc)">
              <td>
                <span class="row-name">
                  <span class="row-icon" [style.color]="tileFg(r.svc.color)"><i [class]="r.svc.icon"></i></span>
                  {{ r.svc.name }}
                </span>
              </td>
              <td class="text-muted">{{ r.group }}</td>
              <td>
                <div class="tagrow">
                  @for (t of r.svc.tags; track t) { <span class="tag tag-neutral">{{ t }}</span> }
                </div>
              </td>
              <!-- Na lista cabe tudo: os dois endereços (interno e externo) e todas as portas.
                   O card mostra só um endereço porque não tem espaço; aqui não é o caso. -->
              <td>
                @if (r.svc.localUrl) {
                  <div class="addr"><span class="addr-kind">interna</span><span class="mono">{{ r.svc.localUrl }}</span></div>
                }
                @if (r.svc.publicUrl) {
                  <div class="addr"><span class="addr-kind">externa</span><span class="mono">{{ r.svc.publicUrl }}</span></div>
                }
                @if (!r.svc.localUrl && !r.svc.publicUrl) { <span class="text-muted">—</span> }
              </td>
              <td>
                @if ((r.svc.ports || []).length) {
                  <div class="portlist">
                    @for (p of r.svc.ports; track p.number) {
                      <span class="port-chip"><b class="mono">{{ p.number }}</b> {{ p.name }}</span>
                    }
                  </div>
                } @else {
                  <span class="text-muted">—</span>
                }
              </td>
              <td>
                <div class="row-actions" (click)="$event.stopPropagation()">
                  @if (edit.enabled()) {
                    <button type="button" class="btn btn-icon btn-ghost" (click)="toggleEnabled(r.svc)"
                            [class.on]="r.svc.enabled" [title]="r.svc.enabled ? 'Desativar' : 'Ativar'">
                      <app-ui-icon name="power" [size]="13" />
                    </button>
                    <button type="button" class="btn btn-icon btn-ghost" (click)="editService(r.svc)" title="Editar">
                      <app-ui-icon name="edit" [size]="13" />
                    </button>
                    <button type="button" class="btn btn-icon btn-ghost" (click)="deleteService(r.svc)" title="Excluir">
                      <app-ui-icon name="trash" [size]="13" />
                    </button>
                  }
                  <!-- Interno e externo são destinos diferentes: cada um tem seu botão,
                       como no drawer. Um só botão acabaria sempre preferindo o externo. -->
                  @if (r.svc.localUrl) {
                    <a class="btn btn-icon btn-secondary" [href]="r.svc.localUrl" target="_blank" rel="noopener"
                       title="Abrir interno (rede local)" aria-label="Abrir interno">
                      <app-ui-icon name="home" [size]="13" />
                    </a>
                  }
                  @if (r.svc.publicUrl) {
                    <a class="btn btn-icon btn-secondary" [href]="r.svc.publicUrl" target="_blank" rel="noopener"
                       title="Abrir externo (fora de casa)" aria-label="Abrir externo">
                      <app-ui-icon name="globe" [size]="13" />
                    </a>
                  }
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
      @if (!store.loading() && store.flat().length === 0) {
        <div class="empty">Nenhum serviço encontrado.</div>
      }
    }
  `,
  styles: [`
    .actions { display: flex; gap: var(--space-3); margin-bottom: var(--space-6); }
    .empty { padding: var(--space-8) 0; text-align: center; font-size: 13.5px;
      color: color-mix(in srgb, var(--color-text) 45%, transparent); }
    .spacer { flex: 1; }

    .group-block { margin-bottom: var(--space-8); }
    /* Marco entre categorias: só o traço do próprio título (sem linha divisória). */
    .group-block + .group-block { padding-top: var(--space-8); }
    /* O cabeçalho da categoria fica 5% mais largo que a grade de cards abaixo:
       a grade herda 90% da área; o head estoura ~2,778% p/ cada lado → ~95%.
       Espaço extra abaixo do título separando do viewport de cards. */
    .group-head { display: flex; align-items: center; gap: 10px; margin: 0 -2.778% var(--space-8);
      width: 105.556%; }
    /* Traço que se estende do título até a borda (estilo do dashboard antigo). */
    .group-rule { flex: 1; height: 1px; min-width: 24px;
      background: color-mix(in srgb, var(--color-text) 12%, transparent); }
    .icon-tile { width: 30px; height: 30px; border-radius: var(--radius-sm); background: var(--color-accent-800);
      color: var(--color-accent-200); display: flex; align-items: center; justify-content: center; flex: none; font-size: 15px; }
    .icon-tile i { color: inherit; }
    .group-name { font-family: var(--font-heading); font-weight: var(--font-heading-weight); font-size: 16px; }

    /* Coluna de largura fixa (240px) em vez de 1fr: os cards param de esticar no monitor largo.
       auto-fit colapsa as colunas vazias, para a última linha ficar centralizada junto com o resto. */
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 240px));
      justify-content: center; gap: var(--space-8); }
    /* Altura fixa (não min-height): é ela que ancora as faixas internas do card,
       para o ícone e o título caírem na mesma altura em TODOS os cards. */
    .om-card { position: relative; overflow: hidden; height: 156px; justify-content: space-between; padding: var(--space-4);
      cursor: pointer; transition: box-shadow .15s ease, transform .15s ease; align-items: center; text-align: center; }
    /* Faixa da cor do serviço no topo (--ci vem do card, via [style.--ci]), como no v6.1:
       meia opacidade em repouso, cheia no hover. Exige o overflow:hidden acima pra respeitar o raio. */
    .om-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: var(--ci, var(--color-accent)); opacity: .5; transition: opacity .25s ease; }
    .om-card:hover::before { opacity: 1; }
    .om-card.off::before { display: none; }
    /* Com o endereço ligado o card cresce só a faixa dele — as tags continuam com as duas linhas. */
    .om-card.with-ip { height: 184px; }
    /* No modo edição o card ganha a linha de ações no rodapé — só cresce o suficiente pra ela. */
    .om-card.editing { height: 190px; }
    .om-card.editing.with-ip { height: 218px; }
    .om-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
    .om-card:active { transform: translateY(0); }
    .om-card.off { opacity: .5; }
    tr.off { opacity: .5; }
    /* Botão de energia: aceso quando o serviço está ativo, apagado quando não. */
    .btn-icon.on { color: var(--color-accent); }
    /* Faixas: ícone (px fixo) | título | tags = o resto | endereço. Como nenhuma delas depende
       do conteúdo, cards com 0 ou 6 tags ficam alinhados — e o ícone não muda de tamanho quando
       o endereço é ligado/desligado (com % ele acompanharia a altura do card).
       minmax(0, 1fr) é obrigatório: um 1fr sozinho vale minmax(AUTO, 1fr), e o mínimo automático
       deixaria a faixa de tags crescer com o conteúdo e empurrar o endereço pra fora do card. */
    .card-body { flex: 1; min-height: 0; width: 100%; display: grid; grid-template-rows: 43px auto minmax(0, 1fr) auto;
      justify-items: center; row-gap: var(--space-2); }
    /* Sem tile: o glifo é o ícone. Ele ocupa a faixa inteira (43px), então a fonte manda —
       nada de background/raio aqui, ao contrário do .icon-tile do cabeçalho de categoria.
       36px ≈ os 2.2rem do v6.1, e o glow/zoom vêm de lá também. */
    .card-icon { height: 100%; aspect-ratio: 1; color: var(--color-accent-200);
      display: flex; align-items: center; justify-content: center; font-size: 36px; line-height: 1;
      filter: drop-shadow(0 0 8px color-mix(in srgb, var(--ci, transparent) 40%, transparent));
      transition: transform .2s ease; }
    .om-card:hover .card-icon { transform: scale(1.12); }
    .card-icon i { color: inherit; }
    /* Nome longo trunca em vez de quebrar em 2 linhas e empurrar as tags. */
    .card-title { max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      font-size: 13px; font-weight: 700; }
    /* Tags em uma linha só: encolhem (ellipsis dentro do chip) e o excedente vira o chip "…". */
    /* Até duas linhas de chips, dentro da faixa (1fr) — o que passar disso é cortado pelo overflow,
       mas o teto de chips do TS garante que não sobre nada escondido.
       width:100% (não max-width): o teto de 30% dos chips precisa medir contra o card, não contra si mesmo. */
    .tagrow { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; align-content: flex-start;
      width: 100%; min-height: 0; max-height: 100%; overflow: hidden; margin-top: 5px; }
    /* Teto de 30% por chip: uma tag comprida trunca sozinha, em vez de espremer as vizinhas — e,
       como nenhum chip passa de 30%, cabem no máximo 3 por linha (6 em duas linhas). */
    .tagrow .tag { display: block; min-width: 0; max-width: 30%; overflow: hidden; text-overflow: ellipsis;
      white-space: nowrap; }
    .tagrow .tag-more { flex: none; }
    /* Endereço: faixa própria (linha 4), fixa mesmo sem tags acima. Visual de "campo"
       — contorno tracejado e fonte mono — pra não ser confundido com um chip de tag. */
    .card-ip { grid-row: 4; align-self: end; max-width: 100%; padding: 2px 8px;
      border: 1px dashed color-mix(in srgb, var(--color-text) 22%, transparent);
      border-radius: var(--radius-sm); background: color-mix(in srgb, var(--color-text) 4%, transparent);
      font-family: ui-monospace, Menlo, monospace; font-size: 11px; letter-spacing: .02em;
      color: color-mix(in srgb, var(--color-text) 62%, transparent);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .card-actions { display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: var(--space-3); }

    .row-clickable { cursor: pointer; }
    /* Mesmo ícone do card, em miniatura: cor do serviço + glow (--ci vem da <tr>) e zoom no hover. */
    .row-name { display: inline-flex; align-items: center; gap: var(--space-3); }
    .row-icon { flex: none; width: 18px; display: inline-flex; justify-content: center; font-size: 15px;
      color: var(--color-accent-200);
      filter: drop-shadow(0 0 6px color-mix(in srgb, var(--ci, transparent) 40%, transparent));
      transition: transform .2s ease; }
    tr.row-clickable:hover .row-icon { transform: scale(1.12); }
    .mono { font-family: ui-monospace, Menlo, monospace; font-size: 13px; }
    /* Na lista não há grade pra desalinhar: as tags voltam a quebrar linha inteiras. */
    td .tagrow { justify-content: flex-start; margin: 0; flex-wrap: wrap; overflow: visible; }
    td .tagrow .tag { display: inline-flex; }
    /* Endereços: um por linha, com o tipo (interna/externa) como rótulo à esquerda. */
    .addr { display: flex; align-items: baseline; gap: 8px; }
    .addr + .addr { margin-top: 3px; }
    .addr-kind { flex: none; width: 52px; font-size: 10px; text-transform: uppercase; letter-spacing: .06em;
      color: color-mix(in srgb, var(--color-text) 50%, transparent); }
    .addr .mono { word-break: break-all; }
    /* Portas: todas, como chips discretos (mesma leitura do drawer, não de tag). */
    .portlist { display: flex; flex-wrap: wrap; gap: 4px; }
    .port-chip { padding: 1px 7px; border-radius: var(--radius-sm); white-space: nowrap; font-size: 11px;
      border: 1px dashed color-mix(in srgb, var(--color-text) 22%, transparent);
      background: color-mix(in srgb, var(--color-text) 4%, transparent);
      color: color-mix(in srgb, var(--color-text) 70%, transparent); }
    .port-chip b { margin-right: 5px; font-size: 11px; color: var(--color-text); }
    .row-actions { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }

    /* drag-and-drop */
    .group-block.editing { outline: 1px dashed color-mix(in srgb, var(--color-text) 22%, transparent);
      outline-offset: 8px; border-radius: var(--radius-lg); padding: var(--space-2); margin-bottom: var(--space-8); }
    /* No modo edição o head não estoura, p/ não vazar do contorno tracejado. */
    .group-block.editing .group-head { width: auto; margin-left: 0; margin-right: 0; }
    .grip { display: inline-flex; color: color-mix(in srgb, var(--color-text) 45%, transparent); cursor: grab; }
    .grip:active { cursor: grabbing; }
    .om-card.editing { outline: 1px dashed color-mix(in srgb, var(--color-text) 22%, transparent); outline-offset: 3px; }
    .card-grip { position: absolute; top: 10px; right: 10px; color: color-mix(in srgb, var(--color-text) 45%, transparent);
      cursor: grab; z-index: 2; }
    .card-grip:active { cursor: grabbing; }
    .cdk-drag-preview { box-shadow: var(--shadow-lg); border-radius: var(--radius-md); }
    .cdk-drag-placeholder { opacity: .35; }
    .cdk-drag-animating { transition: transform .2s cubic-bezier(0, 0, 0.2, 1); }
    .grid.cdk-drop-list-dragging .om-card:not(.cdk-drag-placeholder) { transition: transform .2s cubic-bezier(0, 0, 0.2, 1); }
  `],
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  readonly store = inject(DashboardStore);
  readonly edit = inject(EditModeService);
  readonly prefs = inject(PrefsService);

  constructor() {
    // No modo edição, o drag reordena a lista COMPLETA — garante que nenhum
    // filtro (categoria/busca) esteja escondendo itens e bagunçando os índices.
    // A view (grade/lista) NÃO é forçada: dá p/ editar nas duas (o reordenar por
    // arraste só existe na grade; na lista edita-se pelos botões).
    effect(() => {
      if (this.edit.enabled()) {
        this.store.activeGroup.set('Todos');
        this.store.query.set('');
      }
    });
  }

  ngOnInit(): void {
    this.store.reload();
  }


  /** Fundo do tile do ícone: tingido da cor quando "coloridos" está ligado;
   *  null deixa o CSS aplicar o accent monocromático padrão. */
  tileBg(color: string): string | null {
    return this.prefs.coloredIcons() && color
      ? `color-mix(in srgb, ${color} 22%, transparent)`
      : null;
  }
  /** Cor do glifo: a própria cor quando colorido; null herda o accent do CSS. */
  tileFg(color: string): string | null {
    return this.prefs.coloredIcons() && color ? color : null;
  }

  /** Tags exibidas no card. Cada chip cabe em no máx. 30% da largura → 3 por linha, 6 nas duas
   *  linhas da faixa. Se passar de 6, uma vaga vira o chip "…". */
  shownTags(svc: Service): string[] {
    const tags = svc.tags ?? [];
    return tags.length <= DashboardComponent.CARD_TAG_SLOTS
      ? tags
      : tags.slice(0, DashboardComponent.CARD_TAG_SLOTS - 1);
  }
  /** As tags que sobraram, como texto do tooltip do chip "…" — vazio = não renderiza o chip. */
  hiddenTags(svc: Service): string {
    const tags = svc.tags ?? [];
    return tags.length <= DashboardComponent.CARD_TAG_SLOTS
      ? ''
      : tags.slice(DashboardComponent.CARD_TAG_SLOTS - 1).join(', ');
  }
  private static readonly CARD_TAG_SLOTS = 6;

  /** Endereço curto do card: host[:porta] da URL local (ou da pública, se não houver local).
   *  Vazio quando não há URL — a faixa some em vez de virar uma caixinha com travessão.
   *  A lista não usa isto: lá cabem os dois endereços inteiros. */
  cardAddress(svc: Service): string {
    const raw = svc.localUrl || svc.publicUrl || '';
    if (!raw) return '';
    try {
      const u = new URL(raw.includes('://') ? raw : `http://${raw}`);
      return u.port ? `${u.hostname}:${u.port}` : u.hostname;
    } catch {
      return raw;
    }
  }

  // --- drag-and-drop ---
  /** Solta um GRUPO numa nova posição → persiste a ordem das categorias. */
  dropGroup(e: CdkDragDrop<unknown>): void {
    if (e.previousIndex === e.currentIndex) return;
    const list = [...this.store.sections()];
    const [moved] = list.splice(e.previousIndex, 1);
    list.splice(e.currentIndex, 0, moved);
    const payload = list.map((s, i) => ({ _id: s._id, order: i }));
    this.store.sections.set(list.map((s, i) => ({ ...s, order: i })));
    this.api.reorderSections(payload).subscribe({
      error: () => { this.snack.open('Falha ao salvar a ordem das categorias', 'ok', { duration: 4000 }); this.store.reload(); },
    });
  }

  /** Solta um CARD numa nova posição dentro do MESMO grupo → persiste a ordem. */
  dropCard(g: GroupVM, e: CdkDragDrop<unknown>): void {
    if (e.previousIndex === e.currentIndex) return;
    const list = [...g.items];
    const [moved] = list.splice(e.previousIndex, 1);
    list.splice(e.currentIndex, 0, moved);
    this.persistCardOrder(list);
  }

  // --- reordenação por setas (fallback acessível/touch) ---
  move(g: GroupVM, index: number, delta: number): void {
    const list = [...g.items];
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    this.persistCardOrder(list);
  }

  /** Reatribui `order` sequencial à lista de um grupo, aplica otimista e salva. */
  private persistCardOrder(list: Service[]): void {
    const payload = list.map((svc, i) => ({ _id: svc._id, order: i }));
    const orderById = new Map(payload.map((p) => [p._id, p.order]));
    this.store.services.update((all) =>
      all.map((s) => (orderById.has(s._id) ? { ...s, order: orderById.get(s._id)! } : s)),
    );
    this.api.reorderServices(payload).subscribe({
      error: () => { this.snack.open('Falha ao salvar a ordem', 'ok', { duration: 4000 }); this.store.reload(); },
    });
  }

  // --- serviços ---
  // Criar e editar usam o mesmo painel lateral: é o mesmo formulário, e o dialog
  // Material ficava apertado demais pros campos de porta.
  newService(): void {
    if (this.store.sections().length === 0) {
      this.snack.open('Crie uma categoria antes.', 'ok', { duration: 3000 });
      return;
    }
    this.store.newService();
  }

  editService(svc: Service): void {
    this.store.editService(svc);
  }

  deleteService(svc: Service): void {
    if (!confirm(`Excluir "${svc.name}"?`)) return;
    this.api.deleteService(svc._id).subscribe(() => { this.snack.open('Serviço excluído'); this.store.reload(); });
  }

  /** Liga/desliga o serviço sem abrir o formulário. Desligado o card fica apagado
   *  (`.off`) e continua na grade — é o estado de "existe, mas não está no ar". */
  toggleEnabled(svc: Service): void {
    const enabled = !svc.enabled;
    this.api.updateService(svc._id, { enabled }).subscribe(() => {
      this.snack.open(enabled ? `"${svc.name}" ativado` : `"${svc.name}" desativado`);
      this.store.reload();
    });
  }

  // --- categorias ---
  newSection(): void {
    this.store.newSection();
  }

  editSection(sec: Section): void {
    this.store.editSection(sec);
  }

  deleteSection(sec: Section): void {
    if (!confirm(`Excluir a categoria "${sec.name}"?`)) return;
    this.api.deleteSection(sec._id).subscribe({
      next: () => { this.snack.open('Categoria excluída'); this.store.reload(); },
      error: (e) => this.snack.open(e?.error?.error ?? 'Erro ao excluir', 'ok', { duration: 4000 }),
    });
  }
}
