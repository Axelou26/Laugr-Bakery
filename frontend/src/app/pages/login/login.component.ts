import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <span class="auth-icon">🍪</span>
          <h1>{{ isLoginMode ? 'Connexion' : 'Créer un compte' }}</h1>
          <p class="auth-subtitle">{{ isLoginMode ? 'Accédez à votre espace' : 'Rejoignez Cookie Shop' }}</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          @if (!isLoginMode) {
            <div class="form-row">
              <div class="field">
                <label>Prénom</label>
                <input formControlName="firstName" type="text" placeholder="Jean" />
                @if (form.get('firstName')?.invalid && form.get('firstName')?.touched) {
                  <span class="error">Champ requis</span>
                }
              </div>
              <div class="field">
                <label>Nom</label>
                <input formControlName="lastName" type="text" placeholder="Dupont" />
                @if (form.get('lastName')?.invalid && form.get('lastName')?.touched) {
                  <span class="error">Champ requis</span>
                }
              </div>
            </div>
          }

          <div class="field">
            <label>Email</label>
            <input formControlName="email" type="email" placeholder="jean@exemple.com" />
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <span class="error">Email invalide</span>
            }
          </div>

          <div class="field">
            <label>Mot de passe</label>
            <input formControlName="password" type="password" placeholder="••••••••" />
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <span class="error">{{ isLoginMode ? 'Champ requis' : 'Min. 6 caractères' }}</span>
            }
          </div>

          @if (errorMessage) {
            <div class="error-banner">{{ errorMessage }}</div>
          }

          <button type="submit" [disabled]="form.invalid || loading" class="btn-submit">
            {{ loading ? 'Chargement...' : (isLoginMode ? 'Se connecter' : "S'inscrire") }}
          </button>
        </form>

        <p class="switch-mode">
          {{ isLoginMode ? 'Pas encore de compte ?' : 'Déjà un compte ?' }}
          <button type="button" (click)="toggleMode()" class="link-btn">
            {{ isLoginMode ? "S'inscrire" : 'Se connecter' }}
          </button>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 0;
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      background: var(--color-surface-elevated);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      padding: 2.5rem;
      border: 1px solid var(--color-border);
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .auth-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
      opacity: 0.9;
    }
    .auth-card h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: 0.5rem;
    }
    .auth-subtitle {
      font-size: 0.95rem;
      color: var(--color-text-muted);
    }
    .auth-form { margin-bottom: 1.5rem; }
    .field { margin-bottom: 1.25rem; }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.4rem;
      color: var(--color-text);
      font-size: 0.95rem;
    }
    input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-family: var(--font-sans);
      transition: border-color 0.2s;
    }
    input:focus {
      outline: none;
      border-color: var(--color-primary);
    }
    .error {
      display: block;
      color: var(--color-error);
      font-size: 0.85rem;
      margin-top: 0.35rem;
    }
    .error-banner {
      padding: 0.75rem;
      background: #fee2e2;
      color: var(--color-error);
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    .btn-submit {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      margin-top: 0.5rem;
      transition: all 0.2s;
    }
    .btn-submit:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.35);
    }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .switch-mode {
      text-align: center;
      color: var(--color-text-muted);
      font-size: 0.95rem;
    }
    .link-btn {
      background: none;
      border: none;
      color: var(--color-primary);
      font-weight: 600;
      cursor: pointer;
      padding: 0 0.35rem;
      font-family: var(--font-sans);
    }
    .link-btn:hover { text-decoration: underline; }
    @media (max-width: 480px) {
      .auth-wrapper { padding: 1rem 0; min-height: 50vh; }
      .auth-card { padding: 1.5rem; margin: 0 0.5rem; }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class LoginComponent {
  isLoginMode = true;
  form: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      firstName: [''],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    if (this.isLoginMode) {
      this.form.get('firstName')?.clearValidators();
      this.form.get('lastName')?.clearValidators();
    } else {
      this.form.get('firstName')?.setValidators(Validators.required);
      this.form.get('lastName')?.setValidators(Validators.required);
    }
    this.form.get('firstName')?.updateValueAndValidity();
    this.form.get('lastName')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    const sub = this.isLoginMode
      ? this.auth.login({ email: this.form.value.email, password: this.form.value.password })
      : this.auth.register({
          firstName: this.form.value.firstName,
          lastName: this.form.value.lastName,
          email: this.form.value.email,
          password: this.form.value.password
        });

    sub.subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/commandes';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || err.message || 'Une erreur est survenue';
        this.loading = false;
      },
      complete: () => (this.loading = false)
    });
  }
}
