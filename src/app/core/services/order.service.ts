import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, addDoc, getDocs, updateDoc,
  doc, query, orderBy, where, collectionData, serverTimestamp
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Order, OrderStatus } from '../models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private fs   = inject(Firestore);
  private auth = inject(AuthService);

  /** Place an order and return the order ID */
  async placeOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
    const ref = await addDoc(collection(this.fs, 'orders'), {
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Award loyalty points (1 pt per $1 spent)
    if (this.auth.currentUser) {
      await addDoc(collection(this.fs, 'loyalty'), {
        userId:  this.auth.currentUser.uid,
        points:  Math.floor(order.total),
        orderId: order.orderId,
        createdAt: serverTimestamp()
      });
    }

    // Save locally for guest order tracking
    this.saveLocalOrder({ ...order, id: ref.id });

    return ref.id;
  }

  /** Update order status (admin) */
  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await updateDoc(doc(this.fs, 'orders', id), {
      status,
      updatedAt: serverTimestamp()
    });
  }

  /** Get orders for current user (Firestore + localStorage) */
  async getUserOrders(): Promise<Order[]> {
    const user = this.auth.currentUser;
    const byKey = new Map<string, Order>();

    // Load localStorage orders first (works for guests too)
    this.getLocalOrders().forEach(o => byKey.set(o.orderId, o));

    if (user) {
      try {
        // By userId
        const s1 = await getDocs(query(
          collection(this.fs, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        ));
        s1.docs.forEach(d => {
          const o = { id: d.id, ...d.data() } as Order;
          byKey.set(o.orderId, o);
        });

        // By email (covers guest orders linked later)
        if (user.email) {
          const s2 = await getDocs(query(
            collection(this.fs, 'orders'),
            where('customer.email', '==', user.email),
            orderBy('createdAt', 'desc')
          ));
          s2.docs.forEach(d => {
            const o = { id: d.id, ...d.data() } as Order;
            byKey.set(o.orderId, o);
          });
        }
      } catch (e) { console.error('Order load error:', e); }
    }

    return Array.from(byKey.values()).sort((a, b) => {
      const da = (a as any).createdAt?.toDate?.()?.getTime() ?? new Date((a as any).createdAtLocal ?? 0).getTime();
      const db = (b as any).createdAt?.toDate?.()?.getTime() ?? new Date((b as any).createdAtLocal ?? 0).getTime();
      return db - da;
    });
  }

  /** Real-time orders stream (admin) */
  getAllOrdersLive(): Observable<Order[]> {
    const q = query(collection(this.fs, 'orders'), orderBy('createdAt', 'desc'));
    return (collectionData(q, { idField: 'id' }) as Observable<Order[]>).pipe(
      catchError(() => of([] as Order[]))
    );
  }

  /** Loyalty points for user */
  async getLoyaltyPoints(uid: string): Promise<number> {
    const snap = await getDocs(query(
      collection(this.fs, 'loyalty'),
      where('userId', '==', uid)
    ));
    return snap.docs.reduce((s, d) => s + ((d.data() as any).points ?? 0), 0);
  }

  // ── Local order persistence (for guests) ──────────

  saveLocalOrder(order: Partial<Order>): void {
    const existing = this.getLocalOrders().filter(o => o.orderId !== order.orderId);
    existing.unshift({ ...order, createdAtLocal: new Date().toISOString() } as any);
    localStorage.setItem('hs_recent_orders', JSON.stringify(existing.slice(0, 20)));
  }

  getLocalOrders(): Order[] {
    try { return JSON.parse(localStorage.getItem('hs_recent_orders') ?? '[]'); }
    catch { return []; }
  }

  generateOrderId(): string {
    return 'HS-' + Date.now().toString(36).toUpperCase().slice(-6);
  }
}
