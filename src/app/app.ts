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
    { time: '12:00', title: 'Сбор гостей', text: 'Welcome-зона, фотографии и лёгкие напитки.' },
    { time: '13:30', title: 'Церемония', text: 'Самый важный и трогательный момент нашего дня.' },
    { time: '15:00', title: 'Ужин', text: 'Праздничный вечер, тёплые слова и музыка.' },
    { time: '17:00', title: 'Торт', text: 'Сладкая точка вечера и продолжение танцев.' }
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

  submitRsvp(): void {
    if (this.rsvpForm.invalid) {
      this.rsvpForm.markAllAsTouched();
      return;
    }
    console.table(this.rsvpForm.getRawValue());
    this.submitted.set(true);
  }

  addToCalendar(): void {
    const title = encodeURIComponent('Свадьба Baktyiar и Aigerim');
    const details = encodeURIComponent('Будем счастливы разделить этот день вместе с вами.');
    const location = encodeURIComponent('https://maps.app.goo.gl/BWBDWm43HvXes2sz6');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=20261014T100000Z/20261014T170000Z&details=${details}&location=${location}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
