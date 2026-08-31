import {Component, computed, effect, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {RevealDirective} from './reveal.directive';

type Attendance = 'yes' | 'no';
interface TimelineItem { time: string; title: string; text: string; }

@Component({
  selector: 'app-root',
  imports: [RevealDirective, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly opened = signal(false);
  readonly submitted = signal(false);
  readonly targetDate = new Date('2026-10-14T16:00:00+06:00');
  readonly now = signal(Date.now());

  readonly timeline: TimelineItem[] = [
    {
      time: '13:00',
      title: 'Начало церемонии',
      text: 'Торжественное начало нашего особенного дня.'
    },
    {
      time: '13:30',
      title: 'Праздничный обед',
      text: 'Время вкусных блюд, общения и приятной атмосферы.'
    },
    {
      time: '14:00',
      title: 'Антракт',
      text: 'Небольшая пауза для отдыха и фотографий.'
    },
    {
      time: '14:30',
      title: 'Тёплые пожелания',
      text: 'Время добрых слов, поздравлений и пожеланий от наших гостей.'
    },
    {
      time: '15:00',
      title: 'Конкурсная программа',
      text: 'Весёлые конкурсы, улыбки и хорошее настроение.'
    },
    {
      time: '16:00',
      title: 'Антракт',
      text: 'Небольшой перерыв перед завершением праздника.'
    },
    {
      time: '17:00',
      title: 'Завершение вечера',
      text: 'Тёплое завершение нашего праздника и слова благодарности гостям.'
    }
  ];

  readonly countdown = computed(() => {
    const delta = Math.max(0, this.targetDate.getTime() - this.now());
    const d = Math.floor(delta / 86_400_000);
    const h = Math.floor((delta / 3_600_000) % 24);
    const m = Math.floor((delta / 60_000) % 60);
    const s = Math.floor((delta / 1000) % 60);
    return { d, h, m, s };
  });

  readonly rsvpForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    attendance: new FormControl<Attendance>('yes', { nonNullable: true }),
    guests: new FormControl(1, { nonNullable: true, validators: [Validators.min(1), Validators.max(5)] }),
    message: new FormControl('', { nonNullable: true })
  });

  constructor() {
    setInterval(() => this.now.set(Date.now()), 1000);
    effect(() => {
      if (this.opened()) document.body.classList.add('invitation-open');
    });
  }

  openInvitation(): void {
    this.opened.set(true);
    window.setTimeout(() => document.querySelector('#invitation')?.scrollIntoView({ behavior: 'smooth' }), 1050);
  }

  async submitRsvp(): Promise<void> {
    if (this.rsvpForm.invalid) {
      this.rsvpForm.markAllAsTouched();
      return;
    }

    const formValue = this.rsvpForm.getRawValue();
    const FORM_RESPONSE_URL =
      'https://docs.google.com/forms/d/e/1FAIpQLScPCIKF7hHVnDSouD-8m63-DAXg5hm2TUUxmpMECp7z-KY75A/formResponse';
    const ENTRY_NAME = 'entry.926445822';
    const ENTRY_ATTENDANCE = 'entry.2022173605';

    // Google Forms akzeptiert bei Multiple-Choice nur exakt die hinterlegten Optionstexte.
    const attendanceOptionByValue: Record<Attendance, string> = {
      "yes": 'Да, с радостью',
      "no": 'К сожалению, нет',
    };

    const payload = new URLSearchParams();
    payload.set(ENTRY_NAME, formValue.name ?? '');
    payload.set(ENTRY_ATTENDANCE, formValue.attendance ?? '');

    try {
      // mode:'no-cors' ist bei Google Forms oft nötig
      await fetch(FORM_RESPONSE_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString(),
      });

      // Bei no-cors kann Response nicht verlässlich gelesen werden -> als Erfolg behandeln
      this.submitted.set(true);
      this.rsvpForm.reset();
    } catch (error) {
      console.error('RSVP konnte nicht an Google Forms gesendet werden:', error);
      // Optional: hier Toast/Fehlermeldung anzeigen
    }
  }

  addToCalendar(): void {
    const title = encodeURIComponent('Свадьба Baktyiar и Aigerim');
    const details = encodeURIComponent('Будем счастливы разделить этот день вместе с вами.');
    const location = encodeURIComponent('https://maps.app.goo.gl/BWBDWm43HvXes2sz6');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=20261014T100000Z/20261014T170000Z&details=${details}&location=${location}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
