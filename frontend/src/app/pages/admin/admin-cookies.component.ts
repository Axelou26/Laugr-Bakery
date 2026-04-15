import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CookieService } from '../../services/cookie.service';
import { BowlService } from '../../services/bowl.service';
import { ImageUploadService } from '../../services/image-upload.service';
import { ToastService } from '../../services/toast.service';
import { Cookie } from '../../models/cookie.model';
import { Bowl } from '../../models/bowl.model';
import { FormsModule } from '@angular/forms';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'app-admin-cookies',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCropperComponent],
  template: `
    <div class="header-row">
      <div class="header-left">
        <h1 class="page-title">Gestion des cookies et bols</h1>
        <div class="mode-toggle">
          <button type="button" class="btn-mode" [class.active]="mode === 'cookies'" (click)="setMode('cookies')">Cookies</button>
          <button type="button" class="btn-mode" [class.active]="mode === 'bowls'" (click)="setMode('bowls')">Bols</button>
        </div>
      </div>
      <button type="button" class="btn-add" (click)="openForm()">+ Ajouter</button>
    </div>

    @if (loading) {
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>
    } @else if (items.length === 0) {
      <div class="empty-state">
        <p>{{ mode === 'bowls' ? 'Aucun bol en vente.' : 'Aucun cookie en vente.' }}</p>
        <button type="button" class="btn-primary" (click)="openForm()">Ajouter le premier</button>
      </div>
    } @else {
      <div class="cookies-table">
        @for (item of items; track item.id) {
          <div class="cookie-row" [class.editing]="editingId === item.id">
            @if (editingId === item.id) {
              <div class="edit-form">
                @if (editForm.imageUrl) {
                  <div class="img-preview">
                    <img [src]="editForm.imageUrl" alt="" />
                    <button type="button" (click)="editForm.imageUrl = ''" class="btn-remove-img">×</button>
                  </div>
                }
                <div class="field-inline">
                  <label>Photo</label>
                  <input type="file" accept="image/*" (change)="onEditImage($event)" />
                </div>
                <input [(ngModel)]="editForm.name" placeholder="Nom" />
                <input [(ngModel)]="editForm.description" placeholder="Description" />
                @if (mode === 'cookies') {
                  <input [(ngModel)]="editForm.category" placeholder="Catégorie (ex: Chocolat, Noix)" />
                }
                <input type="number" [(ngModel)]="editForm.price" placeholder="Prix" step="0.01" min="0.01" />
                <input type="number" [(ngModel)]="editForm.stockQuantity" placeholder="Stock" min="0" />
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="editForm.available" />
                  En vente
                </label>
                <div class="row-actions">
                  <button type="button" (click)="saveEdit()" class="btn-save">Enregistrer</button>
                  <button type="button" (click)="cancelEdit()" class="btn-cancel">Annuler</button>
                </div>
              </div>
            } @else {
              <div class="cookie-info">
                @if (item.imageUrl) {
                  <img [src]="item.imageUrl" [alt]="item.name" class="cookie-thumb" />
                }
                <span class="name">{{ item.name }}</span>
                <span class="desc">{{ item.description }}</span>
                <span class="price">{{ item.price | number:'1.2-2' }} €</span>
                <span class="stock" [class.low-stock]="item.stockQuantity <= 10">Stock : {{ item.stockQuantity }}</span>
                <span class="badge type-badge" [class.available]="mode === 'bowls'">
                  {{ mode === 'bowls' ? 'Bol' : 'Cookie' }}
                </span>
                <span class="badge" [class.available]="item.available">
                  {{ item.available ? 'En vente' : 'Rupture' }}
                </span>
              </div>
              <div class="row-actions">
                <button type="button" (click)="startEdit(item)" class="btn-edit">Modifier</button>
                <button type="button" (click)="confirmDelete(item)" class="btn-delete">Supprimer</button>
              </div>
            }
          </div>
        }
      </div>
    }

    @if (showAddForm) {
      <div class="modal-overlay" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>{{ mode === 'bowls' ? 'Nouveau bol' : 'Nouveau cookie' }}</h2>
          <form (ngSubmit)="createItem()">
            <div class="field">
              <label>Photo</label>
              @if (addForm.imageUrl) {
                <div class="img-preview">
                  <img [src]="addForm.imageUrl" alt="" />
                  <button type="button" (click)="addForm.imageUrl = ''" class="btn-remove-img">×</button>
                </div>
              }
              <input type="file" accept="image/*" (change)="onAddImage($event)" />
            </div>
            <div class="field">
              <label>Nom *</label>
              <input [(ngModel)]="addForm.name" name="name" required [placeholder]="mode === 'bowls' ? 'Bol mi-cuit pistache' : 'Cookie au chocolat'" />
            </div>
            <div class="field">
              <label>Description</label>
              <input [(ngModel)]="addForm.description" name="description" placeholder="Description..." />
            </div>
            @if (mode === 'cookies') {
              <div class="field">
                <label>Catégorie</label>
                <input [(ngModel)]="addForm.category" name="category" placeholder="Chocolat, Noix, Fruits..." />
              </div>
            }
            <div class="field">
              <label>Prix (€) *</label>
              <input type="number" [(ngModel)]="addForm.price" name="price" required step="0.01" min="0.01" />
            </div>
            <div class="field">
              <label>Stock</label>
              <input type="number" [(ngModel)]="addForm.stockQuantity" name="stockQuantity" min="0" />
            </div>
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="addForm.available" name="available" />
              Disponible à la vente
            </label>
            <div class="modal-actions">
              <button type="submit" class="btn-primary">Créer</button>
              <button type="button" (click)="closeForm()" class="btn-cancel">Annuler</button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (itemToDelete) {
      <div class="modal-overlay" (click)="cancelDelete()">
        <div class="modal modal-confirm" (click)="$event.stopPropagation()">
          <p>Supprimer « {{ itemToDelete.name }} » ?</p>
          <div class="modal-actions">
            <button type="button" (click)="deleteItem()" class="btn-delete">Supprimer</button>
            <button type="button" (click)="cancelDelete()" class="btn-cancel">Annuler</button>
          </div>
        </div>
      </div>
    }

    @if (showCropModal) {
      <div class="modal-overlay" (click)="cancelCrop()">
        <div class="modal modal-crop" (click)="$event.stopPropagation()">
          <h2>Choisir le cadrage</h2>
          <p class="crop-hint">Cadrage identique à l'affichage catalogue (300×160 px)</p>
          <div class="cropper-wrapper">
            <image-cropper
              [imageChangedEvent]="imageChangedEvent"
              [maintainAspectRatio]="true"
              [aspectRatio]="300 / 160"
              format="jpeg"
              [resizeToWidth]="800"
              [allowMoveImage]="true"
              (imageCropped)="onImageCropped($event)"
              (loadImageFailed)="onLoadImageFailed()"
            />
          </div>
          <div class="modal-actions">
            <button type="button" (click)="confirmCrop()" class="btn-primary" [disabled]="!lastCroppedBlob || cropUploading">
              {{ cropUploading ? 'Upload...' : 'Valider le cadrage' }}
            </button>
            <button type="button" (click)="cancelCrop()" class="btn-cancel">Annuler</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .header-left {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .mode-toggle {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .btn-mode {
      padding: 0.45rem 0.8rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      background: white;
      cursor: pointer;
      font-weight: 600;
    }
    .btn-mode.active {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }
    .btn-add {
      padding: 0.6rem 1.25rem;
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-family: var(--font-sans);
      font-weight: 600;
      cursor: pointer;
    }
    .btn-add:hover { opacity: 0.95; }
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
    .cookies-table { display: flex; flex-direction: column; gap: 0.75rem; }
    .cookie-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: var(--color-surface-elevated);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      flex-wrap: wrap;
    }
    .cookie-info {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .cookie-thumb {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: var(--radius-sm);
    }
    .cookie-info .name { font-weight: 600; min-width: 140px; }
    .cookie-info .desc { color: var(--color-text-muted); font-size: 0.9rem; max-width: 200px; }
    .cookie-info .price { font-weight: 700; color: var(--color-primary); }
    .cookie-info .stock { font-size: 0.9rem; color: var(--color-text-muted); }
    .cookie-info .stock.low-stock { color: var(--color-warning); font-weight: 600; }
    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      background: #fee2e2;
      color: #991b1b;
    }
    .badge.available { background: #d1fae5; color: #047857; }
    .row-actions { display: flex; gap: 0.5rem; }
    .btn-edit, .btn-save {
      padding: 0.4rem 0.75rem;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      cursor: pointer;
    }
    .btn-delete {
      padding: 0.4rem 0.75rem;
      background: transparent;
      color: var(--color-error);
      border: 1px solid var(--color-error);
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      cursor: pointer;
    }
    .type-badge {
      margin-left: 0.25rem;
      background: #f5f5f5;
      color: var(--color-text-muted);
    }
    .type-badge.available {
      background: #fff7ed;
      color: #9a3412;
      border: 1px solid rgba(154, 52, 18, 0.2);
    }
    .btn-delete:hover { background: var(--color-error); color: white; }
    .btn-cancel {
      padding: 0.4rem 0.75rem;
      background: var(--color-border);
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      cursor: pointer;
    }
    .edit-form {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
    }
    .edit-form input { padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border); }
    .edit-form input[type="number"] { width: 90px; }
    .edit-form input:first-child { min-width: 140px; }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal {
      background: white;
      border-radius: var(--radius-lg);
      padding: 2rem;
      max-width: 420px;
      max-height: 90vh;
      overflow: auto;
      width: 100%;
      box-shadow: var(--shadow-lg);
    }
    .modal h2 { margin-bottom: 1.5rem; font-size: 1.25rem; }
    .field {
      margin-bottom: 1rem;
    }
    .field label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.35rem;
      font-size: 0.9rem;
    }
    .field input {
      width: 100%;
      padding: 0.6rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }
    .modal-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .modal-confirm p { margin-bottom: 1.5rem; }
    .img-preview {
      position: relative;
      display: inline-block;
      margin-bottom: 0.5rem;
    }
    .img-preview img {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: var(--radius-md);
    }
    .btn-remove-img {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--color-error);
      color: white;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
      line-height: 1;
    }
    .field-inline { margin-bottom: 0.5rem; }
    .field-inline label { display: block; font-size: 0.9rem; margin-bottom: 0.25rem; }
    .modal-crop {
      max-width: 560px;
      max-height: 90vh;
      overflow: auto;
    }
    .modal-crop h2 { margin-bottom: 0.5rem; }
    .crop-hint {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      margin-bottom: 1rem;
    }
    .cropper-wrapper {
      height: 360px;
      margin-bottom: 1rem;
      overflow: hidden;
    }
    .cropper-wrapper ::ng-deep image-cropper {
      height: 100%;
    }
    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: stretch; }
      .cookie-row { flex-direction: column; align-items: flex-start; }
      .cookie-info { flex-direction: column; }
      .edit-form { flex-direction: column; }
      .modal, .modal-crop { margin: 1rem; max-width: calc(100vw - 2rem); }
      .cropper-wrapper { height: 280px; }
    }
  `]
})
export class AdminCookiesComponent implements OnInit {
  items: Array<Cookie | Bowl> = [];
  loading = true;
  showAddForm = false;
  editingId: number | null = null;
  itemToDelete: Cookie | Bowl | null = null;
  mode: 'cookies' | 'bowls' = 'cookies';

