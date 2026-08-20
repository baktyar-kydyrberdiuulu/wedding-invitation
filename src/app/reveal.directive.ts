import { afterNextRender, Directive, ElementRef, inject, OnDestroy, Renderer2 } from '@angular/core';

@Directive({ selector: '[appReveal]' })
export class RevealDirective implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private observer?: IntersectionObserver;

  constructor() {
    this.renderer.addClass(this.el.nativeElement, 'reveal-init');
    afterNextRender(() => {
      this.observer = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) {
          this.renderer.addClass(this.el.nativeElement, 'reveal-visible');
          this.observer?.disconnect();
        }
      }, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
      this.observer.observe(this.el.nativeElement);
    });
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }
}
