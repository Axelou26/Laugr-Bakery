import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CookieService } from '../../services/cookie.service';
import { Cookie } from '../../models/cookie.model';
import { ShopStatusService } from '../../services/shop-status.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <h1 class="page-title">Tableau de bord</h1>

    <div class="sales-control">
      <div class="sales-info">
        <strong>État des ventes :</strong>
        <span [class.open]="shopStatus.salesOpen()" [class.closed]="!shopStatus.salesOpen()">
          {{ shopStatus.salesOpen() ? 'OUVERTES' : 'FERMÉES' }}
        </span>
      </div>
      <button type="button" class="btn-toggle-sales" (click)="toggleSales()">
        {{ shopStatus.salesOpen() ? 'Fermer les ventes' : 'Ouvrir les ventes' }}
      </button>
    </div>
    <div class="opening-control">
      <label for="openingAt"><strong>Prochaine ouverture prévue :</strong></label>
      <div class="opening-actions">
        <input id="openingAt" type="datetime-local" [(ngModel)]="nextOpeningAtInput" />
        <button type="button" class="btn-toggle-sales" (click)="saveNextOpening()">
          Enregistrer la date
        </button>
        <button type="button" class="btn-clear-date" (click)="clearNextOpening()">
          Effacer
        </button>
      </div>
      @if (shopStatus.nextOpeningAt()) {
        <p class="opening-preview">Actuel : {{ formatDate(shopStatus.nextOpeningAt()) }}</p>
      }
    </div>
    <div class="opening-control">
      <label for="slotInsep"><strong>Créneaux livraison INSEP (date + heure) :</strong></label>
      <div class="opening-actions">
        <input id="slotInsep" type="datetime-local" [(ngModel)]="deliverySlotInputInsep" />
        <button type="button" class="btn-toggle-sales" (click)="addInsepSlot()">Ajouter le créneau</button>
        <button type="button" class="btn-toggle-sales" (click)="saveAllSlots()">Enregistrer tout</button>
      </div>
      @if (exactDeliverySlotsInsep.length > 0) {
        <div class="date-chips">
          @for (slot of exactDeliverySlotsInsep; track slot) {
            <button type="button" class="date-chip" (click)="removeInsepSlot(slot)">
              {{ formatSlotLabel(slot) }} ✕
            </button>
          }
        </div>
      }
      <p class="opening-preview">
        Proposés au panier lorsque le client choisit « Livré à l'INSEP ». Chaque ligne est un créneau précis.
      </p>
    </div>
    <div class="opening-control">
      <label for="slotPickup"><strong>Créneaux retrait « à emporter » (date + heure) :</strong></label>
      <div class="opening-actions">
        <input id="slotPickup" type="datetime-local" [(ngModel)]="deliverySlotInputPickup" />
        <button type="button" class="btn-toggle-sales" (click)="addPickupSlot()">Ajouter le créneau</button>
        <button type="button" class="btn-toggle-sales" (click)="saveAllSlots()">Enregistrer tout</button>
      </div>
      @if (exactDeliverySlotsPickup.length > 0) {
        <div class="date-chips">
          @for (slot of exactDeliverySlotsPickup; track slot) {
            <button type="button" class="date-chip" (click)="removePickupSlot(slot)">
              {{ formatSlotLabel(slot) }} ✕
            </button>
          }
        </div>
      }
      <p class="opening-preview">
        Proposés au panier pour le retrait au 37 avenue Boileau. Indépendants des créneaux INSEP.
      </p>
    </div>

    @if (lowStockCookies.length > 0) {
      <div class="alert-low-stock">
        <span class="alert-icon">⚠️</span>
        <div>
          <strong>Stock faible</strong> — {{ lowStockCookies.length }} cookie(s) à réapprovisionner :
          @for (c of lowStockCookies; track c.id) {
            <a [routerLink]="['/admin/cookies']" class="alert-link">{{ c.name }} ({{ c.stockQuantity }})</a>{{ $last ? '' : ', ' }}
          }
        </div>
      </div>
    }

    <div class="dashboard-cards">
      <a routerLink="/admin/cookies" class="dashboard-card">
        <span class="card-icon">🍪</span>
        <h3>Gérer les cookies</h3>
        <p>Ajouter, modifier ou supprimer les cookies en vente</p>
      </a>
      <a routerLink="/admin/commandes" class="dashboard-card">
        <span class="card-icon">📦</span>
        <h3>Gérer les commandes</h3>
        <p>Voir et mettre à jour le statut des commandes</p>
      </a>
      <a routerLink="/admin/codes-promo" class="dashboard-card">
        <span class="card-icon">🏷️</span>
        <h3>Codes promo</h3>
        <p>Créer des remises pour le panier client</p>
      </a>
    </div>
  `,
  styles: [`
    .dashboard-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .sales-control {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
      padding: 1rem 1.25rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface-elevated);
    }
    .sales-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .sales-info span.open { color: #0f9d58; font-weight: 700; }
    .sales-info span.closed { color: #c62828; font-weight: 700; }
    .btn-toggle-sales {
      border: 1px solid var(--color-border);
      background: white;
      border-radius: var(--radius-md);
      padding: 0.6rem 1rem;
      cursor: pointer;
      font-weight: 600;
    }
    .btn-toggle-sales:hover { background: var(--color-bg-warm); }
    .opening-control {
      margin-bottom: 1.5rem;
      padding: 1rem 1.25rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface-elevated);
    }
    .opening-actions {
      margin-top: 0.5rem;
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .opening-actions input {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 0.45rem 0.6rem;
      font-family: var(--font-sans);
    }
    .btn-clear-date {
      border: 1px solid var(--color-border);
      background: transparent;
      border-radius: var(--radius-md);
      padding: 0.6rem 1rem;
      cursor: pointer;
      font-weight: 500;
    }
    .opening-preview {
      margin-top: 0.6rem;
      color: var(--color-text-muted);
      font-size: 0.9rem;
    }
    .date-chips {
      margin-top: 0.75rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .date-chip {
      border: 1px solid var(--color-border);
      background: #fff;
      border-radius: 999px;
      padding: 0.4rem 0.75rem;
      cursor: pointer;
      font-family: var(--font-sans);
      font-size: 0.9rem;
      color: var(--color-text);
    }
    .date-chip:hover {
      background: var(--color-bg-warm);
    }
    .dashboard-card {
      display: block;
      padding: 2rem;
      background: var(--color-surface-elevated);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      transition: all 0.2s;
    }
    .dashboard-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .card-icon { font-size: 2.5rem; display: block; margin-bottom: 1rem; }
    .dashboard-card h3 {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 0.5rem;
    }
    .dashboard-card p {
      font-size: 0.95rem;
      color: var(--color-text-muted);
    }
    .alert-low-stock {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: #fef3c7;
      border: 1px solid var(--color-warning);
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
    }
    .alert-icon { font-size: 1.5rem; }
    .alert-low-stock strong { color: #92400e; }
    .alert-link {
      color: var(--color-primary-dark);
      font-weight: 500;
    }
    .alert-link:hover { text-decoration: underline; }
    @media (max-width: 600px) {
      .dashboard-cards { grid-template-columns: 1fr; }
      .alert-low-stock { flex-direction: column; gap: 0.5rem; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  lowStockCookies: Cookie[] = [];
  nextOpeningAtInput = '';
  deliverySlotInputInsep = '';
  deliverySlotInputPickup = '';
  exactDeliverySlotsInsep: string[] = [];
  exactDeliverySlotsPickup: string[] = [];

  constructor(
    private cookieService: CookieService,
    public shopStatus: ShopStatusService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.cookieService.getLowStock(10).subscribe({
      next: (cookies) => (this.lowStockCookies = cookies),
      error: () => {
        this.lowStockCookies = [];
        this.toast.warning('Impossible de charger les alertes de stock pour le moment');
      }
    });
    this.shopStatus.loadStatus().subscribe({
      next: () => {
        const current = this.shopStatus.nextOpeningAt();
        this.nextOpeningAtInput = current ? current.slice(0, 16) : '';
        this.exactDeliverySlotsInsep = [...this.shopStatus.deliveryDatesInsep()];
        this.exactDeliverySlotsPickup = [...this.shopStatus.deliveryDatesPickup()];
      }
    });
  }

  toggleSales() {
    const nextState = !this.shopStatus.salesOpen();
    this.shopStatus
      .updateStatus(nextState, this.toIsoOrNull(this.nextOpeningAtInput), this.exactDeliverySlotsInsep, this.exactDeliverySlotsPickup)
      .subscribe({
      next: () => this.toast.success(nextState ? 'Ventes ouvertes' : 'Ventes fermées'),
      error: (err) => this.toast.error(err.error?.message || 'Impossible de modifier le statut des ventes')
    });
  }

  saveNextOpening() {
    this.shopStatus
      .updateStatus(this.shopStatus.salesOpen(), this.toIsoOrNull(this.nextOpeningAtInput), this.exactDeliverySlotsInsep, this.exactDeliverySlotsPickup)
      .subscribe({
      next: () => {
        const current = this.shopStatus.nextOpeningAt();
        this.nextOpeningAtInput = current ? current.slice(0, 16) : '';
        this.toast.success('Date d\'ouverture enregistrée');
      },
      error: (err) => this.toast.error(err.error?.message || 'Impossible d\'enregistrer la date')
    });
  }

  clearNextOpening() {
    this.nextOpeningAtInput = '';
    this.shopStatus
      .updateStatus(this.shopStatus.salesOpen(), null, this.exactDeliverySlotsInsep, this.exactDeliverySlotsPickup)
      .subscribe({
      next: () => this.toast.success('Date d\'ouverture effacée'),
      error: (err) => this.toast.error(err.error?.message || 'Impossible d\'effacer la date')
    });
  }

  private toApiSlot(isoLocal: string): string {
    const v = isoLocal.trim();
    if (!v) return '';
    if (v.length === 16) return `${v}:00`;
    return v;
  }

  addInsepSlot() {
    if (!this.deliverySlotInputInsep) {
      this.toast.warning('Choisis un créneau (date et heure)');
      return;
    }
    const slot = this.toApiSlot(this.deliverySlotInputInsep);
    if (this.exactDeliverySlotsInsep.includes(slot)) {
      this.toast.warning('Ce créneau est déjà ajouté');
      return;
    }
    const next = [...this.exactDeliverySlotsInsep, slot].sort();
    this.deliverySlotInputInsep = '';
    this.persistSlots(next, this.exactDeliverySlotsPickup, false);
  }

  removeInsepSlot(slot: string) {
    this.persistSlots(
      this.exactDeliverySlotsInsep.filter((s) => s !== slot),
      this.exactDeliverySlotsPickup,
      false
    );
  }

  addPickupSlot() {
    if (!this.deliverySlotInputPickup) {
      this.toast.warning('Choisis un créneau (date et heure)');
      return;
    }
    const slot = this.toApiSlot(this.deliverySlotInputPickup);
    if (this.exactDeliverySlotsPickup.includes(slot)) {
      this.toast.warning('Ce créneau est déjà ajouté');
      return;
    }
    const next = [...this.exactDeliverySlotsPickup, slot].sort();
    this.deliverySlotInputPickup = '';
    this.persistSlots(this.exactDeliverySlotsInsep, next, false);
  }

  removePickupSlot(slot: string) {
    this.persistSlots(
      this.exactDeliverySlotsInsep,
      this.exactDeliverySlotsPickup.filter((s) => s !== slot),
      false
    );
  }

  saveAllSlots() {
    this.persistSlots(this.exactDeliverySlotsInsep, this.exactDeliverySlotsPickup, true);
  }

  private persistSlots(insep: string[], pickup: string[], showSuccessToast: boolean) {
    const prevInsep = [...this.exactDeliverySlotsInsep];
    const prevPickup = [...this.exactDeliverySlotsPickup];
    this.exactDeliverySlotsInsep = [...insep].sort();
    this.exactDeliverySlotsPickup = [...pickup].sort();
    this.shopStatus
      .updateStatus(this.shopStatus.salesOpen(), this.toIsoOrNull(this.nextOpeningAtInput), this.exactDeliverySlotsInsep, this.exactDeliverySlotsPickup)
      .subscribe({
        next: () => {
          this.exactDeliverySlotsInsep = [...this.shopStatus.deliveryDatesInsep()];
          this.exactDeliverySlotsPickup = [...this.shopStatus.deliveryDatesPickup()];
          if (showSuccessToast) {
            this.toast.success('Créneaux enregistrés');
          }
        },
        error: (err) => {
          this.exactDeliverySlotsInsep = prevInsep;
          this.exactDeliverySlotsPickup = prevPickup;
          this.toast.error(err.error?.message || 'Impossible d\'enregistrer les créneaux');
        }
      });
  }

  formatSlotLabel(value: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(value: string | null): string {
    if (!value) return '';
    return new Date(value).toLocaleString('fr-FR');
  }

  private toIsoOrNull(value: string): string | null {
    return value || null;
  }
}
