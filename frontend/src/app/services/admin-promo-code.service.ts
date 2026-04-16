import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type AdminDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface AdminPromoCode {
  id: number;
  code: string;
  description?: string | null;
  discountType: AdminDiscountType;
  discountValue: number;
  active: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  usedCount: number;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminPromoCodeService {
  private apiUrl = `${environment.apiUrl}/api/admin/promo-codes`;

  constructor(private http: HttpClient) {}

  list(): Observable<AdminPromoCode[]> {
    return this.http.get<AdminPromoCode[]>(this.apiUrl);
  }

  create(body: Partial<AdminPromoCode>): Observable<AdminPromoCode> {
    return this.http.post<AdminPromoCode>(this.apiUrl, body);
  }

  update(id: number, body: Partial<AdminPromoCode>): Observable<AdminPromoCode> {
    return this.http.put<AdminPromoCode>(`${this.apiUrl}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
