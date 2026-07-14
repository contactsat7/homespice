import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from '../models';

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CartItem[]>(this.load());

  readonly count    = computed(() => this.items().reduce((s, i) => s + i.qty, 0));
  readonly subtotal = computed(() => this.items().reduce((s, i) => s + i.price * i.qty, 0));
  readonly gst      = computed(() => this.subtotal() * 0.10);
  readonly total    = computed(() => this.subtotal() + this.gst());

  add(item: Omit<CartItem, 'qty'>): void {
    this.items.update(cart => {
      const existing = cart.find(c => c.id === item.id);
      if (existing) {
        return cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...cart, { ...item, qty: 1 }];
    });
    this.save();
  }

  remove(id: string): void {
    this.items.update(cart => cart.filter(c => c.id !== id));
    this.save();
  }

  updateQty(id: string, delta: number): void {
    this.items.update(cart => {
      const updated = cart.map(c => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c)
                         .filter(c => c.qty > 0);
      return updated;
    });
    this.save();
  }

  clear(): void {
    this.items.set([]);
    localStorage.removeItem('hs_cart');
  }

  private save(): void {
    localStorage.setItem('hs_cart', JSON.stringify(this.items()));
  }

  private load(): CartItem[] {
    try { return JSON.parse(localStorage.getItem('hs_cart') ?? '[]'); }
    catch { return []; }
  }
}
