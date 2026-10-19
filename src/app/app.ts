import { Component, DestroyRef, DOCUMENT, inject, PLATFORM_ID, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  // Бишкек убактысы (UTC+06:00). Бардык коноктор бир эле учурга чейин санашат.
  private readonly eventTime = Date.parse('2026-11-01T15:00:00+06:00');
  readonly opened = signal(false);
  readonly started = signal(false);
  readonly countdown = signal({ d: 0, h: 0, m: 0, s: 0 });

  constructor() {
    if (!this.browser) return;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((this.eventTime - Date.now()) / 1000));
      this.started.set(Date.now() >= this.eventTime);
      this.countdown.set({
        d: Math.floor(remaining / 86400),
        h: Math.floor(remaining / 3600) % 24,
        m: Math.floor(remaining / 60) % 60,
        s: remaining % 60,
      });
    };
    tick();
    const timer = setInterval(tick, 1000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  openInvitation(): void {
    this.opened.set(true);
    if (this.browser)
      requestAnimationFrame(() => {
        this.document.getElementById('invitation-title')?.focus({ preventScroll: true });
        this.document
          .getElementById('invitation')
          ?.scrollIntoView({ behavior: 'auto', block: 'start' });
      });
  }
}
