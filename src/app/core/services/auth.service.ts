import { Injectable, inject, signal } from '@angular/core';
import {
  Auth, signInWithPopup, signInWithRedirect, getRedirectResult,
  GoogleAuthProvider, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, sendEmailVerification,
  updateProfile, sendPasswordResetEmail, signOut, onAuthStateChanged,
  User
} from '@angular/fire/auth';
import {
  Firestore, doc, setDoc, getDoc, serverTimestamp
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { UserProfile } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth   = inject(Auth);
  private fs     = inject(Firestore);
  private router = inject(Router);

  readonly user      = signal<User | null>(null);
  readonly profile   = signal<UserProfile | null>(null);
  readonly isAdmin   = signal(false);
  readonly loading   = signal(true);

  private gProvider = new GoogleAuthProvider();

  constructor() {
    this.gProvider.addScope('email');
    this.gProvider.addScope('profile');

    // Handle redirect result first
    getRedirectResult(this.auth).then(result => {
      if (result?.user) this.onSignedIn(result.user);
    }).catch(() => {});

    // Auth state observer
    onAuthStateChanged(this.auth, async user => {
      this.user.set(user);
      if (user) {
        await this.onSignedIn(user);
      } else {
        this.profile.set(null);
        this.isAdmin.set(false);
      }
      this.loading.set(false);
    });
  }

  /** Google sign-in: popup with redirect fallback */
  async signInWithGoogle(): Promise<void> {
    try {
      const result = await signInWithPopup(this.auth, this.gProvider);
      await this.onSignedIn(result.user);
    } catch (err: any) {
      const blocked = [
        'auth/popup-blocked',
        'auth/popup-closed-by-user',
        'auth/unauthorized-domain',
        'auth/operation-not-supported-in-this-environment'
      ];
      if (blocked.includes(err.code)) {
        await signInWithRedirect(this.auth, this.gProvider);
      } else {
        throw err;
      }
    }
  }

  /** Email sign-in */
  async signInWithEmail(email: string, password: string): Promise<void> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    await this.onSignedIn(cred.user);
  }

  /** Create account + send verification */
  async createAccount(name: string, email: string, password: string): Promise<void> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await sendEmailVerification(cred.user, { url: window.location.origin + '/' });

    const profile: UserProfile = {
      uid: cred.user.uid,
      displayName: name,
      email,
      emailVerified: false,
      role: 'customer',
      loyaltyPoints: 0,
      orderCount: 0,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };
    await setDoc(doc(this.fs, 'users', cred.user.uid), profile);
    this.profile.set(profile);
  }

  /** Resend verification email */
  async resendVerification(): Promise<void> {
    if (this.auth.currentUser) {
      await sendEmailVerification(this.auth.currentUser, { url: window.location.origin + '/' });
    }
  }

  /** Password reset */
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email, { url: window.location.origin + '/' });
  }

  /** Sign out */
  async signOut(): Promise<void> {
    await signOut(this.auth);
    this.profile.set(null);
    this.isAdmin.set(false);
    this.router.navigate(['/']);
  }

  /** Load profile + check admin */
  private async onSignedIn(user: User): Promise<void> {
    this.user.set(user);

    // Check admin
    const adminByEmail = environment.adminEmails.includes(user.email ?? '');
    let adminByFirestore = false;
    try {
      const snap = await getDoc(doc(this.fs, 'admins', user.uid));
      adminByFirestore = snap.exists();
    } catch {}
    this.isAdmin.set(adminByEmail || adminByFirestore);

    // Load / create profile
    try {
      const snap = await getDoc(doc(this.fs, 'users', user.uid));
      if (snap.exists()) {
        this.profile.set(snap.data() as UserProfile);
        await setDoc(doc(this.fs, 'users', user.uid), { lastLogin: serverTimestamp() }, { merge: true });
      } else {
        const profile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName ?? '',
          email: user.email ?? '',
          photoURL: user.photoURL ?? undefined,
          emailVerified: user.emailVerified,
          role: (adminByEmail || adminByFirestore) ? 'admin' : 'customer',
          loyaltyPoints: 0,
          orderCount: 0,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        };
        await setDoc(doc(this.fs, 'users', user.uid), profile);
        this.profile.set(profile);
      }
    } catch {}
  }

  get currentUser(): User | null { return this.auth.currentUser; }
}
