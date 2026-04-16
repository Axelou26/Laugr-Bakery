import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, Order } from '../../services/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 class="page-title">Mes commandes</h1>
    @if (loading) {
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Chargement de vos commandes...</p>
      </div>
    } @else if (orders.length === 0) {
      <div class="empty-state">
        <p class="empty-icon">📦</p>
        <p>Vous n'avez pas encore passé de commande.</p>
      </div>
    } @else {
      <div class="orders-list">
        @for (order of orders; track order.id) {
          <article class="order-card">
            <div class="order-header">
              <span class="order-id">Commande #{{ order.id }}</span>
              <span class="status" [class]="order.status.toLowerCase()">{{ statusLabel(order.status) }}</span>
            </div>
            <p class="order-date">{{ order.createdAt | date:'dd/MM/yyyy à HH:mm' }}</p>
            @if (order.deliveryDate) {
              <p class="delivery-date">📅 Livraison / retrait prévu : {{ order.deliveryDate | date:'dd/MM/yyyy à HH:mm' }}</p>
            }
            @if (order.shippingAddress) {
              <p class="fulfillment-line">📦 {{ order.shippingAddress }}</p>
            }
            <ul class="order-items">
              @for (item of order.items; track item.cookieId + '-' + item.unitPrice) {
                <li>
                  <span class="item-name">{{ formatOrderItemLabel(item) }}</span>
                  <span class="item-qty">x {{ item.quantity }}</span>
                  <span class="item-price">{{ item.unitPrice * item.quantity | number:'1.2-2' }} €</span>
                </li>
              }
            </ul>
            @if (order.discountAmount && order.discountAmount > 0) {
              <p class="promo-line">
                Code <strong>{{ order.appliedPromoCode || '—' }}</strong> : −{{
                  order.discountAmount | number:'1.2-2'
                }}
                €
              </p>
            }
            <div class="order-total">
              <span>Total</span>
              <strong>{{ order.totalAmount | number:'1.2-2' }} €</strong>
            </div>
          </article>
        }
      </div>
    }
  `,
  styles: [`
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 4rem;
      color: var(--color-text-muted);
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.5; }
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .order-card {
      background: var(--color-surface-elevated);
      border-radius: var(--radius-lg);
      padding: 1.75rem;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border);
      transition: box-shadow 0.2s;
    }
    .order-card:hover {
      box-shadow: var(--shadow-md);
    }
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .order-id {
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--color-text);
    }
    .status {
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
    }
    .status.pending {
      background: #fef3c7;
      color: #92400e;
    }
    .status.confirmed {
      background: #d1fae5;
      color: #065f46;
    }
    .status.shipped {
      background: #dbeafe;
      color: #1e40af;
    }
    .status.delivered {
      background: #d1fae5;
      color: #047857;
    }
    .status.cancelled {
      background: #fee2e2;
      color: #991b1b;
    }
    .order-date {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      margin-bottom: 1rem;
    }
    .delivery-date,
    .fulfillment-line {
      font-size: 0.95rem;
      color: var(--color-text);
      margin: 0 0 0.5rem;
    }
    .order-items {
      list-style: none;
      margin-bottom: 1rem;
      padding: 0;
    }
    .order-items li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--color-border);
      font-size: 0.95rem;
    }
    .order-items li:last-child { border-bottom: none; }
    .item-name { flex: 1; }
    .item-qty { color: var(--color-text-muted); }
    .item-price { font-weight: 600; }
    .promo-line {
      font-size: 0.9rem;
      color: #0f7a3e;
      margin: 0 0 0.5rem;
    }
    .order-total {
      display: flex;
      justify-content: space-between;
      padding-top: 1rem;
      margin-top: 1rem;
      border-top: 2px solid var(--color-border);
      font-size: 1.15rem;
    }
    @media (max-width: 600px) {
      .order-card { padding: 1.25rem; }
      .order-header { flex-wrap: wrap; gap: 0.5rem; }
      .order-items li { flex-wrap: wrap; gap: 0.25rem; }
      .item-name { min-width: 100%; }
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.orderService.getMyOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      SHIPPED: 'Expédiée',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée'
    };
    return map[status] ?? status;
  }

  formatOrderItemLabel(item: { cookieName: string; unitPrice: number }): string {
    const name = item.cookieName ?? '';
    const lower = name.toLowerCase();
    const isBol = item.unitPrice >= 5;

    if (isBol) {
      if (lower.includes('bol') || lower.includes('mi-cuit')) return name;
      return `🥣 Bol mi-cuit : ${name}`;
    }

    if (lower.includes('box')) return name;
    return `🍪 Box (6 cookies) : ${name}`;
  }
}
