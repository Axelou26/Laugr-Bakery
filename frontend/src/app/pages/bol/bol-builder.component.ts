import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BowlService } from '../../services/bowl.service';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service';
import { Bowl } from '../../models/bowl.model';
import { ShopStatusService } from '../../services/shop-status.service';

@Component({
  selector: 'app-bol-builder',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <h1 class="page-title">🥣 Nos bols</h1>
    <div class="intro">
      Le bol mi-cuit, c’est un gros cookie mi-cuit servi en “bol”. Choisissez la saveur, puis ajoutez le bol au panier.
    </div>

    <div class="filters-bar">
      <input
        type="text"
        class="search-input"
        placeholder="Rechercher..."
        [ngModel]="searchTerm"
        (ngModelChange)="onSearch($event)"
      />
    </div>

    @if (loading) {
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>
    } @else if (cookies.length === 0) {
      <div class="empty-state">
        <p>Aucun bol ne correspond à votre recherche.</p>
      </div>
    } @else {
      <div class="cookies-grid">
        @for (cookie of cookies; track cookie.id) {
          <article class="cookie-card">
            <div class="card-image">
              @if (cookie.imageUrl) {
                <img [src]="cookie.imageUrl" [alt]="cookie.name" />
              } @else {
                <span class="placeholder">🍪</span>
              }
            </div>
            <div class="card-content">
              <span class="card-title">{{ cookie.name }}</span>
              <p class="description">{{ cookie.description }}</p>
              <p class="price">{{ cookie.price | number:'1.2-2' }} €</p>

              <button
                class="btn-add"
                [class.btn-add-success]="justAddedId === cookie.id"
                [disabled]="!canAddToCart(cookie) || !shopStatus.salesOpen()"
                (click)="addBowl(cookie)"
              >
                @if (justAddedId === cookie.id) {
                  <span class="btn-check">✓</span>
                  <span>Bol ajouté !</span>
                } @else if (!shopStatus.salesOpen()) {
                  <span>Ventes fermées</span>
                } @else {
                  <span>Ajouter le bol</span>
                }
              </button>
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
    .intro {
      color: var(--color-text-muted);
      margin-bottom: 1.5rem;
      font-size: 1.05rem;
    }
    .filters-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      margin-bottom: 2rem;
    }
    .search-input {
      flex: 1;
      min-width: 200px;
      padding: 0.6rem 1rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-size: 1rem;
    }
    .filter-check {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      cursor: pointer;
    }
    .card-image {
      display: block;
      text-decoration: none;
      color: inherit;
    }
    .cookies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .cookie-card {
      background: var(--color-surface-elevated);
      border-radius: var(--radius-lg);
      padding: 0;
      overflow: hidden;
      border: 1px solid var(--color-border);
      transition: box-shadow 0.2s ease;
    }
    .cookie-card .card-image {
      height: 160px;
      border-radius: 0;
      overflow: hidden;
      background: var(--color-border);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cookie-card .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .placeholder {
      font-size: 3rem;
      opacity: 0.7;
    }
    .card-content {
      padding: 1.25rem; }
    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text);
      display: block;
      margin-bottom: 0.5rem;
    }
    .description {
      color: var(--color-text-muted);
      font-size: 0.95rem;
      margin-bottom: 0.75rem;
      line-height: 1.45;
    }
    .price {
      font-weight: 700;
      color: var(--color-primary);
      border-radius: var(--radius-md);
      font-size: 1.2rem;
      margin-bottom: 1rem;
    }
    .btn-add {
      width: 100%;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .btn-add:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.35);
    }
    .btn-add:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .btn-add-success {
      background: rgba(34, 197, 94, 0.95) !important;
    }
    .btn-check {
      font-size: 1.1rem;
    }
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--color-text-muted);
    }
    @media (max-width: 768px) {
      .filters-bar { flex-direction: column; align-items: stretch; }
      .search-input { min-width: 0; }
      .cookies-grid { grid-template-columns: 1fr; gap: 1.25rem; }
    }
    @media (max-width: 480px) {
      .card-content { padding: 1.25rem; }
    }
  `]
})
export class BolBuilderComponent implements OnInit {
  cookies: Bowl[] = [];
  private allBowls: Bowl[] = [];
  loading = true;
  justAddedId: number | null = null;

  searchTerm = '';
  availableOnly = true;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private bowlService: BowlService,
    private cartService: CartService,
    private toast: ToastService,
    public shopStatus: ShopStatusService
  ) {}

  ngOnInit() {
    this.shopStatus.loadStatus().subscribe();
    this.loadBowls();
  }

  loadBowls() {
    this.loading = true;
    this.bowlService.getAll(true).subscribe({
      next: (data) => {
        this.allBowls = data;
        this.applyFilter();
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  applyFilter() {
    const term = this.searchTerm.trim().toLowerCase();
    let list = this.allBowls;
    if (term) {
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(term) ||
          (b.description && b.description.toLowerCase().includes(term))
      );
    }
    this.cookies = list;
  }

  onSearch(value: string) {
    this.searchTerm = value;
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.applyFilter(), 300);
  }

  canAddToCart(cookie: Bowl): boolean {
    const inCart = this.cartService.getQuantityForCookie(cookie.id);
    return cookie.stockQuantity > inCart;
  }

  addBowl(cookie: Bowl) {
    if (!this.shopStatus.salesOpen()) {
      this.toast.warning('Les ventes sont actuellement fermées');
      return;
    }
    if (!this.canAddToCart(cookie)) {
      this.toast.warning(`Stock maximum atteint pour « ${cookie.name} »`);
      return;
    }

    this.cartService.addItem(cookie.id, `🥣 Bol mi-cuit : ${cookie.name}`, cookie.price, 1);
    this.toast.success(`« ${cookie.name} » ajouté (bol) au panier !`);
    this.justAddedId = cookie.id;
    setTimeout(() => (this.justAddedId = null), 1500);
  }
}
