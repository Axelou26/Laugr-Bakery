import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.items(); track toast.id) {
        <div
          class="toast toast-{{ toast.type }}"
          (click)="toastService.remove(toast.id)"
        >
          <span class="toast-icon">{{ getIcon(toast.type) }}</span>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      left: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 360px;
      margin-left: auto;
    }
    @media (max-width: 480px) {
      .toast-container {
        left: 0.75rem;
        right: 0.75rem;
        bottom: 0.75rem;
        max-width: none;
      }
      .toast { padding: 0.875rem 1rem; }
      .toast-message { font-size: 0.9rem; }
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      cursor: pointer;
      transition: transform 0.2s, opacity 0.2s;
      animation: slideIn 0.35s ease-out;
    }
    .toast:hover {
      transform: translateX(-4px);
    }
    .toast-success {
      background: linear-gradient(135deg, #4a9c6d 0%, #3d8559 100%);
      color: white;
      border-left: 4px solid #2d6b45;
    }
    .toast-info {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: white;
      border-left: 4px solid var(--color-primary-dark);
    }
    .toast-warning {
      background: linear-gradient(135deg, #d4a043 0%, #b8862e 100%);
      color: white;
      border-left: 4px solid #9a6b1f;
    }
    .toast-error {
      background: linear-gradient(135deg, #c75c5c 0%, #a84848 100%);
      color: white;
      border-left: 4px solid #8a3535;
    }
    .toast-icon {
      font-size: 1.35rem;
      flex-shrink: 0;
    }
    .toast-message {
      font-size: 0.95rem;
      font-weight: 500;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  getIcon(type: Toast['type']): string {
    const icons: Record<Toast['type'], string> = {
      success: '✓',
      info: '🍪',
      warning: '⚠',
      error: '✕'
    };
    return icons[type];
  }
}
