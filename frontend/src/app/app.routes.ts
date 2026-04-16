import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'connexion', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'cookies', loadComponent: () => import('./pages/cookies/cookies.component').then(m => m.CookiesComponent) },
  { path: 'cookies/:id', loadComponent: () => import('./pages/cookies/cookie-detail.component').then(m => m.CookieDetailComponent) },
  { path: 'box', loadComponent: () => import('./pages/box/box-builder.component').then(m => m.BoxBuilderComponent) },
  { path: 'bol', loadComponent: () => import('./pages/bol/bol-builder.component').then(m => m.BolBuilderComponent) },
  { path: 'panier', loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent) },
  { path: 'commandes', loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent), canActivate: [authGuard] },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'commandes', loadComponent: () => import('./pages/admin/admin-orders.component').then(m => m.AdminOrdersComponent) },
      { path: 'cookies', loadComponent: () => import('./pages/admin/admin-cookies.component').then(m => m.AdminCookiesComponent) },
      { path: 'codes-promo', loadComponent: () => import('./pages/admin/admin-promo-codes.component').then(m => m.AdminPromoCodesComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
