import { Component, inject } from '@angular/core';
import { AboutUiService } from '../core/about-ui.service';
import { UiIconComponent } from '../shared/ui-icon.component';
import { TranslatePipe } from '../core/translate.pipe';

/** Versão exibida no diálogo "Sobre" — fonte única para a UI. */
export const APP_VERSION = '1.0.0';

interface AboutLink {
  icon: string;
  /** Chave i18n do rótulo do link (traduzida no template). */
  labelKey: string;
  href: string;
  text: string;
}

/**
 * Diálogo "Sobre": identidade do projeto (nome, versão, descrição), autoria
 * ("Feito por Dante Basso"), links relacionados e a licença (Apache 2.0).
 */
@Component({
  selector: 'app-about-dialog',
  standalone: true,
  imports: [UiIconComponent, TranslatePipe],
  template: `
    @if (ui.open()) {
      <div class="dialog-backdrop" (click)="ui.close()">
        <div class="dialog about" (click)="$event.stopPropagation()">
          <div class="head">
            <div class="ident">
              <img class="mark" src="logo.svg" alt="" width="34" height="34" />
              <div>
                <div class="name">Burrow <span class="ver">v{{ version }}</span></div>
                <div class="author">{{ 'about.madeBy' | t }}</div>
              </div>
            </div>
            <button type="button" class="btn btn-icon btn-ghost" (click)="ui.close()" [attr.aria-label]="'common.close' | t">
              <app-ui-icon name="close" [size]="14" />
            </button>
          </div>

          <p class="desc">{{ 'about.description' | t }}</p>

          <div class="links">
            @for (l of links; track l.href) {
              <a class="link" [href]="l.href" target="_blank" rel="noopener noreferrer">
                <app-ui-icon [name]="l.icon" [size]="16" />
                <span class="link-label">{{ l.labelKey | t }}</span>
                <span class="link-text">{{ l.text }}</span>
                <app-ui-icon name="external" [size]="13" />
              </a>
            }
          </div>

          <hr class="hr" style="margin: 0" />

          <div class="license">
            <span>{{ 'about.licensedUnder' | t }} <strong>Apache 2.0</strong>.</span>
            <a [href]="licenseHref" target="_blank" rel="noopener noreferrer">{{ 'about.viewLicense' | t }} <app-ui-icon name="external" [size]="12" /></a>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .about { width: min(440px, 92vw); max-height: 85vh; padding: var(--space-6);
      display: flex; flex-direction: column; gap: var(--space-5); overflow-y: auto; }
    .head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); }
    .ident { display: flex; align-items: center; gap: 12px; }
    .mark { width: 34px; height: 34px; border-radius: var(--radius-sm); display: block; flex: none; }
    .name { font-family: var(--font-heading); font-weight: var(--font-heading-weight); font-size: 18px; }
    .ver { font-family: var(--font-body); font-weight: 500; font-size: 11.5px;
      color: color-mix(in srgb, var(--color-text) 55%, transparent); margin-left: 4px; }
    .author { font-size: 12.5px; color: color-mix(in srgb, var(--color-text) 70%, transparent); margin-top: 2px; }
    .desc { margin: 0; font-size: 13px; line-height: 1.55; color: color-mix(in srgb, var(--color-text) 82%, transparent); }

    .links { display: flex; flex-direction: column; gap: 2px; }
    .link { display: flex; align-items: center; gap: 10px; padding: 9px 8px; border-radius: var(--radius-md);
      color: var(--color-text); text-decoration: none; font-size: 13px; }
    .link:hover { background: color-mix(in srgb, var(--color-text) 7%, transparent); }
    .link-label { flex: none; }
    .link-text { flex: 1; text-align: right; font-size: 11.5px;
      color: color-mix(in srgb, var(--color-text) 50%, transparent);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .license { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
      font-size: 12.5px; color: color-mix(in srgb, var(--color-text) 70%, transparent); }
    .license a { display: inline-flex; align-items: center; gap: 5px; color: var(--color-accent-300); text-decoration: none; }
    .license a:hover { text-decoration: underline; }
  `],
})
export class AboutDialogComponent {
  readonly ui = inject(AboutUiService);
  readonly version = APP_VERSION;
  readonly licenseHref = 'https://github.com/dcbasso/burrow/blob/main/LICENSE';

  readonly links: AboutLink[] = [
    { icon: 'globe', labelKey: 'about.linkPersonalSite', href: 'https://www.dantebasso.com.br/', text: 'dantebasso.com.br' },
    { icon: 'home', labelKey: 'about.linkProjectPage', href: 'https://www.dantebasso.com.br/opensource/burrow/', text: 'opensource/burrow' },
    { icon: 'github', labelKey: 'about.linkSource', href: 'https://github.com/dcbasso/burrow', text: 'github.com/dcbasso/burrow' },
    { icon: 'github', labelKey: 'about.linkGithub', href: 'https://github.com/dcbasso', text: '@dcbasso' },
    { icon: 'linkedin', labelKey: 'about.linkLinkedin', href: 'https://www.linkedin.com/in/dante-basso-filho', text: 'dante-basso-filho' },
    { icon: 'mail', labelKey: 'about.linkEmail', href: 'mailto:dcbasso@gmail.com', text: 'dcbasso@gmail.com' },
  ];
}
