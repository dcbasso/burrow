import { Injectable, signal } from '@angular/core';

// Google Identity Services é carregado via <script> no index.html.
declare const google: any;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenValue: string | null = null;
  private clientId = '';

  /** true quando há um ID token válido em memória (gate total do app). */
  readonly authed = signal(false);
  readonly email = signal<string | null>(null);
  readonly name = signal<string | null>(null);
  readonly picture = signal<string | null>(null);
  readonly ready = signal(false); // GIS inicializado

  get token(): string | null {
    return this.tokenValue;
  }

  /** Busca o Client ID no backend (público) e inicializa o GIS. */
  async init(): Promise<void> {
    const cfg = await fetch('/api/config').then((r) => r.json());
    this.clientId = cfg.googleClientId;
    await this.waitForGis();
    google.accounts.id.initialize({
      client_id: this.clientId,
      callback: (resp: any) => this.handleCredential(resp.credential),
      auto_select: false,
    });
    this.ready.set(true);
  }

  renderButton(el: HTMLElement): void {
    google.accounts.id.renderButton(el, {
      theme: 'filled_blue',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
    });
  }

  logout(): void {
    this.tokenValue = null;
    this.authed.set(false);
    this.email.set(null);
    this.name.set(null);
    this.picture.set(null);
    try {
      google?.accounts?.id?.disableAutoSelect?.();
    } catch {
      /* ignore */
    }
  }

  private handleCredential(idToken: string): void {
    this.tokenValue = idToken;
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      this.email.set(payload.email ?? null);
      this.name.set(payload.name ?? null);
      this.picture.set(payload.picture ?? null);
    } catch {
      this.email.set(null);
      this.name.set(null);
      this.picture.set(null);
    }
    this.authed.set(true);
  }

  private waitForGis(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).google?.accounts?.id) return resolve();
      const t = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(t);
          resolve();
        }
      }, 50);
    });
  }
}
