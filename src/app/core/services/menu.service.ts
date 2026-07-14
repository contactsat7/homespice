import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp, getDocs, writeBatch
} from '@angular/fire/firestore';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MenuItem, SEED_MENU } from '../models';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private fs = inject(Firestore);

  readonly items   = signal<MenuItem[]>([]);
  readonly loading = signal(true);

  constructor() { this.loadMenu(); }

  /** Stream all menu items ordered by category */
  loadMenu(): void {
    const ref = collection(this.fs, 'menu');
    const q   = query(ref, orderBy('category'), orderBy('name'));
    collectionData(q, { idField: 'id' }).pipe(
      catchError(() => of([]))
    ).subscribe(items => {
      if (items.length === 0) {
        // Seed on first run
        this.seedMenu().then(() => this.loadMenu());
      } else {
        this.items.set(items as MenuItem[]);
        this.loading.set(false);
      }
    });
  }

  /** Seed Firestore with initial menu items (runs once) */
  async seedMenu(): Promise<void> {
    const ref   = collection(this.fs, 'menu');
    const batch = writeBatch(this.fs);
    SEED_MENU.forEach(item => {
      const docRef = doc(ref);
      batch.set(docRef, { ...item, createdAt: serverTimestamp() });
    });
    await batch.commit();
  }

  /** Add new item */
  async addItem(item: Omit<MenuItem, 'id'>): Promise<void> {
    await addDoc(collection(this.fs, 'menu'), {
      ...item,
      available: true,
      createdAt: serverTimestamp()
    });
  }

  /** Update existing item */
  async updateItem(id: string, changes: Partial<MenuItem>): Promise<void> {
    await updateDoc(doc(this.fs, 'menu', id), {
      ...changes,
      updatedAt: serverTimestamp()
    });
  }

  /** Toggle availability */
  async toggleAvailability(id: string, available: boolean): Promise<void> {
    await updateDoc(doc(this.fs, 'menu', id), { available, updatedAt: serverTimestamp() });
  }

  /** Delete item */
  async deleteItem(id: string): Promise<void> {
    await deleteDoc(doc(this.fs, 'menu', id));
  }

  /** Get items by category */
  getByCategory(category: string): MenuItem[] {
    if (category === 'All') return this.items();
    return this.items().filter(i => i.category === category);
  }

  /** Featured items for homepage */
  getFeatured(): MenuItem[] {
    const featured = ['Butter Chicken', 'Chicken Biryani', 'Paneer Butter Masala',
                      'Masala Dosa', 'Chicken Tikka', 'Mango Lassi'];
    return this.items().filter(i => featured.includes(i.name)).slice(0, 6);
  }
}
