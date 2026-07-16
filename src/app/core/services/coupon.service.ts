import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp, getDocs, where, increment
} from '@angular/fire/firestore';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Coupon } from '../models';

export interface CouponResult {
  ok: boolean;
  message: string;
  discount?: number;
  coupon?: Coupon;
}

@Injectable({ providedIn: 'root' })
export class CouponService {
  private fs = inject(Firestore);

  readonly coupons = signal<Coupon[]>([]);
  readonly loading = signal(true);
  private loaded = false;

  /** Admin: live list of all coupons */
  loadAll(): void {
    if (this.loaded) return;
    this.loaded = true;
    const q = query(collection(this.fs, 'coupons'), orderBy('createdAt', 'desc'));
    collectionData(q, { idField: 'id' }).pipe(
      catchError(err => { console.error('Coupon load error:', err); return of([]); })
    ).subscribe(items => {
      this.coupons.set(items as Coupon[]);
      this.loading.set(false);
    });
  }

  async addCoupon(c: Omit<Coupon, 'id' | 'usedCount'>): Promise<void> {
    await addDoc(collection(this.fs, 'coupons'), {
      ...c,
      code: c.code.trim().toUpperCase(),
      usedCount: 0,
      createdAt: serverTimestamp()
    });
  }

  async updateCoupon(id: string, changes: Partial<Coupon>): Promise<void> {
    const payload: any = { ...changes };
    if (payload.code) payload.code = payload.code.trim().toUpperCase();
    await updateDoc(doc(this.fs, 'coupons', id), payload);
  }

  async deleteCoupon(id: string): Promise<void> {
    await deleteDoc(doc(this.fs, 'coupons', id));
  }

  /** Checkout: validate a code against a cart subtotal. Public read of active coupons is allowed by rules. */
  async validate(code: string, subtotal: number): Promise<CouponResult> {
    const clean = code.trim().toUpperCase();
    if (!clean) return { ok: false, message: 'Enter a coupon code.' };

    const snap = await getDocs(query(collection(this.fs, 'coupons'), where('code', '==', clean)));
    if (snap.empty) return { ok: false, message: 'Coupon not found.' };

    const d = snap.docs[0];
    const coupon = { id: d.id, ...d.data() } as Coupon;

    if (!coupon.active) return { ok: false, message: 'This coupon is no longer active.' };
    if (coupon.expiresAt?.toDate && coupon.expiresAt.toDate() < new Date()) {
      return { ok: false, message: 'This coupon has expired.' };
    }
    if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
      return { ok: false, message: 'This coupon has reached its usage limit.' };
    }
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      return { ok: false, message: `Minimum order of $${coupon.minOrder.toFixed(2)} required for this coupon.` };
    }

    const discount = coupon.type === 'percent'
      ? Math.round(subtotal * (coupon.value / 100) * 100) / 100
      : Math.min(coupon.value, subtotal);

    return { ok: true, message: `Coupon applied: ${coupon.type === 'percent' ? coupon.value + '% off' : '$' + coupon.value.toFixed(2) + ' off'}`, discount, coupon };
  }

  /** Called after a successful order that used a coupon */
  async recordUsage(couponId: string): Promise<void> {
    try { await updateDoc(doc(this.fs, 'coupons', couponId), { usedCount: increment(1) }); }
    catch (e) { console.error('Coupon usage update failed:', e); }
  }
}
