import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminPromoCode,
  AdminPromoCodeService,
  AdminDiscountType
} from '../../services/admin-promo-code.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-promo-codes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1 class="page-title">Codes promo</h1>
    <p class="intro">
      Créez des remises en pourcentage ou en montant fixe. Le client saisit le code dans le panier ; le montant est
      vérifié à la commande.
    </p>

    <div class="toolbar">
      <button type="button" class="btn-primary" (click)="openCreate()">+ Nouveau code</button>
    </div>

    @if (loading) {
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>
    } @else if (codes.length === 0) {
      <div class="empty-state"><p>Aucun code promo.</p></div>
    } @else {
      <div class="table-wrap">
        <table class="promo-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Remise</th>
              <th>Min. panier</th>
              <th>Utilisations</th>
              <th>Validité</th>
              <th>État</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (c of codes; track c.id) {
              <tr [class.inactive]="!c.active">
                <td><strong>{{ c.code }}</strong></td>
                <td>{{ formatDiscount(c) }}</td>
                <td>{{ c.minOrderAmount != null ? (c.minOrderAmount | number:'1.2-2') + ' €' : '—' }}</td>
                <td>
                  {{ c.usedCount }}
                  @if (c.maxUses != null) {
                    / {{ c.maxUses }}
                  } @else {
                    / ∞
                  }
                </td>
                <td class="dates">{{ formatValidity(c) }}</td>
                <td>
                  <span class="badge" [class.on]="c.active" [class.off]="!c.active">
                    {{ c.active ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td class="actions">
                  <button type="button" class="btn-edit" (click)="openEdit(c)">Modifier</button>
                  <button type="button" class="btn-delete" (click)="confirmDelete(c)">Supprimer</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (modalOpen) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>{{ editingId ? 'Modifier le code' : 'Nouveau code promo' }}</h2>
          <div class="field">
            <label>Code *</label>
            <input [(ngModel)]="form.code" placeholder="EX: ETE2026" />
          </div>
          <div class="field">
            <label>Description</label>
            <input [(ngModel)]="form.description" placeholder="Campagne Instagram…" />
          </div>
          <div class="field-row">
            <div class="field">
              <label>Type *</label>
              <select [(ngModel)]="form.discountType">
                <option value="PERCENTAGE">Pourcentage (%)</option>
                <option value="FIXED_AMOUNT">Montant fixe (€)</option>
              </select>
            </div>
            <div class="field">
              <label>{{ form.discountType === 'PERCENTAGE' ? 'Pourcentage *' : 'Montant (€) *' }}</label>
              <input type="number" [(ngModel)]="form.discountValue" step="0.01" min="0.01" />
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Valide du</label>
              <input type="datetime-local" [(ngModel)]="form.validFromInput" />
            </div>
            <div class="field">
              <label>Valide jusqu'au</label>
              <input type="datetime-local" [(ngModel)]="form.validToInput" />
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Montant minimum du panier (€)</label>
              <input type="number" [(ngModel)]="form.minOrderAmount" step="0.01" min="0" placeholder="aucun" />
            </div>
            <div class="field">
              <label>Nombre max d'utilisations</label>
              <input type="number" [(ngModel)]="form.maxUses" min="1" placeholder="illimité" />
            </div>
          </div>
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="form.active" />
            Code actif
          </label>
          <div class="modal-actions">
            <button type="button" class="btn-primary" (click)="save()" [disabled]="saving">
              {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
            <button type="button" class="btn-secondary" (click)="closeModal()">Annuler</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .intro { color: var(--color-text-muted); margin-bottom: 1.25rem; max-width: 720px; }
    .toolbar { margin-bottom: 1rem; }
    .btn-primary {
      padding: 0.6rem 1.1rem;
      border: none;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
      color: white;
      font-weight: 600;
      cursor: pointer;
    }
    .loading-state, .empty-state { padding: 3rem; text-align: center; color: var(--color-text-muted); }
    .spinner {
      width: 40px; height: 40px; margin: 0 auto 1rem;
      border: 3px solid var(--color-border); border-top-color: var(--color-primary);
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .table-wrap { overflow-x: auto; border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
    .promo-table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
    .promo-table th, .promo-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--color-border); }
    .promo-table th { background: var(--color-bg-warm); font-weight: 600; }
    tr.inactive { opacity: 0.65; }
    .dates { font-size: 0.85rem; color: var(--color-text-muted); white-space: nowrap; }
    .badge { padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 600; }
    .badge.on { background: #d1fae5; color: #065f46; }
    .badge.off { background: #fee2e2; color: #991b1b; }
    .actions { white-space: nowrap; }
    .btn-edit, .btn-delete {
      padding: 0.35rem 0.65rem; margin-right: 0.35rem;
      border-radius: var(--radius-sm); font-size: 0.85rem; cursor: pointer; border: 1px solid var(--color-border);
      background: white;
    }
    .btn-delete { color: var(--color-error); border-color: var(--color-error); }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 1000;
      display: flex; align-items: center; justify-content: center; padding: 1rem;
    }
    .modal {
      background: var(--color-surface-elevated);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      max-width: 520px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-md);
    }
    .modal h2 { margin-top: 0; }
    .field { margin-bottom: 1rem; }
    .field label { display: block; font-weight: 600; margin-bottom: 0.35rem; }
    .field input, .field select { width: 100%; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 560px) { .field-row { grid-template-columns: 1fr; } }
    .hint { font-size: 0.8rem; color: var(--color-text-muted); margin: 0.35rem 0 0; }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; margin: 1rem 0; font-weight: 500; }
    .modal-actions { display: flex; gap: 0.75rem; margin-top: 1.25rem; flex-wrap: wrap; }
    .btn-secondary {
      padding: 0.6rem 1rem; border: 1px solid var(--color-border); border-radius: var(--radius-md);
      background: var(--color-border); cursor: pointer;
    }
  `]
})
export class AdminPromoCodesComponent implements OnInit {
  codes: AdminPromoCode[] = [];
  loading = true;
  modalOpen = false;
  editingId: number | null = null;
  saving = false;

  form = {
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as AdminDiscountType,
    discountValue: 10,
    active: true,
    validFromInput: '',
    validToInput: '',
    minOrderAmount: null as number | null,
    maxUses: null as number | null
  };

  constructor(
    private api: AdminPromoCodeService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.list().subscribe({
      next: (list) => {
        this.codes = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Impossible de charger les codes promo');
      }
    });
  }

  formatDiscount(c: AdminPromoCode): string {
    if (c.discountType === 'PERCENTAGE') {
      return `${c.discountValue} %`;
    }
    return `${c.discountValue} €`;
  }

  formatValidity(c: AdminPromoCode): string {
    const from = c.validFrom ? this.fmtDate(c.validFrom) : '—';
    const to = c.validTo ? this.fmtDate(c.validTo) : '—';
    return `${from} → ${to}`;
  }

  private fmtDate(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  }

  private toDatetimeLocal(iso?: string | null): string {
    if (!iso) return '';
    return iso.slice(0, 16);
  }

  private fromDatetimeLocal(s: string): string | null {
    const t = s?.trim();
    if (!t) return null;
    return t.length === 16 ? `${t}:00` : t;
  }

  openCreate(): void {
    this.editingId = null;
    this.form = {
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      active: true,
      validFromInput: '',
      validToInput: '',
      minOrderAmount: null,
      maxUses: null
    };
    this.modalOpen = true;
  }

  openEdit(c: AdminPromoCode): void {
    this.editingId = c.id;
    this.form = {
      code: c.code,
      description: c.description ?? '',
      discountType: c.discountType,
      discountValue: c.discountValue,
      active: c.active,
      validFromInput: this.toDatetimeLocal(c.validFrom),
      validToInput: this.toDatetimeLocal(c.validTo),
      minOrderAmount: c.minOrderAmount ?? null,
      maxUses: c.maxUses ?? null
    };
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editingId = null;
  }

  private payload(): Record<string, unknown> {
    const p: Record<string, unknown> = {
      code: this.form.code.trim(),
      description: this.form.description?.trim() || null,
      discountType: this.form.discountType,
      discountValue: this.form.discountValue,
      active: this.form.active,
      validFrom: this.fromDatetimeLocal(this.form.validFromInput),
      validTo: this.fromDatetimeLocal(this.form.validToInput),
      minOrderAmount:
        this.form.minOrderAmount != null && this.form.minOrderAmount > 0 ? this.form.minOrderAmount : null,
      maxUses: this.form.maxUses != null && this.form.maxUses > 0 ? Math.floor(this.form.maxUses) : null
    };
    return p;
  }

  save(): void {
    if (!this.form.code.trim()) {
      this.toast.warning('Le code est obligatoire');
      return;
    }
    if (this.form.discountValue == null || this.form.discountValue <= 0) {
      this.toast.warning('Indiquez une valeur de remise valide');
      return;
    }
    this.saving = true;
    const body = this.payload();
    const req =
      this.editingId != null
        ? this.api.update(this.editingId, body)
        : this.api.create(body);
    req.subscribe({
      next: () => {
        this.saving = false;
        this.toast.success(this.editingId ? 'Code mis à jour' : 'Code créé');
        this.closeModal();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err.error?.message || 'Erreur à l’enregistrement');
      }
    });
  }

  confirmDelete(c: AdminPromoCode): void {
    if (!confirm(`Supprimer le code « ${c.code} » ?`)) return;
    this.api.delete(c.id).subscribe({
      next: () => {
        this.toast.success('Code supprimé');
        this.load();
      },
      error: (err) => this.toast.error(err.error?.message || 'Suppression impossible')
    });
  }
}
