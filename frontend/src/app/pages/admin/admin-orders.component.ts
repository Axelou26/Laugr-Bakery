import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminOrderService, AdminOrder, AdminOrderItem } from '../../services/admin-order.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 class="page-title">Gestion des commandes</h1>
    @if (loading) {
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>
    } @else if (orders.length === 0) {
      <div class="empty-state">
        <p>Aucune commande pour le moment.</p>
      </div>
    } @else {
      <div class="orders-table">
        @for (order of orders; track order.id) {
          <article class="order-card">
            <div class="order-header">
              <div>
                <span class="order-id">#{{ order.id }}</span>
                <span class="customer">{{ order.customerName || 'Client' }} – {{ order.customerEmail }}</span>
              </div>
              <div class="status-control">
                <select [value]="order.status" (change)="onStatusChange(order.id, $event)">
                  <option value="PENDING">En attente</option>
                  <option value="CONFIRMED">Confirmée</option>
                  <option value="SHIPPED">Expédiée</option>
                  <option value="DELIVERED">Livrée</option>
                  <option value="CANCELLED">Annulée</option>
                </select>
              </div>
            </div>
            <p class="order-date">{{ order.createdAt | date:'dd/MM/yyyy à HH:mm' }}</p>
            @if (order.deliveryDate) {
              <p class="delivery-date">📅 Livraison prévue : {{ order.deliveryDate | date:'dd/MM/yyyy' }}</p>
            }
            <span class="payment-badge" [class.paypal]="order.paymentMethod === 'PAYPAL'">
              {{ order.paymentMethod === 'PAYPAL' ? '🅿️ PayPal' : '💵 À la livraison' }}
            </span>
            <p class="shipping"><strong>Livraison / retrait :</strong> {{ order.shippingAddress }}</p>
            <ul class="order-items">
              @for (item of order.items; track item.cookieId + '-' + item.unitPrice) {
                <li>
                  {{ formatOrderItemLabel(item) }} x {{ item.quantity }} – {{
                    item.unitPrice * item.quantity | number:'1.2-2'
                  }}
                  €
                </li>
              }
            </ul>
            <div class="order-total">Total : <strong>{{ order.totalAmount | number:'1.2-2' }} €</strong></div>
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
    .orders-table { display: flex; flex-direction: column; gap: 1.25rem; }
    .order-card {
      background: var(--color-surface-elevated);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      border: 1px solid var(--color-border);
    }
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .order-id { font-weight: 700; font-size: 1.1rem; margin-right: 0.5rem; }
    .customer { font-size: 0.95rem; color: var(--color-text-muted); }
    .status-control select {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-size: 0.9rem;
      cursor: pointer;
    }
    .delivery-date { font-size: 0.9rem; color: var(--color-primary); margin: 0.25rem 0; }
    .order-date, .shipping {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      margin: 0.5rem 0;
    }
    .payment-badge {
      display: inline-block;
      font-size: 0.8rem;
      padding: 0.25rem 0.5rem;
      background: var(--color-border);
      border-radius: var(--radius-sm);
      margin: 0.25rem 0;
    }
    .payment-badge.paypal {
      background: #f0f7ff;
      color: #003087;
    }
    .order-items {
      list-style: none;
      padding: 0;
      margin: 0.75rem 0;
    }
    .order-items li {
      padding: 0.35rem 0;
      font-size: 0.95rem;
    }
    .order-total {
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
    }
    @media (max-width: 768px) {
      .order-header { flex-wrap: wrap; gap: 0.75rem; }
      .order-card { padding: 1rem; }
    }
  `]
})
export class AdminOrdersComponent implements OnInit {
  orders: AdminOrder[] = [];
  loading = true;

  constructor(
    private adminOrderService: AdminOrderService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.adminOrderService.getAllOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.message || 'Erreur lors du chargement des commandes');
      }
    });
  }

  onStatusChange(orderId: number, event: Event) {
    const status = (event.target as HTMLSelectElement).value;
    this.adminOrderService.updateStatus(orderId, status).subscribe({
      next: (updated) => {
        const idx = this.orders.findIndex((o) => o.id === orderId);
        if (idx >= 0) this.orders[idx] = updated;
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Erreur lors de la mise à jour');
      }
    });
  }

  formatOrderItemLabel(item: AdminOrderItem): string {
    const name = item.cookieName ?? '';
    const lower = name.toLowerCase();
    const isBol = item.unitPrice >= 5;

    if (isBol) {
      // Si le nom contient déjà “bol” / “mi-cuit”, on évite la duplication.
      if (lower.includes('bol') || lower.includes('mi-cuit')) return name;
      return `🥣 Bol mi-cuit : ${name}`;
    }

    // Box (6 cookies) : même logique anti-duplication.
    if (lower.includes('box')) return name;
    return `🍪 Box (6 cookies) : ${name}`;
  }
}
