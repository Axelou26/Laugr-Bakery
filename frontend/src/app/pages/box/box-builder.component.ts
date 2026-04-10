import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CookieService } from '../../services/cookie.service';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service';
import { Cookie } from '../../models/cookie.model';
import { ShopStatusService } from '../../services/shop-status.service';

const BOX_SIZE = 6;
const BOX_PRICE = 18;

@Component({
  selector: 'app-box-builder',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h1 class="page-title">📦 Composer ma box de 6 cookies</h1>
    <p class="intro">Choisissez les cookies de votre choix pour composer une box personnalisée. <strong>{{ BOX_PRICE }} €</strong> la box.</p>

    @if (loading) {
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Chargement des cookies...</p>
      </div>
    } @else {
      <div class="box-builder">
        <div class="progress-bar">
          <span class="progress-label">{{ totalSelected() }} / {{ BOX_SIZE }} cookies</span>
          <div class="progress-track">
            <div class="progress-fill" [style.width.%]="(totalSelected() / BOX_SIZE) * 100"></div>
          </div>
          @if (totalSelected() !== BOX_SIZE) {
            <span class="hint">Il vous reste {{ BOX_SIZE - totalSelected() }} cookie(s) à choisir</span>
          }
        </div>

        <div class="cookies-list">
          @for (cookie of cookies; track cookie.id) {
            @if (cookie.available && cookie.stockQuantity > 0) {
              <div class="cookie-row">
                <div class="cookie-info">
                  @if (cookie.imageUrl) {
                    <img [src]="cookie.imageUrl" [alt]="cookie.name" class="cookie-thumb" />
                  } @else {
                    <span class="placeholder">🍪</span>
                  }
                  <div>
                    <span class="cookie-name">{{ cookie.name }}</span>
                    <span class="cookie-subtitle">Saveur</span>
                  </div>
                </div>
                <div class="qty-controls">
                  <button
                    type="button"
                    class="btn-qty"
                    [disabled]="getQty(cookie.id) <= 0 || !shopStatus.salesOpen()"
                    (click)="setQty(cookie.id, getQty(cookie.id) - 1)"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    [value]="getQty(cookie.id)"
                    (change)="onQtyChange(cookie.id, $event)"
                    [disabled]="!shopStatus.salesOpen()"
                    min="0"
                    [max]="BOX_SIZE"
                    class="qty-input"
                  />
                  <button
                    type="button"
                    class="btn-qty"
                    [disabled]="getQty(cookie.id) >= BOX_SIZE || totalSelected() >= BOX_SIZE || !shopStatus.salesOpen()"
                    (click)="setQty(cookie.id, getQty(cookie.id) + 1)"
                  >
                    +
                  </button>
                </div>
              </div>
            }
          }
        </div>

        <div class="actions">
          <button
            type="button"
            class="btn-add-box"
            [disabled]="totalSelected() !== BOX_SIZE || !shopStatus.salesOpen()"
            (click)="addBoxToCart()"
          >
            {{
              !shopStatus.salesOpen()
                ? 'Ventes fermées'
                : totalSelected() === BOX_SIZE
                  ? '📦 Ajouter la box au panier'
                  : 'Choisissez encore ' + (BOX_SIZE - totalSelected()) + ' cookie(s)'
            }}
          </button>
          <a routerLink="/cookies" class="btn-back">← Retour au catalogue</a>
        </div>
      </div>
    }
  `,
  styles: [`
    .intro {
      color: var(--color-text-muted);
      margin-bottom: 1.5rem;
      font-size: 1.05rem;
    }
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
    .box-builder {
      max-width: 600px;
    }
    .progress-bar {
      background: var(--color-surface-elevated);
      padding: 1.25rem;
      border-radius: var(--radius-lg);
      margin-bottom: 1.5rem;
      border: 1px solid var(--color-border);
    }
    .progress-label {
      font-weight: 600;
      display: block;
      margin-bottom: 0.5rem;
    }
    .progress-track {
      height: 8px;
      background: var(--color-border);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      transition: width 0.3s ease;
    }
    .hint {
      font-size: 0.9rem;
      color: var(--color-text-muted);
    }
    .cookies-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .cookie-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      background: var(--color-surface-elevated);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
    }
    .cookie-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .cookie-thumb {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: var(--radius-sm);
    }
    .placeholder {
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      background: var(--color-border);
      border-radius: var(--radius-sm);
    }
    .cookie-name { font-weight: 600; display: block; }
    .cookie-subtitle { font-size: 0.9rem; color: var(--color-text-muted); display: block; }
    .qty-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-qty {
      width: 36px;
      height: 36px;
      border: 1px solid var(--color-border);
      background: white;
      border-radius: var(--radius-sm);
      font-size: 1.2rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-qty:hover:not(:disabled) {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }
    .btn-qty:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .qty-input {
      width: 50px;
      padding: 0.5rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      text-align: center;
      font-size: 1rem;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .btn-add-box {
      padding: 1rem 2rem;
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-weight: 600;
      font-size: 1.1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-add-box:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.35);
    }
    .btn-add-box:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .btn-back {
      text-align: center;
      color: var(--color-primary);
      font-weight: 500;
      text-decoration: none;
    }
    .btn-back:hover { text-decoration: underline; }
    @media (max-width: 600px) {
      .cookie-row { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .qty-controls { width: 100%; justify-content: flex-end; }
    }
  `]
})
export class BoxBuilderComponent implements OnInit {
  readonly BOX_SIZE = BOX_SIZE;
  readonly BOX_PRICE = BOX_PRICE;
  cookies: Cookie[] = [];
  loading = true;
  private selections = signal<Record<number, number>>({});

  constructor(
    private cookieService: CookieService,
    private cartService: CartService,
    private toast: ToastService,
    public shopStatus: ShopStatusService
  ) {}

  ngOnInit() {
    this.shopStatus.loadStatus().subscribe();
    this.cookieService.search({
      availableOnly: true
    }).subscribe({
      next: (data) => {
        this.cookies = data;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  totalSelected = computed(() =>
    Object.values(this.selections()).reduce((s, q) => s + q, 0)
  );

  getQty(cookieId: number): number {
    return this.selections()[cookieId] ?? 0;
  }

  setQty(cookieId: number, qty: number) {
    const clamped = Math.max(0, Math.min(BOX_SIZE, qty));
    this.selections.update((s) => ({ ...s, [cookieId]: clamped }));
  }

  onQtyChange(cookieId: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10);
    if (!isNaN(val)) this.setQty(cookieId, val);
  }

  addBoxToCart() {
    if (!this.shopStatus.salesOpen()) {
      this.toast.warning('Les ventes sont actuellement fermées');
      return;
    }
    if (this.totalSelected() !== BOX_SIZE) return;

    const items = this.cookies
      .filter((c) => this.getQty(c.id) > 0)
      .map((c) => ({
        cookieId: c.id,
        cookieName: c.name,
        quantity: this.getQty(c.id),
        unitPrice: c.price
      }));

    const wouldExceed = items.some((i) => {
      const stock = this.cookies.find((c) => c.id === i.cookieId)?.stockQuantity ?? 0;
      const alreadyInCart = this.cartService.getQuantityForCookie(i.cookieId);
      return alreadyInCart + i.quantity > stock;
    });
    if (wouldExceed) {
      this.toast.error('Stock insuffisant pour certains cookies de la box');
      return;
    }

    const ok = this.cartService.addBox(items);
    if (ok) {
      this.toast.success('Box de 6 cookies ajoutée au panier !');
      this.selections.set({});
    } else {
      this.toast.error('La box doit contenir exactement 6 cookies');
    }
  }
}
