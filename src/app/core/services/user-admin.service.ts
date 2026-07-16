import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore, collection, collectionData, query, orderBy,
  doc, setDoc, deleteDoc, getDoc
} from '@angular/fire/firestore';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserProfile } from '../models';

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private fs = inject(Firestore);

  readonly users  = signal<UserProfile[]>([]);
  readonly loading = signal(true);
  private loaded = false;

  loadAll(): void {
    if (this.loaded) return;
    this.loaded = true;
    const q = query(collection(this.fs, 'users'), orderBy('createdAt', 'desc'));
    collectionData(q, { idField: 'uid' }).pipe(
      catchError(err => { console.error('User list load error:', err); return of([]); })
    ).subscribe(items => {
      this.users.set(items as UserProfile[]);
      this.loading.set(false);
    });
  }

  async isAdminUid(uid: string): Promise<boolean> {
    const snap = await getDoc(doc(this.fs, 'admins', uid));
    return snap.exists();
  }

  async grantAdmin(uid: string, grantedByEmail: string): Promise<void> {
    await setDoc(doc(this.fs, 'admins', uid), { grantedAt: new Date().toISOString(), grantedBy: grantedByEmail });
  }

  async revokeAdmin(uid: string): Promise<void> {
    await deleteDoc(doc(this.fs, 'admins', uid));
  }
}
