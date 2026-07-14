import { Component, inject } from '@angular/core';
import { AboutUiService } from '../core/about-ui.service';
import { UiIconComponent } from '../shared/ui-icon.component';

/** Versão exibida no diálogo "Sobre" — fonte única para a UI. */
export const APP_VERSION = '1.0.0';

interface AboutLink {
  icon: string;
  label: string;
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
  imports: [UiIconComponent],
  template: `
    @if (ui.open()) {
      <div class="dialog-backdrop" (click)="ui.close()">
        <div class="dialog about" (click)="$event.stopPropagation()">
          <div class="head">
            <div class="ident">
              <img class="mark" src="logo.svg" alt="" width="34" height="34" />
              <div>
                <div class="name">Burrow <span class="ver">v{{ version }}</span></div>
                <div class="author">Feito por Dante Basso</div>
              </div>
            </div>
            <button type="button" class="btn btn-icon btn-ghost" (click)="ui.close()" aria-label="Fechar">
              <app-ui-icon name="close" [size]="14" />
            </button>
          </div>

          <p class="desc">
            Dashboard self-hosted para o seu homelab. Diferente de um dashboard estático, as
            categorias e os serviços são gerenciados pela própria interface: você adiciona, edita,
            reordena e escolhe ícones sem mexer em HTML nem reimplantar nada.
          </p>

          <div class="links">
            @for (l of links; track l.href) {
              <a class="link" [href]="l.href" target="_blank" rel="noopener noreferrer">
                <app-ui-icon [name]="l.icon" [size]="16" />
                <span class="link-label">{{ l.label }}</span>
                <span class="link-text">{{ l.text }}</span>
                <app-ui-icon name="external" [size]="13" />
              </a>
            }
          </div>

          <hr class="hr" style="margin: 0" />

          <div class="license">
            <span>Licenciado sob <strong>Apache 2.0</strong>.</span>
            <a [href]="licenseHref" target="_blank" rel="noopener noreferrer">Ver licença <app-ui-icon name="external" [size]="12" /></a>
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
    { icon: 'globe', label: 'Site pessoal', href: 'https://www.dantebasso.com.br/', text: 'dantebasso.com.br' },
    { icon: 'home', label: 'Página do projeto', href: 'https://www.dantebasso.com.br/opensource/burrow/', text: 'opensource/burrow' },
    { icon: 'github', label: 'Código-fonte', href: 'https://github.com/dcbasso/burrow', text: 'github.com/dcbasso/burrow' },
    { icon: 'github', label: 'GitHub', href: 'https://github.com/dcbasso', text: '@dcbasso' },
    { icon: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/dante-basso-filho', text: 'dante-basso-filho' },
    { icon: 'mail', label: 'E-mail', href: 'mailto:dcbasso@gmail.com', text: 'dcbasso@gmail.com' },
  ];
}
