import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs';

interface ShopStatusResponse {
  salesOpen: boolean;
  nextOpeningAt: string | null;
  deliveryDatesInsep: string[];
  deliveryDatesPickup: string[];
}

@Injectable({ providedIn: 'root' })
export class ShopStatusService {
  private apiUrl = `${environment.apiUrl}/api`;
  salesOpen = signal(true);
  nextOpeningAt = signal<string | null>(null);
  deliveryDatesInsep = signal<string[]>([]);
  deliveryDatesPickup = signal<string[]>([]);

  constructor(private http: HttpClient) {}

  loadStatus() {
    return this.http.get<ShopStatusResponse>(`${this.apiUrl}/shop/status`).pipe(
      tap((res) => {
        this.salesOpen.set(res.salesOpen);
        this.nextOpeningAt.set(res.nextOpeningAt ?? null);
        this.deliveryDatesInsep.set(this.normalizeSlotList(res.deliveryDatesInsep));
        this.deliveryDatesPickup.set(this.normalizeSlotList(res.deliveryDatesPickup));
      })
    );
  }

  updateStatus(
    salesOpen: boolean,
    nextOpeningAt?: string | null,
    deliveryDatesInsep?: string[],
    deliveryDatesPickup?: string[]
  ) {
    const insep = this.normalizeSlotList(
      deliveryDatesInsep !== undefined ? deliveryDatesInsep : this.deliveryDatesInsep()
    );
    const pickup = this.normalizeSlotList(
      deliveryDatesPickup !== undefined ? deliveryDatesPickup : this.deliveryDatesPickup()
    );
    return this.http.patch<ShopStatusResponse>(`${this.apiUrl}/admin/shop/status`, {
      salesOpen,
      nextOpeningAt: nextOpeningAt ?? null,
      deliveryDatesInsep: insep,
      deliveryDatesPickup: pickup
    }).pipe(
      tap((res) => {
        this.salesOpen.set(res.salesOpen);
        this.nextOpeningAt.set(res.nextOpeningAt ?? null);
        this.deliveryDatesInsep.set(this.normalizeSlotList(res.deliveryDatesInsep));
        this.deliveryDatesPickup.set(this.normalizeSlotList(res.deliveryDatesPickup));
      })
    );
  }

  private normalizeSlotList(input: string[] | undefined | null): string[] {
    if (!input?.length) return [];
    return [...new Set(input.map((d) => d.trim()).filter((d) => d.length > 0))].sort();
  }
}
