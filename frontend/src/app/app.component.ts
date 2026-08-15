import { Component, ElementRef, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { AuthService } from './core/auth.service';
import { DashboardStore } from './core/dashboard.store';
import { EditModeService } from './core/edit-mode.service';
import { PrefsService } from './core/prefs.service';
import { SettingsUiService } from './core/settings-ui.service';
import { AboutUiService } from './core/about-ui.service';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ServiceDrawerComponent } from './dashboard/service-drawer.component';
import { SettingsDialogComponent } from './dashboard/settings-dialog.component';
import { AboutDialogComponent } from './dashboard/about-dialog.component';
import { UiIconComponent } from './shared/ui-icon.component';
import { TranslatePipe } from './core/translate.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    LoginComponent, DashboardComponent, ServiceDrawerComponent,
    SettingsDialogComponent, AboutDialogComponent, UiIconComponent, TranslatePipe,
  ],
  template: `
    @if (!auth.authed()) {
      <app-login></app-login>
    } @else {
      <div class="om-dash" [attr.data-theme]="prefs.theme()" [attr.data-accent-color]="prefs.accent()">
        <!-- TOPBAR -->
        <div class="topbar">
          <button type="button" class="icon-btn" [class.active]="sidebarVisible()"
                  (click)="toggleSidebar()"
                  [title]="sidebarVisible() ? ('topbar.collapseMenu' | t) : ('topbar.expandMenu' | t)"
                  [attr.aria-label]="'topbar.toggleSidebarAria' | t">
            <app-ui-icon name="sidebar" [size]="16" />
          </button>
          <div class="brand">
            <img class="brand-mark" src="logo.svg" alt="Burrow" width="26" height="26" />
            Burrow
          </div>

          <div class="search" [class.disabled]="edit.enabled()" (click)="focusSearch()">
            <app-ui-icon name="search" [size]="15" />
            <input #searchInput type="text" class="search-input" [placeholder]="'topbar.searchPlaceholder' | t"
                   [attr.aria-label]="'topbar.searchAria' | t" [value]="store.query()"
                   (input)="store.query.set($any($event.target).value)" />
            @if (store.query()) {
              <button type="button" class="search-clear" (click)="clearSearch(); $event.stopPropagation()"
                      [title]="'topbar.clearSearch' | t" [attr.aria-label]="'topbar.clearSearch' | t">
                <app-ui-icon name="close" [size]="12" />
              </button>
            } @else {
              <span class="kbd">⌘K</span>
            }
          </div>
          <span class="spacer"></span>

          <div class="seg" [class.disabled]="edit.enabled()" role="radiogroup" [attr.aria-label]="'topbar.viewAria' | t">
            <label class="seg-opt">
              <input type="radio" name="view" [checked]="prefs.view() === 'grid'" (change)="prefs.setView('grid')" />
              <app-ui-icon name="grid" [size]="13" /> {{ 'topbar.viewGrid' | t }}
            </label>
            <label class="seg-opt">
              <input type="radio" name="view" [checked]="prefs.view() === 'list'" (change)="prefs.setView('list')" />
              <app-ui-icon name="list" [size]="13" /> {{ 'topbar.viewList' | t }}
            </label>
          </div>

          <button type="button" class="icon-btn" [class.active]="edit.enabled()" (click)="edit.toggle()"
                  [title]="edit.enabled() ? ('topbar.lockEdit' | t) : ('topbar.editMode' | t)" [attr.aria-label]="'topbar.editMode' | t">
            <app-ui-icon [name]="edit.enabled() ? 'unlock' : 'lock'" [size]="16" />
          </button>

          <div class="menu-wrap">
            <button type="button" class="avatar-btn" (click)="toggleProfile()" [attr.aria-label]="'topbar.profileAria' | t">
              @if (auth.picture()) {
                <img [src]="auth.picture()!" alt="" referrerpolicy="no-referrer" />
              } @else {
                {{ initial() }}
              }
            </button>
            @if (profileOpen()) {
              <div class="catcher" (click)="profileOpen.set(false)"></div>
              <div class="menu profile">
                <div class="profile-head">
                  <div class="profile-avatar">
                    @if (auth.picture()) {
                      <img [src]="auth.picture()!" alt="" referrerpolicy="no-referrer" />
                    } @else {
                      {{ initial() }}
                    }
                  </div>
                  <div>
                    @if (auth.name()) { <div class="profile-name">{{ auth.name() }}</div> }
                    <div class="profile-email">{{ auth.email() }}</div>
                  </div>
                </div>
                <hr class="hr" style="margin: 0" />
                <div class="profile-actions">
                  <button type="button" class="menu-item" (click)="openSettings()">
                    <app-ui-icon name="gear" [size]="15" /> {{ 'menu.settings' | t }}
                  </button>
                  <button type="button" class="menu-item" (click)="openAbout()">
                    <app-ui-icon name="info" [size]="15" /> {{ 'menu.about' | t }}
                  </button>
                </div>
                <hr class="hr" style="margin: 0" />
                <button type="button" class="btn btn-secondary btn-block" (click)="auth.logout()">
                  <app-ui-icon name="logout" [size]="14" /> {{ 'menu.logout' | t }}
                </button>
              </div>
            }
          </div>
        </div>

        <!-- BANNER edição -->
        @if (edit.enabled()) {
          <div class="edit-banner">
            <span class="edit-banner-text">{{ 'editBanner.text' | t }}</span>
            <button type="button" class="btn btn-primary" (click)="edit.toggle()">{{ 'editBanner.done' | t }}</button>
          </div>
        }

        <!-- LAYOUT -->
        <div class="layout">
          @if (isMobile() && sidebarVisible()) {
            <div class="sidebar-catcher" (click)="closeSidebarMobile()"></div>
          }
          <div class="sidebar" [class.disabled]="edit.enabled()" [class.collapsed]="!sidebarVisible()">
            <div class="sidebar-item" [class.active]="store.activeGroup() === 'Todos'" (click)="selectGroup('Todos')">
              <app-ui-icon name="grid" [size]="14" />
              <span>{{ 'sidebar.all' | t }}</span>
              <span class="count">{{ store.totalCount() }}</span>
            </div>
            @for (g of store.grouped(); track g.section._id) {
              <div class="sidebar-item" [class.active]="store.activeGroup() === g.section._id"
                   (click)="selectGroup(g.section._id)">
                <i [class]="g.section.icon" class="sb-fa"
                   [style.color]="prefs.coloredIcons() ? g.section.color : null"></i>
                <span>{{ g.section.name }}</span>
                <span class="count">{{ g.items.length }}</span>
              </div>
            }
          </div>

          <div class="main">
            <div class="body">
              <app-dashboard></app-dashboard>
            </div>
          </div>
        </div>

        <app-service-drawer></app-service-drawer>
        <app-settings-dialog></app-settings-dialog>
        <app-about-dialog></app-about-dialog>
      </div>
    }
  `,
  styles: [`
    .om-dash { min-height: 100vh; background: var(--color-bg); color: var(--color-text); position: relative; }

    .topbar { display: flex; align-items: center; gap: var(--space-6); padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--color-divider); }
    .brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-heading);
      font-weight: var(--font-heading-weight); font-size: 17px; flex: none; }
    .brand-mark { width: 26px; height: 26px; border-radius: var(--radius-sm); display: block; flex: none; }

    .search { flex: 1; max-width: 600px; display: flex; align-items: center; gap: 9px; background: var(--color-surface);
      border: 1px solid var(--color-divider); border-radius: var(--radius-md); padding: 9px 12px; cursor: text;
      color: color-mix(in srgb, var(--color-text) 55%, transparent); }
    .search:hover { border-color: color-mix(in srgb, var(--color-text) 40%, transparent); }
    .search:focus-within { border-color: var(--color-accent); }
    .search-input { flex: 1; min-width: 0; background: none; border: none; outline: none;
      font: 13.5px var(--font-body); color: var(--color-text); }
    .search-input::placeholder { color: color-mix(in srgb, var(--color-text) 55%, transparent); }
    .search-clear { flex: none; display: flex; align-items: center; justify-content: center; width: 20px; height: 20px;
      padding: 0; border: none; border-radius: var(--radius-sm); background: none; cursor: pointer;
      color: color-mix(in srgb, var(--color-text) 55%, transparent); }
    .search-clear:hover { background: color-mix(in srgb, var(--color-text) 10%, transparent); color: var(--color-text); }
    .kbd { font: 500 10.5px var(--font-body); border: 1px solid var(--color-divider); border-radius: 4px;
      padding: 2px 6px; opacity: .75; flex: none; }
    .spacer { flex: 1; }

    .icon-btn { width: 34px; height: 34px; border-radius: var(--radius-md); background: transparent;
      border: 1px solid transparent; color: var(--color-text); display: flex; align-items: center;
      justify-content: center; cursor: pointer; flex: none; }
    .icon-btn:hover { background: color-mix(in srgb, var(--color-text) 8%, transparent); }
    .icon-btn.active { color: var(--color-accent); border-color: var(--color-accent); }

    .menu-wrap { position: relative; }
    .catcher { position: fixed; inset: 0; z-index: 39; }
    .menu { position: absolute; top: calc(100% + 8px); right: 0; width: 240px; background: var(--color-surface);
      border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); padding: var(--space-4);
      display: flex; flex-direction: column; gap: var(--space-4); z-index: 40; }
    .avatar-btn { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--color-divider);
      cursor: pointer; flex: none; background: var(--color-accent-800); color: var(--color-accent-100);
      font-family: var(--font-heading); font-weight: var(--font-heading-weight); font-size: 14px;
      display: flex; align-items: center; justify-content: center; text-transform: uppercase; overflow: hidden; padding: 0; }
    .avatar-btn img, .profile-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .profile-head { display: flex; align-items: center; gap: 12px; }
    .profile-avatar { width: 44px; height: 44px; border-radius: 50%; flex: none; background: var(--color-accent-800);
      color: var(--color-accent-100); display: flex; align-items: center; justify-content: center;
      font-family: var(--font-heading); font-size: 18px; text-transform: uppercase; overflow: hidden; }
    .profile-name { font-family: var(--font-heading); font-weight: var(--font-heading-weight); font-size: 14.5px; }
    .profile-email { font-size: 12px; color: color-mix(in srgb, var(--color-text) 70%, transparent); word-break: break-all; }
    .profile-actions { display: flex; flex-direction: column; gap: 2px; }
    .menu-item { display: flex; align-items: center; gap: 9px; width: 100%; background: none; border: none;
      color: var(--color-text); font: inherit; font-size: 13px; padding: 8px 6px; cursor: pointer;
      border-radius: var(--radius-sm); text-align: left; }
    .menu-item:hover { background: color-mix(in srgb, var(--color-text) 7%, transparent); }

    .edit-banner { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-6);
      background: color-mix(in srgb, var(--color-accent) 14%, transparent); border-bottom: 1px solid var(--color-divider);
      font-size: 13px; }
    .edit-banner-text { flex: 1; }

    .layout { display: flex; align-items: stretch; position: relative; }
    .sidebar-catcher { position: fixed; inset: 0; z-index: 29; }
    .sidebar { width: 232px; flex: none; border-right: 1px solid var(--color-divider);
      padding: var(--space-4) var(--space-3); display: flex; flex-direction: column; gap: 2px;
      overflow: hidden; transition: width .18s ease, padding .18s ease, opacity .18s ease; }
    .sidebar.collapsed { width: 0; padding-left: 0; padding-right: 0; border-right: none; opacity: 0; }
    .sidebar-item { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: var(--radius-md);
      font-size: 13.5px; cursor: pointer; color: color-mix(in srgb, var(--color-text) 72%, transparent); white-space: nowrap; }
    .sidebar-item:hover { background: color-mix(in srgb, var(--color-text) 6%, transparent); }
    .sidebar-item.active { background: color-mix(in srgb, var(--color-accent) 14%, transparent); color: var(--color-accent-300); }
    .sidebar-item .count { margin-left: auto; font-size: 10.5px; opacity: .6; }
    .sidebar-item span:first-of-type { flex: none; }
    .sb-fa { width: 14px; text-align: center; font-size: 12px; flex: none; }

    .main { flex: 1; min-width: 0; }
    /* Área de conteúdo/cards ocupa 90% do espaço ao lado da sidebar, centralizada
       (5% de folga de cada lado); padding só na vertical. */
    .body { width: 90%; margin: 0 auto; padding: var(--space-6) 0 var(--space-8); }

    .disabled { opacity: .4; pointer-events: none; }

    @media (max-width: 720px) {
      .kbd { display: none; }
      .body { width: auto; margin: 0; padding: var(--space-4); }
      .topbar { flex-wrap: wrap; gap: var(--space-3); }
      .search { order: 5; flex-basis: 100%; max-width: none; }
      .spacer { display: none; }
      /* No mobile o menu vira overlay flutuante controlado pelo mesmo toggle. */
      .sidebar { position: absolute; z-index: 30; top: 0; bottom: 0; left: 0; width: 232px;
        background: var(--color-surface); box-shadow: var(--shadow-lg); }
      .sidebar.collapsed { display: none; }
    }
  `],
})
export class AppComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly prefs = inject(PrefsService);
  readonly edit = inject(EditModeService);
  readonly store = inject(DashboardStore);
  private settingsUi = inject(SettingsUiService);
  private aboutUi = inject(AboutUiService);

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  readonly profileOpen = signal(false);

  readonly initial = computed(() => (this.auth.email()?.[0] ?? '?').toUpperCase());

  // Estado do menu lateral no mobile: overlay efêmero (nunca persistido), sempre
  // começa fechado, independente da preferência de desktop salva em prefs.sidebarOpen.
  private readonly mobileQuery = window.matchMedia('(max-width: 720px)');
  readonly isMobile = signal(this.mobileQuery.matches);
  readonly mobileSidebarOpen = signal(false);
  readonly sidebarVisible = computed(() =>
    this.isMobile() ? this.mobileSidebarOpen() : this.prefs.sidebarOpen()
  );

  constructor() {
    this.mobileQuery.addEventListener('change', (e) => this.isMobile.set(e.matches));
  }

  ngOnInit(): void {
    this.auth.init();
  }

  toggleSidebar(): void {
    if (this.isMobile()) this.mobileSidebarOpen.update((v) => !v);
    else this.prefs.toggleSidebar();
  }
  closeSidebarMobile(): void { this.mobileSidebarOpen.set(false); }
  selectGroup(id: string): void {
    this.store.activeGroup.set(id);
    if (this.isMobile()) this.closeSidebarMobile();
  }

  toggleProfile(): void { this.profileOpen.update((v) => !v); }
  openSettings(): void { this.profileOpen.set(false); this.settingsUi.openAt('aparencia'); }
  openAbout(): void { this.profileOpen.set(false); this.aboutUi.show(); }

  focusSearch(): void { this.searchInput?.nativeElement.focus(); }
  clearSearch(): void {
    this.store.query.set('');
    this.focusSearch();
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!this.auth.authed()) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.focusSearch();
    } else if (e.key === 'Escape') {
      if (this.store.query()) this.clearSearch();
      this.store.closeDrawer();
      if (this.isMobile()) this.closeSidebarMobile();
    }
  }
}
