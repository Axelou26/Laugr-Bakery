import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type PaymentMethod = 'PAY_ON_DELIVERY' | 'PAYPAL';

export interface OrderItem {
  cookieId: number;
  cookieName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  userId: number;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  shippingAddress: string;
  deliveryDate?: string;
  paymentMethod?: PaymentMethod;
  paypalOrderId?: string;
}

export interface PayPalConfig {
  enabled: boolean;
  clientId: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = `${environment.apiUrl}/api/orders`;

  constructor(private http: HttpClient) {}

  getPayPalConfig(): Observable<PayPalConfig> {
    return this.http.get<PayPalConfig>(`${this.apiUrl}/paypal/config`);
  }

  createOrder(
    cartItems: {
      cookieId: number;
      cookieName?: string;
      quantity: number;
      unitPrice?: number;
      subtotal?: number;
    }[],
    boxes: { items: { cookieId: number; quantity: number }[] }[],
    shippingAddress: string,
    deliveryDate: string,
    paymentMethod: PaymentMethod
  ): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, {
      cartItems: cartItems ?? [],
      boxes: boxes ?? [],
      shippingAddress,
      deliveryDate,
      paymentMethod
    });
  }

  capturePayPal(paypalOrderId: string): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/paypal/capture`, { paypalOrderId });
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }
}
