import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  effect,
  untracked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { OrderService, PaymentMethod } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { FormsModule } from '@angular/forms';
import { ShopStatusService } from '../../services/shop-status.service';
import { environment } from '../../../environments/environment';
import { PromoCodeService } from '../../services/promo-code.service';

const PROMO_SESSION_KEY = 'laugr-cart-promo';

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        style?: { layout: string; color: string };
      }) => { render: (el: HTMLElement) => Promise<void> };
    };
  }
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <h1 class="page-title">Mon panier</h1>
    @if (cartService.items().length === 0) {
      <div class="empty-state">
        <p class="empty-icon">🛒</p>
        <p>Votre panier est vide.</p>
        <div class="empty-actions">
          <a routerLink="/cookies" class="btn-primary">Découvrir nos cookies</a>
          <a routerLink="/box" class="btn-secondary">📦 Composer une box</a>
          <a routerLink="/bol" class="btn-secondary">🥣 Découvrir nos bols</a>
        </div>
      </div>
    } @else {
      <div class="cart-layout">
        <div class="cart-items">
          @for (entry of cartService.items(); track entry.type === 'cookie' ? 'c-' + entry.cookieId : 'b-' + entry.boxId) {
            @if (entry.type === 'cookie') {
              <div class="cart-item">
                <div class="item-info">
                  <span class="item-name">{{ entry.cookieName }}</span>
                  <span class="item-price">{{ entry.unitPrice | number:'1.2-2' }} € / u.</span>
                </div>
                <div class="item-actions">
                  <input type="number" [ngModel]="entry.quantity" (ngModelChange)="updateQty(entry.cookieId, $event)"
                         min="1" class="qty-input" />
                  <span class="subtotal">{{ entry.subtotal | number:'1.2-2' }} €</span>
                  <button type="button" (click)="remove(entry.cookieId)" class="btn-remove">Retirer</button>
                </div>
              </div>
            } @else {
              <div class="cart-item cart-item-box">
                <div class="item-info">
                  <span class="item-name">📦 Box personnalisée (6 cookies)</span>
                  <ul class="box-items">
                    @for (it of entry.items; track it.cookieId) {
                      <li>{{ it.cookieName }} x {{ it.quantity }}</li>
                    }
                  </ul>
                </div>
                <div class="item-actions">
                  <span class="subtotal">{{ entry.subtotal | number:'1.2-2' }} €</span>
                  <button type="button" (click)="removeBox(entry.boxId)" class="btn-remove">Retirer</button>
                </div>
              </div>
            }
          }
        </div>
        <div class="cart-summary">
          <div class="promo-block">
            @if (appliedPromoCode) {
              <div class="promo-applied">
                <span>Code <strong>{{ appliedPromoCode }}</strong> appliqué</span>
                <button type="button" class="btn-remove-promo" (click)="removePromo()">Retirer</button>
              </div>
            } @else {
              <label class="promo-label">Code promo</label>
              <div class="promo-row">
                <input
                  type="text"
                  [(ngModel)]="promoInput"
                  class="promo-input"
                  placeholder="Ex : ETE2026"
                  autocomplete="off"
                  (keyup.enter)="applyPromo()"
                />
                <button type="button" class="btn-apply-promo" (click)="applyPromo()" [disabled]="promoBusy">
                  {{ promoBusy ? '…' : 'Appliquer' }}
                </button>
              </div>
            }
          </div>
          <div class="summary-row">
            <span>Sous-total</span>
            <span>{{ cartService.totalPrice() | number:'1.2-2' }} €</span>
          </div>
          @if (promoDiscount > 0 && appliedPromoCode) {
            <div class="summary-row discount-row">
              <span>Remise ({{ appliedPromoCode }})</span>
              <span>−{{ promoDiscount | number:'1.2-2' }} €</span>
            </div>
          }
          <div class="summary-row total-row">
            <span>Total</span>
            <strong>{{ cartTotalAfterPromo() | number:'1.2-2' }} €</strong>
          </div>
          @if (!checkoutMode) {
            <button class="btn-checkout" [disabled]="checkoutButtonDisabled()" (click)="goToCheckout()">
              {{ checkoutButtonText() }}
            </button>
          } @else {
            <div class="checkout-form">
              <label>Mode de livraison *</label>
              <div class="fulfillment-options">
                <label class="payment-option">
                  <input type="radio" name="fulfillment" [(ngModel)]="shippingAddress" [value]="fulfillmentInsep" (ngModelChange)="onFulfillmentChange()" />
                  <span>📍 Livré à l'INSEP</span>
                </label>
                <label class="payment-option">
                  <input type="radio" name="fulfillment" [(ngModel)]="shippingAddress" [value]="fulfillmentPickup" (ngModelChange)="onFulfillmentChange()" />
                  <span class="pickup-label">🥡 {{ fulfillmentPickup }}</span>
                </label>
              </div>

              <label>{{ deliverySlotFieldLabel() }} <span class="hint-text">(créneaux définis par la boutique)</span></label>
              @if (availableDeliveryDates.length === 0) {
                <p class="delivery-warning">{{ emptySlotsMessage() }}</p>
              } @else {
                <select [(ngModel)]="deliveryDate" class="delivery-select" required>
                  <option value="">Choisir un créneau</option>
                  @for (opt of availableDeliveryDates; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              }

              <label class="payment-label">Méthode de paiement</label>
              <div class="payment-options">
                <label class="payment-option">
                  <input type="radio" name="payment" [ngModel]="paymentMethod" (ngModelChange)="onPaymentChange($event)" value="PAY_ON_DELIVERY" />
                  <span>💵 Paiement à la livraison</span>
                </label>
                @if (paypalEnabled) {
                  <label class="payment-option">
                    <input type="radio" name="payment" [ngModel]="paymentMethod" (ngModelChange)="onPaymentChange($event)" value="PAYPAL" />
                    <span>🅿️ PayPal</span>
                  </label>
                }
              </div>

              @if (paymentMethod === 'PAY_ON_DELIVERY') {
                <div class="form-actions">
                  <button type="button" (click)="placeOrder()" class="btn-primary" [disabled]="placing">
                    {{ placing ? 'En cours...' : 'Confirmer la commande' }}
                  </button>
                  <button type="button" (click)="cancelCheckout()" class="btn-secondary">Annuler</button>
                </div>
              }
              @if (paymentMethod === 'PAYPAL' && paypalEnabled) {
                <div class="paypal-section">
                  <p class="paypal-hint">Cliquez sur le bouton PayPal pour finaliser le paiement</p>
                  <div #paypalContainer class="paypal-container"></div>
                  <button type="button" (click)="cancelCheckout()" class="btn-secondary btn-cancel-paypal">Annuler</button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.5; }
    .empty-actions { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-top: 1rem; }
    .cart-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 2rem;
      align-items: start;
    }
    .cart-items {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .cart-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem;
      background: var(--color-surface-elevated);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border);
    }
    .cart-item-box .box-items {
      list-style: none;
      padding: 0;
      margin: 0.5rem 0 0;
      font-size: 0.9rem;
      color: var(--color-text-muted);
    }
    .cart-item-box .box-items li { padding: 0.15rem 0; }
    .item-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .item-name { font-weight: 600; color: var(--color-text); }
    .item-price { font-size: 0.9rem; color: var(--color-text-muted); }
    .item-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .qty-input {
      width: 70px;
      padding: 0.5rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 1rem;
      text-align: center;
    }
    .subtotal { font-weight: 700; min-width: 60px; text-align: right; }
    .btn-remove {
      padding: 0.35rem 0.75rem;
      background: transparent;
      color: var(--color-error);
      border: 1px solid var(--color-error);
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-remove:hover {
      background: var(--color-error);
      color: white;
    }
    .cart-summary {
      background: var(--color-surface-elevated);
      padding: 1.5rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      border: 1px solid var(--color-border);
      position: sticky;
      top: 100px;
    }
    .promo-block {
      margin-bottom: 0.75rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-border);
    }
    .promo-label { font-weight: 600; margin-bottom: 0.5rem; display: block; color: var(--color-text); }
    .promo-row { display: flex; gap: 0.5rem; }
    .promo-input {
      flex: 1;
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      text-transform: uppercase;
    }
    .btn-apply-promo {
      padding: 0.6rem 0.9rem;
      border: none;
      border-radius: var(--radius-md);
      background: var(--color-text);
      color: white;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .btn-apply-promo:disabled { opacity: 0.6; cursor: not-allowed; }
    .promo-applied {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.95rem;
    }
    .btn-remove-promo {
      padding: 0.35rem 0.65rem;
      font-size: 0.85rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: white;
      cursor: pointer;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 1rem 0;
      font-size: 1.15rem;
    }
    .discount-row { font-size: 1rem; color: #0f7a3e; }
    .total-row { border-top: 1px solid var(--color-border); margin-top: 0.25rem; padding-top: 1rem; }
    .btn-checkout {
      width: 100%;
      margin-top: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-checkout:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.35);
    }
    .checkout-form label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--color-text);
    }
    .hint-text { font-weight: normal; color: var(--color-text-muted); font-size: 0.9rem; }
    .fulfillment-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 0.5rem 0 1rem;
    }
    .delivery-warning {
      font-size: 0.95rem;
      color: var(--color-text-muted);
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: var(--color-bg-warm);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
    }
    .delivery-select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-size: 1rem;
      margin-bottom: 1rem;
    }
    .form-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .btn-secondary {
      padding: 0.75rem;
      background: var(--color-border);
      color: var(--color-text-muted);
      border: none;
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-size: 0.95rem;
      cursor: pointer;
    }
    .btn-secondary:hover { background: #ddd; }
    .payment-label { margin-top: 1rem; }
    .payment-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 0.75rem 0;
    }
    .payment-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
    }
    .payment-option:hover { background: var(--color-bg-warm); }
    .pickup-label { white-space: normal; line-height: 1.35; }
    .paypal-section { margin-top: 1rem; }
    .paypal-hint { font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 0.75rem; }
    .paypal-container { min-height: 45px; margin-bottom: 1rem; }
    .btn-cancel-paypal { margin-top: 0.5rem; }
    @media (max-width: 768px) {
      .cart-layout { grid-template-columns: 1fr; gap: 1.5rem; }
      .cart-item { flex-direction: column; align-items: flex-start; gap: 1rem; padding: 1rem; }
      .item-actions { width: 100%; justify-content: space-between; flex-wrap: wrap; }
      .cart-summary { position: static; padding: 1.25rem; }
    }
    @media (max-width: 480px) {
      .cart-item { padding: 0.75rem; }
      .item-actions { flex-direction: column; align-items: flex-start; }
      .qty-input { width: 100%; }
    }
  `]
})
export class CartComponent implements OnInit, OnDestroy {
  @ViewChild('paypalContainer', { static: false }) paypalContainer!: ElementRef<HTMLDivElement>;

  checkoutMode = false;
  readonly fulfillmentInsep = "Livré à l'INSEP";
  /** Valeur enregistrée sur la commande (adresse de retrait). */
  readonly fulfillmentPickup =
    'À emporter — 37 avenue Boileau, 94500 Champigny-sur-Marne';
  shippingAddress = "Livré à l'INSEP";
  deliveryDate = '';
  paymentMethod: PaymentMethod = 'PAY_ON_DELIVERY';
  availableDeliveryDates: { value: string; label: string }[] = [];
  paypalEnabled = false;
  paypalClientId = '';
  placing = false;
  private paypalRendered = false;

  promoInput = '';
  appliedPromoCode: string | null = null;
  promoDiscount = 0;
  promoBusy = false;

  constructor(
    public cartService: CartService,
    private orderService: OrderService,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
    public shopStatus: ShopStatusService,
    private promoCodeService: PromoCodeService
  ) {
    effect(() => {
      if (this.cartService.items().length === 0) {
        untracked(() => this.clearPromoLocal());
      }
    });
  }

  cartTotalAfterPromo(): number {
    const sub = this.cartService.totalPrice();
    return Math.max(0, Math.round((sub - this.promoDiscount) * 100) / 100);
  }

  private persistPromo(): void {
    try {
      if (this.appliedPromoCode) {
        sessionStorage.setItem(PROMO_SESSION_KEY, JSON.stringify({ code: this.appliedPromoCode }));
      } else {
        sessionStorage.removeItem(PROMO_SESSION_KEY);
      }
    } catch {
      /* ignore */
    }
  }

  private clearPromoLocal(): void {
    this.promoInput = '';
    this.appliedPromoCode = null;
    this.promoDiscount = 0;
    this.persistPromo();
  }

  private loadPromoFromSession(): void {
    try {
      const raw = sessionStorage.getItem(PROMO_SESSION_KEY);
      if (!raw) return;
      const o = JSON.parse(raw) as { code?: string };
      if (o.code?.trim()) {
        this.appliedPromoCode = o.code.trim().toUpperCase();
        this.refreshPromoAgainstCart(false);
      }
    } catch {
      sessionStorage.removeItem(PROMO_SESSION_KEY);
    }
  }

  /** Revalide le code avec le sous-total actuel (panier). */
  refreshPromoAgainstCart(showToast: boolean): void {
    if (!this.appliedPromoCode) return;
    const sub = this.cartService.totalPrice();
    this.promoCodeService.validate(this.appliedPromoCode, sub).subscribe({
      next: (r) => {
        if (r.valid && r.discountAmount > 0) {
          this.promoDiscount = Number(r.discountAmount);
          this.persistPromo();
        } else {
          this.clearPromoLocal();
          if (showToast) {
            this.toast.warning(r.message || 'Code promo non applicable');
          }
        }
      },
      error: () => {
        this.clearPromoLocal();
        if (showToast) this.toast.error('Impossible de vérifier le code promo');
      }
    });
  }

  applyPromo(): void {
    const code = (this.promoInput || '').trim();
    if (!code) {
      this.toast.warning('Saisissez un code promo');
      return;
    }
    this.promoBusy = true;
    const sub = this.cartService.totalPrice();
    this.promoCodeService.validate(code, sub).subscribe({
      next: (r) => {
        this.promoBusy = false;
        if (r.valid && r.discountAmount > 0) {
          this.appliedPromoCode = code.toUpperCase();
          this.promoDiscount = Number(r.discountAmount);
          this.promoInput = '';
          this.persistPromo();
          this.toast.success(r.message || 'Code promo appliqué');
        } else {
          this.toast.warning(r.message || 'Code non valide');
        }
      },
      error: () => {
        this.promoBusy = false;
        this.toast.error('Vérification du code impossible');
      }
    });
  }

  removePromo(): void {
    this.clearPromoLocal();
  }


  ngOnInit() {
    this.loadPromoFromSession();
    this.shopStatus.loadStatus().subscribe({
      next: () => {
        this.refreshDeliveryOptions();
      }
    });
    this.refreshPayPalConfig();
  }

  /** Config PayPal : API (prioritaire) + optionnellement environment.paypalClientId. */
  private refreshPayPalConfig(): void {
    this.orderService.getPayPalConfig().subscribe({
      next: (config) => {
        const fromApi = (config.clientId || '').trim();
        const fromEnv = (environment.paypalClientId || '').trim();
        this.paypalClientId = fromApi || fromEnv;
        this.paypalEnabled = config.enabled && !!this.paypalClientId;
        this.schedulePayPalButtonIfNeeded();
      },
      error: () => {
        const fromEnv = (environment.paypalClientId || '').trim();
        this.paypalClientId = fromEnv;
        // Secours si GET /paypal/config échoue (CORS, réseau) : le client ID dans environment suffit pour le SDK.
        this.paypalEnabled = !!fromEnv;
        this.schedulePayPalButtonIfNeeded();
      }
    });
  }

  private schedulePayPalButtonIfNeeded(): void {
    if (this.checkoutMode && this.paymentMethod === 'PAYPAL' && this.paypalEnabled) {
      this.paypalRendered = false;
      setTimeout(() => this.renderPayPalButton(), 100);
    }
  }

  private isPickupSelected(): boolean {
    return (this.shippingAddress || '').includes('À emporter');
  }

  deliverySlotFieldLabel(): string {
    return this.isPickupSelected() ? 'Créneau de retrait *' : 'Créneau de livraison (INSEP) *';
  }

  emptySlotsMessage(): string {
    return this.isPickupSelected()
      ? 'Aucun créneau de retrait disponible pour le moment. Choisis une autre option ou contacte la boutique.'
      : 'Aucun créneau de livraison INSEP disponible pour le moment.';
  }

  onFulfillmentChange(): void {
    this.refreshDeliveryOptions();
    this.schedulePayPalButtonIfNeeded();
  }

  private slotStartMs(iso: string): number {
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? 0 : t;
  }

  private formatSlotLabel(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private rawSlotsForMode(): string[] {
    return this.isPickupSelected() ? this.shopStatus.deliveryDatesPickup() : this.shopStatus.deliveryDatesInsep();
  }

  private getAvailableDeliverySlots(): { value: string; label: string }[] {
    const now = Date.now() - 60_000;
    return this.rawSlotsForMode()
      .filter((iso) => this.slotStartMs(iso) >= now)
      .map((value) => ({ value, label: this.formatSlotLabel(value) }));
  }

  private hasFutureSlots(slots: string[]): boolean {
    const now = Date.now() - 60_000;
    return slots.some((iso) => this.slotStartMs(iso) >= now);
  }

  private canOpenCheckout(): boolean {
    return (
      this.hasFutureSlots(this.shopStatus.deliveryDatesInsep()) ||
      this.hasFutureSlots(this.shopStatus.deliveryDatesPickup())
    );
  }

  private refreshDeliveryOptions(): void {
    this.availableDeliveryDates = this.getAvailableDeliverySlots();
    if (this.availableDeliveryDates.length > 0) {
      const allowed = new Set(this.availableDeliveryDates.map((o) => o.value));
      if (!this.deliveryDate || !allowed.has(this.deliveryDate)) {
        this.deliveryDate = this.availableDeliveryDates[0].value;
      }
    } else {
      this.deliveryDate = '';
    }
  }

  hasDeliverySlots(): boolean {
    return this.getAvailableDeliverySlots().length > 0;
  }

  checkoutButtonDisabled(): boolean {
    return !this.shopStatus.salesOpen() || !this.canOpenCheckout();
  }

  checkoutButtonText(): string {
    if (!this.shopStatus.salesOpen()) return 'Ventes fermées';
    if (!this.canOpenCheckout()) return 'Aucun créneau disponible';
    return 'Passer commande';
  }

  ngOnDestroy() {
    this.paypalRendered = false;
  }

  updateQty(cookieId: number, qty: number) {
    this.cartService.updateQuantity(cookieId, qty);
  }

  remove(cookieId: number) {
    this.cartService.removeItem(cookieId);
  }

  removeBox(boxId: string) {
    this.cartService.removeBox(boxId);
  }

  private isFulfillmentSelected(): boolean {
    const v = this.shippingAddress?.trim();
    return v === this.fulfillmentInsep || v === this.fulfillmentPickup;
  }

  goToCheckout(): void {
    if (!this.shopStatus.salesOpen()) {
      this.toast.warning('Les ventes sont actuellement fermées');
      return;
    }
    if (!this.canOpenCheckout()) {
      this.toast.warning('Aucun créneau de livraison ou de retrait disponible pour le moment');
      return;
    }
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/connexion'], { queryParams: { returnUrl: '/panier' } });
      return;
    }
    if (this.appliedPromoCode) {
      const sub = this.cartService.totalPrice();
      this.promoCodeService.validate(this.appliedPromoCode, sub).subscribe({
        next: (r) => {
          if (r.valid && r.discountAmount > 0) {
            this.promoDiscount = Number(r.discountAmount);
            this.persistPromo();
            this.openCheckoutUi();
          } else {
            this.clearPromoLocal();
            this.toast.warning(r.message || 'Code promo non applicable');
            this.openCheckoutUi();
          }
        },
        error: () => {
          this.clearPromoLocal();
          this.toast.error('Impossible de vérifier le code promo');
          this.openCheckoutUi();
        }
      });
      return;
    }
    this.openCheckoutUi();
  }

  private openCheckoutUi(): void {
    this.checkoutMode = true;
    this.refreshDeliveryOptions();
    this.paypalRendered = false;
    this.refreshPayPalConfig();
  }

  cancelCheckout() {
    this.checkoutMode = false;
    this.paypalRendered = false;
  }

  onPaymentChange(method: PaymentMethod) {
    this.paymentMethod = method;
    this.schedulePayPalButtonIfNeeded();
  }

  private renderPayPalButton() {
    if (!this.paypalContainer?.nativeElement || !this.paypalClientId || this.paypalRendered) return;

    if (window.paypal) {
      this.initPayPalButtons();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(this.paypalClientId)}&currency=EUR&intent=capture&locale=fr_FR&components=buttons`;
    script.async = true;
    script.onload = () => this.initPayPalButtons();
    document.head.appendChild(script);
  }

  private initPayPalButtons() {
    if (!this.paypalContainer?.nativeElement || !window.paypal || this.paypalRendered) return;

    this.paypalContainer.nativeElement.innerHTML = '';

    window.paypal.Buttons({
      createOrder: async () => {
        if (!this.isFulfillmentSelected()) {
          this.toast.warning('Choisissez un mode de livraison ou de retrait');
          throw new Error('Mode de livraison requis');
        }
        if (!this.deliveryDate) {
          this.toast.warning('Veuillez choisir un créneau');
          throw new Error('Créneau requis');
        }
        const { cartItems, boxes } = this.cartService.getItemsForCheckout();
        try {
          const order = await firstValueFrom(
            this.orderService.createOrder(
              cartItems,
              boxes,
              this.shippingAddress,
              this.deliveryDate,
              'PAYPAL',
              this.appliedPromoCode
            )
          );
          return order?.paypalOrderId || '';
        } catch (err: unknown) {
          const e = err as { error?: { message?: string }; message?: string };
          this.toast.error(e.error?.message || e.message || 'Erreur lors de la création');
          throw err;
        }
      },
      onApprove: async (data) => {
        try {
          await firstValueFrom(this.orderService.capturePayPal(data.orderID));
          this.cartService.clear();
          this.clearPromoLocal();
          this.checkoutMode = false;
          this.shippingAddress = this.fulfillmentInsep;
          this.toast.success('Paiement PayPal réussi ! Commande confirmée.');
          this.router.navigate(['/commandes']);
        } catch (err: unknown) {
          const e = err as { error?: { message?: string } };
          this.toast.error(e.error?.message || 'Échec du paiement PayPal');
        }
      },
      style: { layout: 'vertical', color: 'gold' }
    }).render(this.paypalContainer.nativeElement);

    this.paypalRendered = true;
  }

  placeOrder() {
    if (!this.shopStatus.salesOpen()) {
      this.toast.warning('Les ventes sont actuellement fermées');
      return;
    }
    if (!this.isFulfillmentSelected()) {
      this.toast.warning('Choisissez un mode de livraison ou de retrait');
      return;
    }
    if (!this.deliveryDate) {
      this.toast.warning('Veuillez choisir un créneau');
      return;
    }

    this.placing = true;
    const { cartItems, boxes } = this.cartService.getItemsForCheckout();

    this.orderService
      .createOrder(
        cartItems,
        boxes,
        this.shippingAddress,
        this.deliveryDate,
        'PAY_ON_DELIVERY',
        this.appliedPromoCode
      )
      .subscribe({
      next: () => {
        this.cartService.clear();
        this.clearPromoLocal();
        this.checkoutMode = false;
        this.shippingAddress = this.fulfillmentInsep;
        this.placing = false;
        this.toast.success('Commande passée avec succès ! Paiement à la livraison.');
        this.router.navigate(['/commandes']);
      },
      error: (err) => {
        this.placing = false;
        if (err.status === 401) {
          this.router.navigate(['/connexion'], { queryParams: { returnUrl: '/panier' } });
        } else {
          this.toast.error(err.error?.message || err.message || 'Erreur lors de la commande');
        }
      }
    });
  }
}
