import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ValidatePromoResponse {
  valid: boolean;
  discountAmount: number;
  message: string;
  discountType: string | null;
  discountValue: number | null;
}

@Injectable({ providedIn: 'root' })
export class PromoCodeService {
  private apiUrl = `${environment.apiUrl}/api/promo-codes`;

  constructor(private http: HttpClient) {}

  validate(code: string, cartSubtotal: number): Observable<ValidatePromoResponse> {
    return this.http.post<ValidatePromoResponse>(`${this.apiUrl}/validate`, {
      code: code ?? '',
      cartSubtotal
    });
  }
}
