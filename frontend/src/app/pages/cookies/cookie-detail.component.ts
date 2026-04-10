import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CookieService } from '../../services/cookie.service';
import { Cookie } from '../../models/cookie.model';
import { ShopStatusService } from '../../services/shop-status.service';

@Component({
  selector: 'app-cookie-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (loading) {
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>
    } @else if (cookie) {
      <a routerLink="/cookies" class="back-link">← Retour au catalogue</a>
      @if (!shopStatus.salesOpen()) {
        <div class="sales-alert">Les ventes sont temporairement fermées.</div>
      }
      <article class="detail-card">
        <div class="detail-image">
          @if (cookie.imageUrl) {
            <img [src]="cookie.imageUrl" [alt]="cookie.name" />
          } @else {
            <span class="placeholder">🍪</span>
          }
        </div>
        <div class="detail-content">
          @if (cookie.category) {
            <span class="category-badge">{{ cookie.category }}</span>
          }
          <h1>{{ cookie.name }}</h1>
          <p class="description">{{ cookie.description }}</p>
          <p class="stock-info">
            @if (cookie.available && cookie.stockQuantity > 0) {
              <span class="in-stock">En stock ({{ cookie.stockQuantity }} disponibles)</span>
            } @else {
              <span class="out-stock">Rupture de stock</span>
            }
          </p>
          <div class="detail-actions">
            <a
              routerLink="/box"
              class="btn-add"
              [class.btn-add-disabled]="!shopStatus.salesOpen()"
              aria-disabled="!shopStatus.salesOpen()"
            >
              Composer ma box de 6 cookies
            </a>

            <a
              routerLink="/bol"
              class="btn-add btn-add-secondary"
              [class.btn-add-disabled]="!shopStatus.salesOpen()"
              aria-disabled="!shopStatus.salesOpen()"
            >
              Composer mes bols
            </a>
          </div>
        </div>
      </article>
    } @else {
      <div class="empty-state">
        <p>Cookie introuvable.</p>
        <a routerLink="/cookies" class="btn-primary">Retour au catalogue</a>
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
    .back-link {
      display: inline-block;
      margin-bottom: 1.5rem;
      color: var(--color-primary);
      font-weight: 500;
      text-decoration: none;
    }
    .back-link:hover { text-decoration: underline; }
    .sales-alert {
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      background: #fff3cd;
      color: #664d03;
      border: 1px solid #ffecb5;
      font-weight: 600;
    }
    .detail-card {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2.5rem;
      align-items: start;
      background: var(--color-surface-elevated);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--color-border);
    }
    .detail-image {
      aspect-ratio: 300/160;
      background: linear-gradient(135deg, var(--color-hero-tint) 0%, var(--color-cream) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .detail-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .detail-image .placeholder { font-size: 6rem; }
    .detail-content {
      padding: 2rem;
    }
    .category-badge {
      display: inline-block;
      font-size: 0.8rem;
      color: var(--color-text-muted);
      background: var(--color-border);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      margin-bottom: 0.75rem;
    }
    .detail-content h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: 1rem;
    }
    .description {
      font-size: 1.1rem;
      line-height: 1.7;
      color: var(--color-text-muted);
      margin-bottom: 1.5rem;
    }
    .price {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 1rem;
    }
    .stock-info {
      margin-bottom: 1.5rem;
      font-size: 0.95rem;
    }
    .in-stock { color: var(--color-success); }
    .out-stock { color: var(--color-error); }
    .detail-actions {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .btn-add {
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
    .btn-add-disabled {
      opacity: 0.7;
      cursor: not-allowed;
      pointer-events: none;
    }
    .btn-add-secondary {
      background: linear-gradient(135deg, var(--color-border) 0%, #d9d9d9 100%);
      color: var(--color-text);
    }
    .btn-add-secondary:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba(0,0,0,0.12);
    }
    .btn-add:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.35);
    }
    .btn-add:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    @media (max-width: 768px) {
      .detail-card { grid-template-columns: 1fr; gap: 1.5rem; }
      .detail-content { padding: 1.5rem; }
      .detail-content h1 { font-size: 1.5rem; }
      .price { font-size: 1.5rem; }
    }
    @media (max-width: 480px) {
      .detail-content { padding: 1rem; }
      .btn-add { width: 100%; }
    }
  `]
})
export class CookieDetailComponent {
  cookie: Cookie | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cookieService: CookieService,
    public shopStatus: ShopStatusService
  ) {}

  ngOnInit() {
    this.shopStatus.loadStatus().subscribe();
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/cookies']);
      return;
    }
    this.cookieService.getById(+id).subscribe({
      next: (c) => {
        this.cookie = c;
        this.loading = false;
      },
      error: () => {
        this.cookie = null;
        this.loading = false;
      }
    });
  }

}
