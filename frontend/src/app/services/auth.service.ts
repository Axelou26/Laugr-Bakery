import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthRequest, AuthResponse, RegisterRequest } from '../models/auth.model';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'cookie_shop_token';
const USER_KEY = 'cookie_shop_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;

  private token = signal<string | null>(this.getStoredToken());
  private user = signal<AuthResponse | null>(this.getStoredUser());

  isLoggedIn = computed(() => !!this.token());
  isAdmin = computed(() => this.user()?.role === 'ADMIN');
  currentUser = this.user.asReadonly();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => this.handleAuthSuccess(response))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap((response) => this.handleAuthSuccess(response))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.user.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return this.token();
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response));
    this.token.set(response.token);
    this.user.set(response);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private getStoredUser(): AuthResponse | null {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}
