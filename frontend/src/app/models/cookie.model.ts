export interface Cookie {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  category?: string;
  available: boolean;
}

export interface CartItem {
  cookieId: number;
  cookieName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/** Élément d'une box (cookie + quantité) */
export interface BoxItem {
  cookieId: number;
  cookieName: string;
  quantity: number;
  unitPrice: number;
}

/** Entrée du panier : cookie seul ou box de 6 */
export type CartEntry =
  | { type: 'cookie'; cookieId: number; cookieName: string; quantity: number; unitPrice: number; subtotal: number }
  | { type: 'box'; boxId: string; items: BoxItem[]; subtotal: number };