  addForm = {
    name: '',
    description: '',
    category: '' as string,
    price: 2.5,
    stockQuantity: 100,
    available: true,
    imageUrl: '' as string
  };

  editForm = {
    name: '',
    description: '',
    category: '' as string,
    price: 0,
    stockQuantity: 0,
    available: true,
    imageUrl: '' as string
  };

  showCropModal = false;
  imageChangedEvent: Event | null = null;
  pendingCropFor: 'add' | 'edit' = 'add';
  lastCroppedBlob: Blob | null = null;
  cropUploading = false;
  private cropFileInput: HTMLInputElement | null = null;

  constructor(
    private cookieService: CookieService,
    private bowlService: BowlService,
    private imageUpload: ImageUploadService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadItems();
  }

  setMode(next: 'cookies' | 'bowls') {
    this.mode = next;
    this.loadItems();
  }

  loadItems() {
    this.loading = true;
    if (this.mode === 'bowls') {
      this.bowlService.getAll().subscribe({
        next: (data) => {
          this.items = data;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.toast.error(err.error?.message || 'Erreur lors du chargement des bols');
        }
      });
    } else {
      this.cookieService.getIngredients(false).subscribe({
        next: (data) => {
          this.items = data;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.toast.error(err.error?.message || 'Erreur lors du chargement des cookies');
        }
      });
    }
  }

