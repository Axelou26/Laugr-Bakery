import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero">
      <div class="hero-content">
        <h1>Bienvenue chez laugr bakery</h1>
        <p class="hero-subtitle">
          Découvrez nos cookies maison, préparés avec soin pour vos moments gourmands.
        </p>
        <div class="hero-actions">
          <a routerLink="/cookies" class="cta-btn">Découvrir nos cookies</a>
          <a href="https://www.instagram.com/laugr_bakery/" target="_blank" rel="noopener noreferrer" class="cta-btn cta-btn-outline">
            Voir Instagram
          </a>
        </div>
      </div>
      <div class="hero-decoration">
        <img src="assets/laugr-bakery-logo.png" alt="Logo laugr bakery" class="hero-logo" />
      </div>
    </section>
    <section class="features">
      <div class="feature">
        <span class="feature-icon">✨</span>
        <h3>Recettes maison</h3>
        <p>Des cookies préparés avec soin</p>
      </div>
      <div class="feature">
        <span class="feature-icon">🚚</span>
        <h3>Livraison rapide</h3>
        <p>Livraison à l'INSEP ou retrait au 37 avenue Boileau, 94500 Champigny-sur-Marne</p>
      </div>
      <div class="feature">
        <span class="feature-icon">💚</span>
        <h3>Ingrédients qualité</h3>
        <p>100% naturels et frais</p>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
      padding: 4rem 3rem;
      background: linear-gradient(145deg, var(--color-surface-elevated) 0%, var(--color-hero-tint) 42%, rgba(241, 167, 99, 0.14) 100%);
      border-radius: var(--radius-xl);
      margin-bottom: 3rem;
      position: relative;
      overflow: hidden;
      border: 1px solid var(--color-border-peach);
      box-shadow: var(--shadow-md);
    }
    .hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--color-peach) 0%, var(--color-primary-light) 35%, var(--color-primary) 55%, var(--color-chocolate-soft) 100%);
    }
    .hero-content { flex: 1; }
    .hero h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: 1rem;
      letter-spacing: -0.03em;
    }
    .hero-subtitle {
      font-size: 1.15rem;
      color: var(--color-text-muted);
      max-width: 450px;
      margin-bottom: 2rem;
      line-height: 1.7;
    }
    .cta-btn {
      display: inline-block;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 45%, var(--color-primary-dark) 100%);
      color: #fffaf6;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 1.05rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 16px rgba(var(--color-shadow-chocolate), 0.18);
    }
    .cta-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(var(--color-shadow-chocolate), 0.24);
    }
    .hero-actions {
      display: flex;
      gap: 0.8rem;
      flex-wrap: wrap;
    }
    .cta-btn-outline {
      background: rgba(255, 254, 252, 0.75);
      color: var(--color-chocolate);
      border: 1px solid var(--color-border-peach);
      box-shadow: none;
    }
    .cta-btn-outline:hover {
      background: var(--color-surface-elevated);
      border-color: var(--color-peach-deep);
      box-shadow: var(--shadow-sm);
    }
    .hero-decoration {
      flex-shrink: 0;
    }
    .hero-logo {
      width: min(280px, 38vw);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--color-border-peach);
    }
    .features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
    .feature {
      text-align: center;
      padding: 2rem;
      background: linear-gradient(180deg, var(--color-surface-elevated) 0%, var(--color-hero-tint) 100%);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      transition: all 0.3s ease;
      border: 1px solid var(--color-border-peach);
    }
    .feature:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }
    .feature-icon {
      font-size: 2.5rem;
      display: block;
      margin-bottom: 1rem;
    }
    .feature h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 0.5rem;
    }
    .feature p {
      font-size: 0.95rem;
      color: var(--color-text-muted);
    }
    @media (max-width: 768px) {
      .hero { flex-direction: column; padding: 3rem 1.5rem; }
      .hero h1 { font-size: 1.85rem; }
      .hero-subtitle { font-size: 1rem; }
      .hero-logo { width: min(260px, 72vw); }
      .features { grid-template-columns: 1fr; gap: 1rem; }
      .feature { padding: 1.5rem; }
    }
    @media (max-width: 480px) {
      .hero { padding: 2rem 1rem; margin-bottom: 2rem; }
      .hero h1 { font-size: 1.5rem; }
      .cta-btn { width: 100%; text-align: center; }
    }
  `]
})
export class HomeComponent {}
