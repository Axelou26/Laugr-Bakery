import { Injectable, signal, computed } from '@angular/core';
import { CartEntry, BoxItem } from '../models/cookie.model';

const BOX_SIZE = 6;
const BOX_PRICE = 18;
const CART_STORAGE_KEY = 'laugr-cart-v1';
/** Durée de conservation du panier dans le navigateur (dernière modification). */
const CART_TTL_MS = 60 * 60 * 1000;

function loadPersistedCart(): CartEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { savedAt?: number; entries?: CartEntry[] };
    if (
      typeof parsed?.savedAt !== 'number' ||
      !Array.isArray(parsed.entries)
    ) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
    if (Date.now() - parsed.savedAt > CART_TTL_MS) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
    return parsed.entries;
  } catch {
    return [];
  }
}

function writePersistedCart(entries: CartEntry[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (entries.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ savedAt: Date.now(), entries })
    );
  } catch {
    /* quota navigateur, mode privé strict, etc. */
  }
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartEntries = signal<CartEntry[]>(loadPersistedCart());

  private persist(): void {
    writePersistedCart(this.cartEntries());
  }

  items = this.cartEntries.asReadonly();

  totalItems = computed(() =>
    this.cartEntries().reduce((sum, entry) => {
      if (entry.type === 'cookie') return sum + entry.quantity;
      return sum + entry.items.reduce((s, i) => s + i.quantity, 0);
    }, 0)
  );

  totalPrice = computed(() =>
    this.cartEntries().reduce((sum, entry) => sum + entry.subtotal, 0)
  );

  addItem(cookieId: number, cookieName: string, unitPrice: number, quantity = 1) {
    const current = this.cartEntries();
    const existing = current.find(
      (e) => e.type === 'cookie' && e.cookieId === cookieId
    );

    const updated: CartEntry[] = existing
      ? current.map((e) =>
          e.type === 'cookie' && e.cookieId === cookieId
            ? {
                ...e,
                quantity: e.quantity + quantity,
                subtotal: (e.quantity + quantity) * unitPrice
              }
            : e
        )
      : [
          ...current,
          {
            type: 'cookie' as const,
            cookieId,
            cookieName,
            quantity,
            unitPrice,
            subtotal: quantity * unitPrice
          }
        ];
    this.cartEntries.set(updated);
    this.persist();
  }

  addBox(items: BoxItem[]) {
    const total = items.reduce((s, i) => s + i.quantity, 0);
    if (total !== BOX_SIZE) return false;
    const boxId = `box-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.cartEntries.update((entries) => [
      ...entries,
      { type: 'box', boxId, items, subtotal: BOX_PRICE }
    ]);
    this.persist();
    return true;
  }

  removeItem(cookieId: number) {
    this.cartEntries.update((entries) =>
      entries.filter(
        (e) => !(e.type === 'cookie' && e.cookieId === cookieId)
      )
    );
    this.persist();
  }

  removeBox(boxId: string) {
    this.cartEntries.update((entries) =>
      entries.filter((e) => !(e.type === 'box' && e.boxId === boxId))
    );
    this.persist();
  }

  updateQuantity(cookieId: number, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(cookieId);
      return;
    }
    this.cartEntries.update((entries) =>
      entries.map((e) =>
        e.type === 'cookie' && e.cookieId === cookieId
          ? { ...e, quantity, subtotal: quantity * e.unitPrice }
          : e
      )
    );
    this.persist();
  }

  clear() {
    this.cartEntries.set([]);
    this.persist();
  }

  getQuantityForCookie(cookieId: number): number {
    return this.cartEntries().reduce((sum, entry) => {
      if (entry.type === 'cookie' && entry.cookieId === cookieId)
        return sum + entry.quantity;
      if (entry.type === 'box') {
        const inBox = entry.items.find((i) => i.cookieId === cookieId);
        return sum + (inBox?.quantity ?? 0);
      }
      return sum;
    }, 0);
  }

  getItemsForCheckout(): {
    cartItems: { cookieId: number; cookieName: string; quantity: number; unitPrice: number; subtotal: number }[];
    boxes: { items: { cookieId: number; quantity: number }[] }[];
  } {
    const cartItemsByCookie: Record<
      number,
      { cookieName: string; quantity: number; unitPrice: number; subtotal: number }
    > = {};
    const boxes: { items: { cookieId: number; quantity: number }[] }[] = [];

    for (const entry of this.cartEntries()) {
      if (entry.type === 'cookie') {
        const current = cartItemsByCookie[entry.cookieId];
        const quantity = (current?.quantity ?? 0) + entry.quantity;
        // On agrège par cookieId. Ici, on s'attend à ce que tous les “bols” du même cookie aient le même unitPrice.
        const unitPrice = entry.unitPrice;
        cartItemsByCookie[entry.cookieId] = {
          cookieName: entry.cookieName,
          quantity,
          unitPrice,
          subtotal: quantity * unitPrice
        };
      } else {
        boxes.push({
          items: entry.items.map((i) => ({ cookieId: i.cookieId, quantity: i.quantity }))
        });
      }
    }
    const cartItems = Object.entries(cartItemsByCookie).map(([id, v]) => ({
      cookieId: +id,
      cookieName: v.cookieName,
      quantity: v.quantity,
      unitPrice: v.unitPrice,
      subtotal: v.subtotal
    }));
    return { cartItems, boxes };
  }
}
