import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <h2 class="sidebar-title">Administration</h2>
        <nav class="sidebar-nav">
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Tableau de bord</a>
          <a routerLink="/admin/cookies" routerLinkActive="active">Cookies</a>
          <a routerLink="/admin/commandes" routerLinkActive="active">Commandes</a>
          <a routerLink="/admin/codes-promo" routerLinkActive="active">Codes promo</a>
        </nav>
      </aside>
      <div class="admin-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      gap: 2rem;
      min-height: 400px;
    }
    .admin-sidebar {
      width: 220px;
      flex-shrink: 0;
      background: var(--color-surface-elevated);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border);
    }
    .sidebar-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text-muted);
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .sidebar-nav a {
      padding: 0.6rem 1rem;
      border-radius: var(--radius-md);
      font-weight: 500;
      color: var(--color-text);
      transition: background 0.2s;
    }
    .sidebar-nav a:hover { background: var(--color-bg-warm); }
    .sidebar-nav a.active {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: white;
    }
    .admin-content { flex: 1; min-width: 0; }
    @media (max-width: 768px) {
      .admin-layout { flex-direction: column; gap: 1rem; }
      .admin-sidebar {
        width: 100%;
        padding: 1rem;
      }
      .sidebar-nav {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .sidebar-nav a {
        flex: 1;
        min-width: 120px;
        text-align: center;
      }
    }
  `]
})
export class AdminLayoutComponent {}
