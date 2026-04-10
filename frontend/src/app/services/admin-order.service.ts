import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminOrderItem {
  cookieId: number;
  cookieName: string;
  quantity: number;
  unitPrice: number;
}

export interface AdminOrder {
  id: number;
  userId: number;
  customerEmail?: string;
  customerName?: string;
  items: AdminOrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  shippingAddress: string;
  deliveryDate?: string;
  paymentMethod?: 'PAY_ON_DELIVERY' | 'PAYPAL';
}

@Injectable({ providedIn: 'root' })
export class AdminOrderService {
  private apiUrl = `${environment.apiUrl}/api/admin/orders`;

  constructor(private http: HttpClient) {}

  getAllOrders(): Observable<AdminOrder[]> {
    return this.http.get<AdminOrder[]>(this.apiUrl);
  }

  updateStatus(orderId: number, status: string): Observable<AdminOrder> {
    return this.http.patch<AdminOrder>(`${this.apiUrl}/${orderId}/status`, { status });
  }
}
