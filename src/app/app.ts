import {
  Component,
  computed,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RevealDirective } from './reveal.directive';
import { isPlatformBrowser } from '@angular/common';

type Attendance = 'yes' | 'withPartner' | 'no';

@Component({
  selector: 'app-root',
  imports: [RevealDirective, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private intervalId?: ReturnType<typeof setInterval>;

  @ViewChild('musicPlayer') private musicPlayer?: ElementRef<HTMLAudioElement>;

  readonly opened = signal(false);
  readonly musicPlaying = signal(false);
  readonly musicError = signal(false);
  readonly submitted = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal(false);
  readonly now = signal(Date.now());

  // 05.11.2026, 16:00 in Kyrgyzstan (UTC+6)
  readonly targetDate = new Date('2026-11-05T16:00:00+06:00');
  readonly weekDays = ['дүй', 'шей', 'шар', 'бей', 'жум', 'ише', 'жек'];
  readonly calendarDays: (number | null)[] = [
    ...Array<number | null>(6).fill(null),
    ...Array.from({ length: 30 }, (_, index) => index + 1),
    ...Array<number | null>(6).fill(null),
  ];

  // Reference images are linked from the supplied reference website.
  // For long-term use, replace with your own /assets/*.webp files.
  readonly images = {
    hands: 'https://ernazar-aigerim.vercel.app/_next/image?q=75&url=%2Finvite%2Fhands.webp&w=3840',
    doves: 'https://ernazar-aigerim.vercel.app/_next/image?q=75&url=%2Finvite%2Fdoves.webp&w=3840',
    garland:
      'https://ernazar-aigerim.vercel.app/_next/image?q=75&url=%2Finvite%2Fgarland.webp&w=3840',
    couple:
      'https://ernazar-aigerim.vercel.app/_next/image?q=75&url=%2Finvite%2Fcouple-hijab.webp&w=3840',
    chandelier:
      'https://ernazar-aigerim.vercel.app/_next/image?q=75&url=%2Finvite%2Fchandelier.webp&w=3840',
    rings: 'https://ernazar-aigerim.vercel.app/_next/image?q=75&url=%2Finvite%2Frings.webp&w=3840',
    table: 'https://ernazar-aigerim.vercel.app/_next/image?q=75&url=%2Finvite%2Ftable.webp&w=3840',
  };

  // Search result rather than unverified restaurant coordinates.
  readonly mapUrl = 'https://maps.app.goo.gl/pe9ZqTxRDTxtUoFy5';

  readonly countdown = computed(() => {
    const delta = Math.max(0, this.targetDate.getTime() - this.now());
    return {
      d: Math.floor(delta / 86_400_000),
      h: Math.floor((delta / 3_600_000) % 24),
      m: Math.floor((delta / 60_000) % 60),
      s: Math.floor((delta / 1_000) % 60),
    };
  });

  readonly rsvpForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    attendance: new FormControl<Attendance | null>(null, { validators: [Validators.required] }),
  });

  constructor() {
    setInterval(() => this.now.set(Date.now()), 1000);
    effect(() => {
      if (this.opened()) document.body.classList.add('invitation-open');
    });
  }

  // async submitRsvp(): Promise<void> {
  //   if (this.rsvpForm.invalid) {
  //     this.rsvpForm.markAllAsTouched();
  //     return;
  //   }
  //
  //   const formValue = this.rsvpForm.getRawValue();
  //   const FORM_RESPONSE_URL =
  //     'https://docs.google.com/forms/d/e/1FAIpQLScPCIKF7hHVnDSouD-8m63-DAXg5hm2TUUxmpMECp7z-KY75A/formResponse';
  //   const ENTRY_NAME = 'entry.926445822';
  //   const ENTRY_ATTENDANCE = 'entry.2022173605';
  //
  //   // Google Forms akzeptiert bei Multiple-Choice nur exakt die hinterlegten Optionstexte.
  //   const attendanceOptionByValue: Record<Attendance, string> = {
  //     yes: 'Да, с радостью',
  //     no: 'К сожалению, нет',
  //   };
  //
  //   const payload = new URLSearchParams();
  //   payload.set(ENTRY_NAME, formValue.name ?? '');
  //   payload.set(ENTRY_ATTENDANCE, attendanceOptionByValue[formValue.attendance] ?? '');
  //
  //   try {
  //     // mode:'no-cors' ist bei Google Forms oft nötig
  //     await fetch(FORM_RESPONSE_URL, {
  //       method: 'POST',
  //       mode: 'no-cors',
  //       headers: {
  //         'Content-Type': 'application/x-www-form-urlencoded',
  //       },
  //       body: payload.toString(),
  //     });
  //
  //     // Bei no-cors kann Response nicht verlässlich gelesen werden -> als Erfolg behandeln
  //     this.submitted.set(true);
  //     this.rsvpForm.reset();
  //   } catch (error) {
  //     console.error('RSVP konnte nicht an Google Forms gesendet werden:', error);
  //     // Optional: hier Toast/Fehlermeldung anzeigen
  //   }
  // }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.classList.add('wedding-locked');
      this.intervalId = setInterval(() => this.now.set(Date.now()), 1_000);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.classList.remove('wedding-locked');
    }
  }

  openInvitation(withMusic: boolean): void {
    if (this.opened()) return;
    this.opened.set(true);
    this.document.body.classList.remove('wedding-locked');
    if (withMusic) void this.playMusic();
    // Always show the beginning after the cover disappears.
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 80);
  }

  private async playMusic(): Promise<void> {
    const player = this.musicPlayer?.nativeElement;
    if (!player) return;
    try {
      player.volume = 0.5;
      await player.play();
      this.musicPlaying.set(true);
      this.musicError.set(false);
    } catch (error) {
      this.musicPlaying.set(false);
      this.musicError.set(true);
      console.warn('Музыка башталган жок:', error);
    }
  }

  toggleMusic(): void {
    const player = this.musicPlayer?.nativeElement;
    if (!player) return;
    if (player.paused) void this.playMusic();
    else {
      player.pause();
      this.musicPlaying.set(false);
    }
  }

  addToCalendar(): void {
    // Kyrgyzstan: UTC+06, 05.11.2026 16:00–22:00 => 10:00–16:00 UTC.
    const title = 'Сыргабeк менен Айназиктин үйлөнүү тою';
    const dates = '20261105T100000Z/20261105T160000Z';
    const details = 'Той ээлери: Жумаалы жана Чынаргүл. Сизди күтөбүз!';
    const location = 'Ак-Бата рестораны, Гүлчө, Кыргызстан';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates,
      details,
      location,
    });
    window.open(
      'https://calendar.google.com/calendar/render?' + params.toString(),
      '_blank',
      'noopener,noreferrer',
    );
  }

  downloadCalendarFile(): void {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Wedding Invitation//KY//',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:syrgabak-ainazik-20261105@wedding-invitation',
      'DTSTAMP:20261021T000000Z',
      'DTSTART:20261105T100000Z',
      'DTEND:20261105T160000Z',
      'SUMMARY:Сыргабeк менен Айназиктин үйлөнүү тою',
      'DESCRIPTION:Той ээлери: Жумаалы жана Чынаргүл',
      'LOCATION:Ак-Бата рестораны\\, Гүлчө\\, Кыргызстан',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const link = this.document.createElement('a');
    link.href = url;
    link.download = 'syrgabak-ainazik-05-11-2026.ics';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  async submitRsvp(): Promise<void> {
    if (this.rsvpForm.invalid || this.submitting()) {
      this.rsvpForm.markAllAsTouched();
      return;
    }

    const { name, attendance } = this.rsvpForm.getRawValue();

    if (!attendance) {
      this.rsvpForm.controls.attendance.markAsTouched();
      return;
    }

    const responseUrl =
      'https://docs.google.com/forms/d/e/1FAIpQLScPCIKF7hHVnDSouD-8m63-DAXg5hm2TUUxmpMECp7z-KY75A/formResponse';

    // Google Forms ичиндеги үч жооп
    const googleFormChoice: Record<Attendance, string> = {
      yes: 'Албетте, келем',
      withPartner: 'Жубайым менен келем',
      no: 'Келе албайм',
    };

    // Google Forms үчүн маалымат даярдоо
    const payload = new URLSearchParams();

    // Store the partner response in the name field so it is not lost.

    payload.set('entry.926445822', name.trim());
    payload.set('entry.2022173605', googleFormChoice[attendance]);

    this.submitError.set(false);
    this.submitting.set(true);
    try {
      await fetch(responseUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(),
      });
      // no-cors hides the response status; delivery is not verifiable here.
      this.submitted.set(true);
    } catch (error) {
      console.error('Жооп жөнөтүлгөн жок:', error);
      this.submitError.set(true);
    } finally {
      this.submitting.set(false);
    }
  }
}