  openForm() {
    if (this.mode === 'bowls') {
      this.addForm = {
        name: '',
        description: '',
        category: '',
        price: 10,
        stockQuantity: 100,
        available: true,
        imageUrl: ''
      };
    } else {
      this.addForm = {
        name: '',
        description: '',
        category: '',
        price: 2.5,
        stockQuantity: 100,
        available: true,
        imageUrl: ''
      };
    }
    this.showAddForm = true;
  }

  onAddImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    this.imageChangedEvent = event;
    this.pendingCropFor = 'add';
    this.lastCroppedBlob = null;
    this.cropFileInput = input;
    this.showCropModal = true;
  }

  onEditImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    this.imageChangedEvent = event;
    this.pendingCropFor = 'edit';
    this.lastCroppedBlob = null;
    this.cropFileInput = input;
    this.showCropModal = true;
  }

  onImageCropped(event: ImageCroppedEvent) {
    if (event.blob) this.lastCroppedBlob = event.blob;
  }

  onLoadImageFailed() {
    this.toast.error('Impossible de charger l\'image');
    this.cancelCrop();
  }

  confirmCrop() {
    if (!this.lastCroppedBlob || this.cropUploading) return;
    this.cropUploading = true;
    this.imageUpload.upload(this.lastCroppedBlob).subscribe({
      next: (res) => {
        if (this.pendingCropFor === 'add') this.addForm.imageUrl = res.url;
        else this.editForm.imageUrl = res.url;
        if (this.cropFileInput) this.cropFileInput.value = '';
        this.cancelCrop();
        this.cropUploading = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Erreur lors de l\'upload');
        this.cropUploading = false;
      }
    });
  }

  cancelCrop() {
    this.showCropModal = false;
    this.imageChangedEvent = null;
    this.lastCroppedBlob = null;
    this.cropFileInput = null;
  }

  closeForm() {
    this.showAddForm = false;
  }

  createItem() {
    if (!this.addForm.name || this.addForm.price < 0.01) return;
    if (this.mode === 'bowls') {
      const payload: Partial<Bowl> = {
        name: this.addForm.name,
        description: this.addForm.description,
        price: this.addForm.price,
        stockQuantity: this.addForm.stockQuantity,
        available: this.addForm.available
      };
      if (this.addForm.imageUrl) payload.imageUrl = this.addForm.imageUrl;
      this.bowlService.create(payload).subscribe({
        next: (created) => {
          this.items = [created, ...this.items];
          this.closeForm();
        },
        error: (err) => this.toast.error(err.error?.message || 'Erreur lors de la création')
      });
    } else {
      const payload: Partial<Cookie> = {
        name: this.addForm.name,
        description: this.addForm.description,
        category: this.addForm.category || undefined,
        price: this.addForm.price,
        stockQuantity: this.addForm.stockQuantity,
        available: this.addForm.available
      };
      if (this.addForm.imageUrl) payload.imageUrl = this.addForm.imageUrl;
      this.cookieService.create(payload).subscribe({
        next: (created) => {
          this.items = [created, ...this.items];
          this.closeForm();
        },
        error: (err) => this.toast.error(err.error?.message || 'Erreur lors de la création')
      });
    }
  }

  startEdit(item: Cookie | Bowl) {
    this.editingId = item.id;
    if (this.mode === 'bowls') {
      const b = item as Bowl;
      this.editForm = {
        name: b.name,
        description: b.description || '',
        category: '',
        price: b.price,
        stockQuantity: b.stockQuantity,
        available: b.available,
        imageUrl: b.imageUrl || ''
      };
    } else {
      const c = item as Cookie;
      this.editForm = {
        name: c.name,
        description: c.description || '',
        category: c.category || '',
        price: c.price,
        stockQuantity: c.stockQuantity,
        available: c.available,
        imageUrl: c.imageUrl || ''
      };
    }
  }

  saveEdit() {
    if (!this.editingId || !this.editForm.name || this.editForm.price < 0.01) return;
    if (this.mode === 'bowls') {
      const payload: Partial<Bowl> = {
        name: this.editForm.name,
        description: this.editForm.description,
        price: this.editForm.price,
        stockQuantity: this.editForm.stockQuantity,
        available: this.editForm.available
      };
      if (this.editForm.imageUrl) payload.imageUrl = this.editForm.imageUrl;
      this.bowlService.update(this.editingId, payload).subscribe({
        next: (updated) => {
          const idx = this.items.findIndex((x) => x.id === this.editingId);
          if (idx >= 0) this.items[idx] = updated;
          this.cancelEdit();
        },
        error: (err) => this.toast.error(err.error?.message || 'Erreur lors de la mise à jour')
      });
    } else {
      const payload: Partial<Cookie> = {
        name: this.editForm.name,
        description: this.editForm.description,
        category: this.editForm.category || undefined,
        price: this.editForm.price,
        stockQuantity: this.editForm.stockQuantity,
        available: this.editForm.available
      };
      if (this.editForm.imageUrl) payload.imageUrl = this.editForm.imageUrl;
      this.cookieService.update(this.editingId, payload).subscribe({
        next: (updated) => {
          const idx = this.items.findIndex((c) => c.id === this.editingId);
          if (idx >= 0) this.items[idx] = updated;
          this.cancelEdit();
        },
        error: (err) => this.toast.error(err.error?.message || 'Erreur lors de la mise à jour')
      });
    }
  }

  cancelEdit() {
    this.editingId = null;
  }

  confirmDelete(item: Cookie | Bowl) {
    this.itemToDelete = item;
  }

  cancelDelete() {
    this.itemToDelete = null;
  }

  deleteItem() {
    if (!this.itemToDelete) return;
    const id = this.itemToDelete.id;
    if (this.mode === 'bowls') {
      this.bowlService.delete(id).subscribe({
        next: () => {
          this.items = this.items.filter((x) => x.id !== id);
          this.cancelDelete();
        },
        error: (err) => this.toast.error(err.error?.message || 'Erreur lors de la suppression')
      });
    } else {
      this.cookieService.delete(id).subscribe({
        next: () => {
          this.items = this.items.filter((c) => c.id !== id);
          this.cancelDelete();
        },
        error: (err) => this.toast.error(err.error?.message || 'Erreur lors de la suppression')
      });
    }
  }
}
