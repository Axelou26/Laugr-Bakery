import { Injectable, signal, computed } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts = signal<Toast[]>([]);
  private nextId = 0;

  readonly items = this.toasts.asReadonly();

  success(message: string, duration = 3000) {
    this.add({ message, type: 'success', duration });
  }

  info(message: string, duration = 3000) {
    this.add({ message, type: 'info', duration });
  }

  warning(message: string, duration = 3000) {
    this.add({ message, type: 'warning', duration });
  }

  error(message: string, duration = 4000) {
    this.add({ message, type: 'error', duration });
  }

  private add(toast: Omit<Toast, 'id'>) {
    const id = ++this.nextId;
    const fullToast: Toast = { ...toast, id };
    this.toasts.update((list) => [...list, fullToast]);

    const duration = toast.duration ?? 3000;
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  remove(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
