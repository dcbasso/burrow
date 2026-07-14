import { AfterViewInit, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="login">
      <div class="card">
        <img class="logo" src="logo.svg" alt="Burrow" width="64" height="64" />
        <h1>Burrow</h1>
        <p>Acesso restrito. Entre com sua conta Google autorizada.</p>
        <div #btn class="gbtn"></div>
      </div>
    </div>
  `,
  styles: [`
    .login { min-height: 100vh; display: flex; align-items: center; justify-content: center;
             background: radial-gradient(circle at 30% 15%, #1e2138, var(--color-bg)); }
    .card { background: var(--color-surface); color: var(--color-text); padding: 40px 36px;
            border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); text-align: center;
            max-width: 360px; width: 90%; }
    .logo { width: 64px; height: 64px; margin: 0 auto 12px; display: block; border-radius: 14px; }
    h1 { margin: 8px 0 6px; font-size: 22px; font-family: var(--font-heading); font-weight: 500; }
    p { margin: 0 0 24px; opacity: .65; font-size: 14px; }
    .gbtn { display: flex; justify-content: center; }
  `],
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('btn', { static: true }) btn!: ElementRef<HTMLElement>;
  private auth = inject(AuthService);

  ngAfterViewInit(): void {
    // Renderiza assim que o GIS estiver pronto.
    const tryRender = () => {
      if (this.auth.ready()) {
        this.auth.renderButton(this.btn.nativeElement);
      } else {
        setTimeout(tryRender, 60);
      }
    };
    tryRender();
  }
}
