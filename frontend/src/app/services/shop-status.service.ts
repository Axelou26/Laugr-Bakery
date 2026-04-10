import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs';

interface ShopStatusResponse {
  salesOpen: boolean;
  nextOpeningAt: string | null;
  deliveryDates: string[];
}

@Injectable({ providedIn: 'root' })
export class ShopStatusService {
  private apiUrl = `${environment.apiUrl}/api`;
  salesOpen = signal(true);
  nextOpeningAt = signal<string | null>(null);
  deliveryDates = signal<string[]>([]);

  constructor(private http: HttpClient) {}

  loadStatus() {
    return this.http.get<ShopStatusResponse>(`${this.apiUrl}/shop/status`).pipe(
      tap((res) => {
        this.salesOpen.set(res.salesOpen);
        this.nextOpeningAt.set(res.nextOpeningAt ?? null);
        this.deliveryDates.set(this.normalizeDeliveryDates(res.deliveryDates, this.deliveryDates()));
      })
    );
  }

  updateStatus(salesOpen: boolean, nextOpeningAt?: string | null, deliveryDates?: string[]) {
    const requestedDates = this.normalizeDeliveryDates(deliveryDates, this.deliveryDates());
    return this.http.patch<ShopStatusResponse>(`${this.apiUrl}/admin/shop/status`, {
      salesOpen,
      nextOpeningAt: nextOpeningAt ?? null,
      deliveryDates: requestedDates
    }).pipe(
      tap((res) => {
        this.salesOpen.set(res.salesOpen);
        this.nextOpeningAt.set(res.nextOpeningAt ?? null);
        this.deliveryDates.set(this.normalizeDeliveryDates(res.deliveryDates, requestedDates));
      })
    );
  }

  private normalizeDeliveryDates(input: string[] | undefined | null, fallback: string[]): string[] {
    const base = input && input.length ? input : (fallback.length ? fallback : []);
    return [...new Set(base.map((d) => d.trim()).filter((d) => d.length > 0))].sort();
  }
}
