import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from './api.service';
import { Section, Service } from './models';

export interface GroupVM {
  section: Section;
  items: Service[];
}

/**
 * O que o painel lateral está mostrando. É um union (e não um punhado de flags)
 * porque os estados são mutuamente exclusivos: não existe "editando serviço E
 * criando categoria". `svc`/`sec` nulos significam "novo".
 */
export type DrawerState =
  | { kind: 'service-view'; svc: Service }
  | { kind: 'service-form'; svc: Service | null }
  | { kind: 'section-form'; sec: Section | null }
  | null;

/**
 * Fonte única de verdade do dashboard: categorias + serviços vindos da API,
 * mais o estado de navegação da UI (busca, categoria ativa, drawer, palette).
 * Componentes (topbar, sidebar, grid, drawer, palette) leem daqui via signals.
 */
@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private api = inject(ApiService);

  readonly sections = signal<Section[]>([]);
  readonly services = signal<Service[]>([]);
  readonly loading = signal(true);

  // Estado de navegação/overlays.
  readonly query = signal('');
  readonly activeGroup = signal<string>('Todos'); // 'Todos' | sectionId
  readonly drawer = signal<DrawerState>(null);

  reload(): void {
    this.loading.set(true);
    forkJoin({ sections: this.api.listSections(), services: this.api.listServices() }).subscribe({
      next: ({ sections, services }) => {
        this.sections.set([...sections].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)));
        this.services.set(services);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Serviços agrupados por categoria, cada grupo ordenado por `order`. */
  readonly grouped = computed<GroupVM[]>(() => {
    const map: Record<string, Service[]> = {};
    for (const svc of this.services()) (map[svc.sectionId] ??= []).push(svc);
    for (const list of Object.values(map)) {
      list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    }
    return this.sections().map((section) => ({ section, items: map[section._id] ?? [] }));
  });

  /** Nome da categoria de um serviço (para lista/palette/drawer). */
  sectionName(sectionId: string): string {
    return this.sections().find((s) => s._id === sectionId)?.name ?? '';
  }

  // Portas e URLs não aparecem no card, mas entram na busca: dá pra achar um serviço
  // por "6881", por "peers" ou pelo IP do host, sem nada disso estar visível na tela.
  private matches(svc: Service, groupName: string, q: string): boolean {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      svc.name.toLowerCase().includes(s) ||
      groupName.toLowerCase().includes(s) ||
      (svc.tags ?? []).some((t) => t.toLowerCase().includes(s)) ||
      (svc.ports ?? []).some((p) => p.name.toLowerCase().includes(s) || String(p.number).includes(s)) ||
      (svc.localUrl ?? '').toLowerCase().includes(s) ||
      (svc.publicUrl ?? '').toLowerCase().includes(s)
    );
  }

  /** Grupos após aplicar filtro de categoria ativa + busca (para o grid). */
  readonly visibleGroups = computed<GroupVM[]>(() => {
    const active = this.activeGroup();
    const q = this.query();
    return this.grouped()
      .filter((g) => active === 'Todos' || g.section._id === active)
      .map((g) => ({ section: g.section, items: g.items.filter((it) => this.matches(it, g.section.name, q)) }))
      .filter((g) => g.items.length > 0);
  });

  /** Todos os serviços achatados (view lista), respeitando filtro/busca. */
  readonly flat = computed(() =>
    this.visibleGroups().flatMap((g) => g.items.map((it) => ({ svc: it, group: g.section.name }))),
  );

  /** Contagem total de serviços (sidebar "Todos"). */
  readonly totalCount = computed(() => this.services().length);

  /** Tags distintas em uso, com quantas vezes aparecem (aba Tags do settings). */
  readonly tagUsage = computed<{ name: string; count: number }[]>(() => {
    const map = new Map<string, number>();
    for (const svc of this.services()) {
      for (const t of svc.tags ?? []) map.set(t, (map.get(t) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  viewService(svc: Service): void { this.drawer.set({ kind: 'service-view', svc }); }
  editService(svc: Service): void { this.drawer.set({ kind: 'service-form', svc }); }
  newService(): void { this.drawer.set({ kind: 'service-form', svc: null }); }
  editSection(sec: Section): void { this.drawer.set({ kind: 'section-form', sec }); }
  newSection(): void { this.drawer.set({ kind: 'section-form', sec: null }); }
  closeDrawer(): void { this.drawer.set(null); }
}
