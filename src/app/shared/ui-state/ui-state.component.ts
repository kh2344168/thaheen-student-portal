import { Component, EventEmitter, Input, Output } from '@angular/core';

export type UiStateKind = 'loading' | 'empty' | 'error' | 'not-found';

@Component({
  selector: 'app-ui-state',
  template: `
    <section
      class="state-card"
      [class.state-card--loading]="kind === 'loading'"
      [class.state-card--error]="kind === 'error'"
      [attr.role]="kind === 'error' ? 'alert' : 'status'"
      aria-live="polite"
    >
      <span class="state-card__icon" aria-hidden="true">
        @switch (kind) {
          @case ('loading') {
            <span class="state-spinner"></span>
          }
          @case ('empty') {
            <span>◎</span>
          }
          @case ('error') {
            <span>!</span>
          }
          @case ('not-found') {
            <span>⌕</span>
          }
        }
      </span>
      <div class="state-card__copy">
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>
      </div>
      @if (actionLabel) {
        <button class="button button--outline" type="button" (click)="action.emit()">
          {{ actionLabel }}
        </button>
      }
    </section>
  `,
  styles: `
    .state-card {
      min-height: 190px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      padding: 30px;
      border: 1px dashed #d6d0c5;
      border-radius: 20px;
      background: var(--surface);
      text-align: center;
    }
    .state-card--loading {
      border-style: solid;
    }
    .state-card--error {
      border-color: #e3b6ae;
    }
    .state-card__icon {
      width: 48px;
      height: 48px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--surface-muted);
      color: var(--aubergine);
      font-size: 27px;
      font-weight: 700;
    }
    .state-card--error .state-card__icon {
      background: #f5e7e3;
      color: var(--danger);
    }
    .state-card__copy h2 {
      margin: 0;
      color: var(--aubergine);
      font-size: 18px;
    }
    .state-card__copy p {
      max-width: 410px;
      margin: 7px 0 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.8;
    }
    .state-spinner {
      width: 21px;
      height: 21px;
      border: 2px solid #d4d0c8;
      border-top-color: var(--aubergine);
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    .button {
      min-height: 42px;
      padding: 0 18px;
      border: 0;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 700;
    }
    .button--outline {
      border: 1px solid var(--line);
      background: var(--surface);
      color: var(--aubergine);
    }
    .button--outline:hover {
      border-color: var(--aubergine);
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class UiStateComponent {
  @Input({ required: true }) kind: UiStateKind = 'empty';
  @Input() title = '';
  @Input() message = '';
  @Input() actionLabel = '';
  @Output() readonly action = new EventEmitter<void>();
}
