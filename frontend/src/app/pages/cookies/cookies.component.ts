import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CookieService } from '../../services/cookie.service';
import { Cookie } from '../../models/cookie.model';

@Component({
  selector: 'app-cookies',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <h1 class="page-title">Nos cookies</h1>
    <div class="catalog-ctas">
      <a routerLink="/box" class="box-cta">📦 Composer ma box de 6 cookies</a>
      <a routerLink="/bol" class="box-cta bol-cta">🥣 Choisir mon bol</a>
    </div>

    <div class="filters-bar">
      <input
        type="text"
        class="search-input"
        placeholder="Rechercher..."
        [ngModel]="searchTerm"
        (ngModelChange)="onSearch($event)"
      />
      <select class="filter-select" [ngModel]="selectedCategory" (ngModelChange)="onCategoryChange($event)">
        <option value="">Toutes catégories</option>
        @for (cat of categories; track cat) {
          <option [value]="cat">{{ cat }}</option>
        }
      </select>
    </div>

    @if (loading) {
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Chargement des cookies...</p>
      </div>
    } @else if (cookies.length === 0) {
      <div class="empty-state">
        <p>Aucun cookie ne correspond à votre recherche.</p>
      </div>
    } @else {
      <div class="cookies-grid">
        @for (cookie of cookies; track cookie.id) {
          <article class="cookie-card">
            <a [routerLink]="['/cookies', cookie.id]" class="card-image">
              @if (cookie.imageUrl) {
                <img [src]="cookie.imageUrl" [alt]="cookie.name" />
              } @else {
                <span class="placeholder">🍪</span>
              }
            </a>
            <div class="card-content">
              <a [routerLink]="['/cookies', cookie.id]" class="card-title">{{ cookie.name }}</a>
              @if (cookie.category) {
                <span class="card-category">{{ cookie.category }}</span>
              }
              <p class="description">{{ cookie.description }}</p>
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
    .cookies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.75rem;
    }
    .cookie-card {
      background: var(--color-surface-elevated);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border);
      transition: all 0.3s ease;
    }
    .cookie-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }
    .card-image {
      height: 160px;
      background: linear-gradient(135deg, var(--color-hero-tint) 0%, var(--color-cream) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .card-image .placeholder { font-size: 4rem; }
    .card-content {
      padding: 1.5rem;
    }
    .card-content h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 0.5rem;
    }
    .description {
      font-size: 0.95rem;
      color: var(--color-text-muted);
      margin-bottom: 1rem;
      line-height: 1.5;
    }
    .price {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 1rem;
    }
    .btn-add {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-add:hover:not(.btn-add-success) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.35);
    }
    .btn-add:active:not(.btn-add-success) {
      transform: scale(0.97);
    }
    .btn-add-success {
      background: linear-gradient(135deg, var(--color-success) 0%, #3d8559 100%) !important;
      animation: pulse-success 0.4s ease-out;
    }
    .btn-check {
      display: inline-flex;
      margin-right: 0.35rem;
      font-weight: 700;
    }
    @keyframes pulse-success {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    .card-just-added {
      animation: card-bounce 0.5s ease-out;
    }
    @keyframes card-bounce {
      0% { transform: scale(1); }
      30% { transform: scale(1.02); }
      60% { transform: scale(0.99); }
      100% { transform: scale(1); }
    }
    .box-cta {
      display: inline-block;
      padding: 0.6rem 1.25rem;
      background: linear-gradient(135deg, #2a0000 0%, var(--color-chocolate) 100%);
      color: white;
      border-radius: var(--radius-md);
      font-weight: 600;
      text-decoration: none;
      margin-bottom: 1.5rem;
      transition: all 0.2s;
    }
    .catalog-ctas {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      align-items: center;
    }
    .bol-cta {
      background: linear-gradient(135deg, #4a1515 0%, #6b3030 100%);
    }
    .box-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .filters-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      align-items: center;
    }
    .search-input {
      flex: 1;
      min-width: 180px;
      padding: 0.6rem 1rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-size: 1rem;
    }
    .filter-select {
      padding: 0.6rem 1rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-size: 1rem;
      background: white;
    }
    .card-image {
      display: block;
      text-decoration: none;
      color: inherit;
    }
    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text);
      text-decoration: none;
      display: block;
      margin-bottom: 0.25rem;
    }
    .card-title:hover { color: var(--color-primary); }
    .card-category {
      display: inline-block;
      font-size: 0.75rem;
      color: var(--color-text-muted);
      background: var(--color-border);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      margin-bottom: 0.5rem;
    }
    .btn-add:disabled {
      opacity: 0.7;
      cursor: not-allowed;
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
export class CookiesComponent implements OnInit {
  cookies: Cookie[] = [];
  categories: string[] = [];
  loading = true;
  searchTerm = '';
  selectedCategory = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;
  constructor(private cookieService: CookieService) {}

  ngOnInit() {
    this.cookieService.getCategories().subscribe({
      next: (cats) => (this.categories = cats)
    });
    this.loadCookies();
  }

  loadCookies() {
    this.loading = true;
    this.cookieService.search({
      search: this.searchTerm || undefined,
      category: this.selectedCategory || undefined,
      availableOnly: true
    }).subscribe({
      next: (data) => {
        this.cookies = data;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  onSearch(value: string) {
    this.searchTerm = value;
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadCookies(), 300);
  }

  onCategoryChange(value: string) {
    this.selectedCategory = value;
    this.loadCookies();
  }
}
