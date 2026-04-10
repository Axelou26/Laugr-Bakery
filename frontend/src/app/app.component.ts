import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { ShopStatusService } from './services/shop-status.service';
import { OrderWebSocketService } from './services/order-websocket.service';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ToastComponent],
  template: `
    <header class="site-header">
      <nav class="nav-container">
        <a routerLink="/" class="logo" aria-label="laugr bakery">
          <img src="assets/laugr-bakery-logo.png" alt="laugr bakery" class="logo-img" />
          <span class="logo-text">laugr bakery</span>
        </a>
        <div class="nav-links" [class.open]="menuOpen()" (click)="closeMenu()">
          <a routerLink="/cookies" routerLinkActive="active" [routerLinkActiveOptions]="{exact: false}">Nos cookies</a>
          <a routerLink="/box" routerLinkActive="active">📦 Ma box</a>
          <a routerLink="/bol" routerLinkActive="active">🥣 Mes bols</a>
          <a routerLink="/panier" routerLinkActive="active" class="nav-cart">
            Panier
            @if (cart.totalItems() > 0) {
              <span class="cart-badge">{{ cart.totalItems() }}</span>
            }
          </a>
          @if (auth.isLoggedIn()) {
            <a routerLink="/commandes" routerLinkActive="active">Mes commandes</a>
            @if (auth.isAdmin()) {
              <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: false}">Admin</a>
            }
          } @else {
            <a routerLink="/connexion" routerLinkActive="active" class="btn-login">Connexion</a>
          }
        </div>
        <div class="nav-right">
          @if (auth.isLoggedIn()) {
            <div class="user-dropdown">
              <button type="button" class="user-btn" (click)="userDropdownOpen.set(!userDropdownOpen())" aria-label="Mon compte">
                👤
              </button>
            </div>
          }
          <button type="button" class="nav-toggle" [class.open]="menuOpen()" (click)="menuOpen.set(!menuOpen())" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>
    </header>
    @if (!shopStatus.salesOpen()) {
      <div class="sales-closed-banner" role="status" aria-live="polite">
        <div class="sales-closed-inner">
          <span class="sales-icon">⏳</span>
          <div class="sales-text">
            <strong>Ventes fermées pour le moment.</strong>
            @if (shopStatus.nextOpeningAt()) {
              <span>Prochaine ouverture : {{ formatOpening(shopStatus.nextOpeningAt()) }}</span>
              <span class="countdown">{{ getCountdownLabel(shopStatus.nextOpeningAt()) }}</span>
            } @else {
              <span>La boutique reouvre tres bientot.</span>
            }
          </div>
        </div>
      </div>
    }
    <div class="nav-overlay" [class.visible]="menuOpen()" (click)="menuOpen.set(false)"></div>
    @if (userDropdownOpen()) {
      <div class="dropdown-overlay" (click)="userDropdownOpen.set(false)"></div>
      <div class="user-dropdown-menu user-dropdown-menu-fixed">
        <span class="dropdown-name">{{ auth.currentUser()?.firstName }}</span>
        <button type="button" (click)="logout(); userDropdownOpen.set(false)" class="btn-logout">Déconnexion</button>
      </div>
    }
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    <footer class="site-footer">
      <p>© laugr bakery – Cookies maison avec amour</p>
    </footer>
    <app-toast />
  `,
  styles: [`
    .site-header {
      background: linear-gradient(180deg, rgba(255, 254, 252, 0.98) 0%, rgba(253, 243, 235, 0.92) 100%);
      color: var(--color-text);
      padding: 0 1.5rem;
      box-shadow: 0 6px 22px rgba(var(--color-shadow-chocolate), 0.08);
      border-bottom: 1px solid var(--color-border);
      backdrop-filter: blur(8px);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
      height: 64px;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
    }
    .logo:hover { opacity: 0.9; }
    .logo-img {
      height: 44px;
      width: auto;
      display: block;
    }
    .logo-text {
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--color-brand-deep);
      line-height: 1;
      white-space: nowrap;
    }
    .nav-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .user-dropdown {
      position: relative;
    }
    .user-btn {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      line-height: 1;
      background: linear-gradient(145deg, #fffdfb 0%, var(--color-surface) 100%);
      border: 1px solid var(--color-border);
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 2px 10px rgba(var(--color-shadow-chocolate), 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.95);
      color: var(--color-brand-deep);
    }
    .user-btn:hover {
      background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 50%, var(--color-primary-dark) 100%);
      color: #fffaf6;
      border-color: rgba(var(--color-shadow-chocolate), 0.14);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(var(--color-shadow-chocolate), 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.25);
    }
    .user-btn:active {
      transform: translateY(0);
    }
    .user-dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 180px;
      padding: 1rem;
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      z-index: 120;
    }
    .dropdown-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--color-brand-deep);
    }
    .dropdown-overlay {
      position: fixed;
      inset: 0;
      z-index: 115;
    }
    .user-dropdown-menu-fixed {
      position: fixed;
      top: 72px;
      right: 1.5rem;
      z-index: 120;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 1.75rem;
    }
    .nav-links a {
      color: var(--color-text-muted);
      font-weight: 500;
      font-size: 0.95rem;
      padding: 0.35rem 0;
    }
    .nav-links a.btn-login {
      padding: 0.75rem 2rem;
    }
    .nav-links a:hover { color: var(--color-brand-deep); }
    .nav-links a.active {
      color: var(--color-primary-light);
      border-bottom: 2px solid var(--color-primary-light);
    }
    .nav-cart {
      position: relative;
    }
    .cart-badge {
      position: absolute;
      top: -6px;
      right: -10px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: #e53935;
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .btn-logout {
      background: #fffdfb;
      border: 1px solid var(--color-primary);
      color: var(--color-primary-dark);
      padding: 0.55rem 1.15rem;
      border-radius: 999px;
      font-family: var(--font-sans);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 2px 10px rgba(var(--color-shadow-chocolate), 0.06);
    }
    .btn-logout:hover {
      background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 50%, var(--color-primary-dark) 100%);
      color: #fffaf6;
      border-color: rgba(var(--color-shadow-chocolate), 0.12);
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(var(--color-shadow-chocolate), 0.15);
    }
    .btn-login {
      background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 50%, var(--color-primary-dark) 100%);
      padding: 0.75rem 2rem;
      border-radius: 999px;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: #fffaf6;
      box-shadow: 0 4px 16px rgba(var(--color-shadow-chocolate), 0.18), inset 0 1px 0 rgba(255,255,255,0.2);
      border: 1px solid rgba(var(--color-shadow-chocolate), 0.1);
      transition: all 0.25s ease;
    }
    .btn-login:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(var(--color-shadow-chocolate), 0.22), inset 0 1px 0 rgba(255,255,255,0.3);
      background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 50%, var(--color-primary-dark) 100%);
    }
    .main-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2.5rem 1.5rem;
      min-height: calc(100vh - 140px);
    }
    .site-footer {
      text-align: center;
      padding: 1.25rem;
      background: linear-gradient(180deg, rgba(253, 243, 235, 0.55) 0%, rgba(247, 239, 230, 0.95) 100%);
      border-top: 1px solid var(--color-border-peach);
      color: var(--color-text-muted);
      font-size: 0.9rem;
    }
    .nav-toggle {
      display: none;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 44px;
      height: 44px;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 10px;
      z-index: 110;
    }
    .nav-toggle span {
      display: block;
      width: 22px;
      height: 2px;
      background: var(--color-brand-deep);
      transition: transform 0.3s, opacity 0.3s;
    }
    .nav-toggle.open span:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }
    .nav-toggle.open span:nth-child(2) { opacity: 0; }
    .nav-toggle.open span:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }
    .nav-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 98;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .nav-overlay.visible { opacity: 1; display: block; pointer-events: auto; }
    .sales-closed-banner {
      background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%);
      color: #fff8f8;
      border-bottom: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    .sales-closed-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.85rem 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.8rem;
      text-align: left;
    }
    .sales-icon {
      font-size: 1.35rem;
      line-height: 1;
    }
    .sales-text {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      font-size: 0.95rem;
    }
    .sales-text strong {
      font-size: 1rem;
      letter-spacing: 0.01em;
    }
    .countdown {
      font-weight: 700;
      color: #ffe8a3;
    }
    @media (max-width: 900px) {
      .nav-overlay { display: block; pointer-events: none; }
      .nav-toggle { display: flex; }
      .nav-links {
        position: fixed;
        top: 0;
        right: 0;
        width: min(300px, 85vw);
        height: 100vh;
        background: rgba(255, 253, 249, 0.98);
        flex-direction: column;
        justify-content: flex-start;
        padding: 5rem 1.5rem 2rem;
        gap: 0;
        z-index: 99;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        box-shadow: -4px 0 20px rgba(0,0,0,0.2);
      }
      .nav-links.open { transform: translateX(0); }
      .nav-links {
        justify-content: flex-start;
        padding-top: 5rem;
        padding-bottom: 1.5rem;
      }
      .nav-links a, .nav-links .btn-login {
        padding: 1rem 0;
        border-bottom: 1px solid var(--color-border);
        font-size: 1rem;
      }
      .nav-links .btn-login {
        border: none;
        border-bottom: 1px solid var(--color-border);
        text-align: left;
        background: none;
        color: var(--color-brand-deep);
      }
    }
    @media (max-width: 600px) {
      .nav-links { width: min(280px, 90vw); padding: 4.5rem 1.25rem 1.25rem; }
      .sales-closed-inner { justify-content: flex-start; }
    }
    @media (max-width: 600px) {
      .main-content { padding: 1.25rem 1rem; }
      .site-footer { padding: 1rem; font-size: 0.85rem; }
      .logo-img { height: 36px; }
      .logo-text { font-size: 0.95rem; }
    }
  `]
})
export class AppComponent implements OnDestroy {
  menuOpen = signal(false);
  userDropdownOpen = signal(false);
  private now = signal(Date.now());
  private countdownTimer: ReturnType<typeof setInterval>;
  private orderWs = inject(OrderWebSocketService);

  constructor(
    public auth: AuthService,
    public cart: CartService,
    public shopStatus: ShopStatusService
  ) {
    this.shopStatus.loadStatus().subscribe();
    this.countdownTimer = setInterval(() => this.now.set(Date.now()), 1000);
    effect(() => {
      const loggedIn = this.auth.isLoggedIn();
      const token = loggedIn ? this.auth.getToken() : null;
      this.orderWs.syncSession(token, loggedIn);
    });
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownTimer);
  }

  formatOpening(value: string | null): string {
    if (!value) return '';
    return new Date(value).toLocaleString('fr-FR');
  }

  getCountdownLabel(value: string | null): string {
    if (!value) return '';
    const target = new Date(value).getTime();
    if (Number.isNaN(target)) return '';
    const diffMs = target - this.now();
    if (diffMs <= 0) return 'Ouverture imminente.';

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `Ouverture dans ${days}j ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `Ouverture dans ${hours}h ${minutes}m ${seconds}s`;
    }
    return `Ouverture dans ${minutes}m ${seconds}s`;
  }
}
