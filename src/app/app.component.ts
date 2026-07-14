import { Component, inject, signal, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'hs-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  template: `
  <!-- LOADING SCREEN -->
  @if (loading()) {
    <div class="loader" [class.gone]="!loading()">
      <img src="/logo.png" alt="Jaannz Spicy Spoon" class="ld-logo">
      <div class="ld-name">Jaannz Spicy Spoon</div>
      <div class="ld-bar"><div class="ld-fill"></div></div>
      <div class="ld-txt">Preparing something delicious…</div>
    </div>
  }

  <!-- NAVBAR -->
  <nav id="nav" [class.scrolled]="scrolled()">
    <div class="container">
      <div class="nav-in">
        <!-- Hamburger LEFT on mobile -->
        <button class="ham" [class.open]="mobileOpen()" (click)="toggleMobile()" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>

        <!-- Logo -->
        <a routerLink="/" class="nav-logo">
          <div class="nav-logo-ring"><img src="/logo.png" alt="Jaannz Spicy Spoon logo"></div>
          <div>
            <span class="nl-name">Jaannz Spicy Spoon</span>
            <span class="nl-tag">Malaysian &amp; Indian Cuisine</span>
          </div>
        </a>

        <!-- Desktop links -->
        <ul class="nav-links">
          <li><a routerLink="/" routerLinkActive="act" [routerLinkActiveOptions]="{exact:true}">Home</a></li>
          <li><a routerLink="/menu" routerLinkActive="act">Menu</a></li>
          <li><a routerLink="/about" routerLinkActive="act">About</a></li>
          <li><a routerLink="/contact" routerLinkActive="act">Contact</a></li>
          @if (auth.user()) {
            <li><a routerLink="/orders" routerLinkActive="act">My Orders</a></li>
          }
          @if (auth.isAdmin()) {
            <li><a routerLink="/admin" routerLinkActive="act" class="admin-link">⭐ Admin</a></li>
          }
        </ul>

        <!-- Right controls -->
        <div class="nav-r">
          <!-- Cart -->
          <button class="cart-ico" (click)="cartOpen.set(true)" title="Cart">
            🛒
            @if (cart.count() > 0) {
              <span class="cbadge">{{ cart.count() }}</span>
            }
          </button>

          <!-- Auth button -->
          @if (auth.user()) {
            <div class="user-bar">
              <span>👤 {{ auth.user()?.displayName || auth.user()?.email }}</span>
              @if (auth.isAdmin()) { <span class="admin-badge">Admin</span> }
            </div>
            <button class="btn btn-au btn-sm" (click)="auth.signOut()">Sign Out</button>
          } @else {
            <button class="btn btn-au btn-sm" (click)="authOpen.set(true)">Sign In</button>
          }
        </div>
      </div>
    </div>
  </nav>

  <!-- MOBILE DRAWER -->
  <div class="mob-menu" [class.open]="mobileOpen()">
    <a routerLink="/" (click)="mobileOpen.set(false)">🏠 Home</a>
    <a routerLink="/menu" (click)="mobileOpen.set(false)">🍽️ Menu</a>
    <a routerLink="/about" (click)="mobileOpen.set(false)">ℹ️ About Us</a>
    <a routerLink="/contact" (click)="mobileOpen.set(false)">📍 Contact</a>
    <a routerLink="/checkout" (click)="mobileOpen.set(false)">🛒 Cart &amp; Order</a>
    @if (auth.user()) {
      <a routerLink="/orders" (click)="mobileOpen.set(false)">📦 My Orders</a>
    }
    @if (auth.isAdmin()) {
      <a routerLink="/admin" (click)="mobileOpen.set(false)">⭐ Admin Dashboard</a>
    }
    @if (!auth.user()) {
      <a href="#" (click)="$event.preventDefault(); authOpen.set(true); mobileOpen.set(false)">👤 Sign In / Register</a>
    } @else {
      <a href="#" (click)="$event.preventDefault(); auth.signOut(); mobileOpen.set(false)">👤 Sign Out</a>
    }
    <button class="btn btn-au" style="margin-top:1rem;width:100%;justify-content:center"
      routerLink="/checkout" (click)="mobileOpen.set(false)">🛒 Order Now</button>
  </div>
  <div class="mob-ov" [class.open]="mobileOpen()" (click)="mobileOpen.set(false)"></div>

  <!-- PAGE CONTENT -->
  <main>
    <router-outlet />
  </main>

  <!-- FOOTER -->
  <footer id="site-footer">
    <div class="container">
      <div class="foot-g">
        <div class="foot-br">
          <div class="nav-logo" style="margin-bottom:1rem">
            <div class="nav-logo-ring" style="width:38px;height:38px;font-size:1.1rem"><img src="/logo.png" alt="Jaannz Spicy Spoon logo"></div>
            <div><span class="nl-name" style="color:var(--gold)">Jaannz Spicy Spoon</span>
                 <span class="nl-tag" style="color:rgba(255,215,0,.7)">Malaysian &amp; Indian Cuisine</span></div>
          </div>
          <p>Authentic Malaysian and Indian flavours — Malaysian Chinese, South Indian and North Indian dishes made with fresh ingredients, traditional recipes and aromatic spices.</p>
          <div class="aus-flag-line">🇦🇺 Proudly serving Kardinya, Perth WA</div>
          <div class="foot-socials">
            <a class="fsoc" href="#" title="Facebook">f</a>
            <a class="fsoc" href="#" title="Instagram">📷</a>
            <a class="fsoc" href="https://wa.me/61452635262" title="WhatsApp">💬</a>
          </div>
        </div>
        <div class="foot-col"><h4>Quick Links</h4><ul>
          <li><a routerLink="/">Home</a></li>
          <li><a routerLink="/menu">Our Menu</a></li>
          <li><a routerLink="/about">About Us</a></li>
          <li><a routerLink="/contact">Contact</a></li>
          <li><a routerLink="/checkout">Order Online</a></li>
        </ul></div>
        <div class="foot-col"><h4>Menu</h4><ul>
          <li><a routerLink="/menu" [queryParams]="{cat:'Breakfast'}">Breakfast</a></li>
          <li><a routerLink="/menu" [queryParams]="{cat:'Lunch'}">Lunch</a></li>
          <li><a routerLink="/menu" [queryParams]="{cat:'Snacks'}">Snacks</a></li>
          <li><a routerLink="/menu" [queryParams]="{cat:'Dinner'}">Dinner</a></li>
          <li><a routerLink="/menu" [queryParams]="{cat:'Drinks'}">Drinks</a></li>
        </ul></div>
        <div class="foot-col"><h4>Info</h4><ul>
          <li><a routerLink="/privacy">Privacy Policy</a></li>
          <li><a href="#" (click)="$event.preventDefault(); authOpen.set(true)">My Account</a></li>
          <li><a routerLink="/orders">Order History</a></li>
          @if (auth.isAdmin()) {
            <li><a routerLink="/admin">Admin Dashboard</a></li>
          }
        </ul></div>
      </div>
      <div class="foot-disc">⚠️ <strong>Disclaimer:</strong> Food images are for illustration purposes only. Actual dishes may differ in appearance from photographs. All food is freshly prepared using traditional recipes and fresh ingredients.</div>
      <div class="foot-bot">
        <p>© 2026 Jaannz Spicy Spoon. All rights reserved.</p>
        <p>Built with ❤️ in 🇦🇺 Australia</p>
        <p><a routerLink="/privacy" style="color:var(--gold)">Privacy Policy</a></p>
      </div>
    </div>
  </footer>

  <!-- CART SIDEBAR -->
  <div class="cart-ov" [class.open]="cartOpen()" (click)="cartOpen.set(false)"></div>
  <div class="cart-sb" [class.open]="cartOpen()">
    <div class="cart-hd">
      <h3>🛒 Your Cart</h3>
      <button class="cart-cls" (click)="cartOpen.set(false)">✕</button>
    </div>
    <div class="cart-bd">
      @if (cart.items().length === 0) {
        <div class="cart-empty">
          <span class="ce-ico">🛒</span>
          <p>Your cart is empty.<br>Add something delicious!</p>
        </div>
      } @else {
        @for (item of cart.items(); track item.id) {
          <div class="citem">
            <img [src]="item.image" [alt]="item.name" loading="lazy">
            <div class="ci-info">
              <div class="ci-nm">{{ item.name }}</div>
              <div class="ci-pr">{{ (item.price * item.qty) | currency:'AUD':'symbol-narrow':'1.2-2' }}</div>
              <div class="qty-c">
                <button class="qbtn" (click)="cart.updateQty(item.id, -1)">−</button>
                <span class="qv">{{ item.qty }}</span>
                <button class="qbtn" (click)="cart.updateQty(item.id, 1)">+</button>
              </div>
            </div>
            <span class="crm" (click)="cart.remove(item.id)" title="Remove">✕</span>
          </div>
        }
      }
    </div>
    <div class="cart-ft">
      <div class="cart-tot">
        <span>Total</span>
        <span>{{ cart.total() | currency:'AUD':'symbol-narrow':'1.2-2' }}</span>
      </div>
      <p class="cart-note">💡 <a href="#" (click)="$event.preventDefault(); authOpen.set(true); cartOpen.set(false)">Sign in</a> to earn loyalty points. Optional — order as guest anytime!</p>
      <a class="btn btn-g" style="width:100%;justify-content:center" routerLink="/checkout" (click)="cartOpen.set(false)">
        Proceed to Checkout →
      </a>
    </div>
  </div>

  <!-- AUTH MODAL -->
  <div class="auth-ov" [class.open]="authOpen()" (click)="onAuthOverlayClick($event)">
    <div class="auth-m">
      <div class="auth-hd">
        <h3 id="auth-title">{{ signupMode() ? 'Create Account' : 'Sign In to Jaannz Spicy Spoon' }}</h3>
        <button class="auth-cls" (click)="closeAuth()">✕</button>
      </div>
      <div class="auth-bd" id="auth-body">
        @if (signupSuccess()) {
          <div style="text-align:center;padding:1rem 0">
            <div style="font-size:3.5rem;margin-bottom:.75rem">📧</div>
            <h3 style="color:var(--green);margin-bottom:.6rem">Account Created!</h3>
            <p style="margin-bottom:.4rem">Welcome, <strong>{{ signupName() }}</strong>! 🎉</p>
            <p style="font-size:.88rem;color:var(--mid);margin-bottom:1.2rem;line-height:1.65">
              A verification email was sent to <strong style="color:var(--green)">{{ signupEmail() }}</strong>.
              Click the link to activate your account.
            </p>
            <button class="btn btn-g" style="width:100%;justify-content:center" (click)="closeAuth()">Continue &amp; Order Now 🍛</button>
          </div>
        } @else {
          <!-- Error box -->
          @if (authError()) {
            <div class="auth-error" [innerHTML]="authError()"></div>
          }
          <!-- Optional note -->
          <div class="auth-note">🔓 Signing in is <strong>optional</strong>. Order as a guest anytime. Sign in to track orders &amp; earn loyalty points.</div>

          <!-- Google -->
          <button class="g-btn" (click)="signInGoogle()" [disabled]="authLoading()">
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            {{ authLoading() ? 'Connecting…' : 'Continue with Google' }}
          </button>
          <div class="divider-or"><span>or use email</span></div>

          <!-- Sign-in view -->
          @if (!signupMode()) {
            <div class="fg">
              <label>Email Address</label>
              <input type="email" class="fc" [(ngModel)]="authEmail" placeholder="you@example.com" autocomplete="email">
            </div>
            <div class="fg">
              <label style="display:flex;justify-content:space-between">
                Password
                <a href="#" (click)="$event.preventDefault(); forgotPassword()" style="font-size:.75rem;color:var(--green)">Forgot password?</a>
              </label>
              <input type="password" class="fc" [(ngModel)]="authPass" placeholder="Password" autocomplete="current-password">
            </div>
            <button class="btn btn-g" style="width:100%;justify-content:center;margin-bottom:.75rem" (click)="signInEmail()" [disabled]="authLoading()">
              {{ authLoading() ? 'Signing in…' : 'Sign In' }}
            </button>
            <p style="text-align:center;font-size:.82rem">
              New here? <a href="#" (click)="$event.preventDefault(); signupMode.set(true); authError.set('')" style="color:var(--green);font-weight:600">Create a free account</a>
            </p>
          }

          <!-- Sign-up view -->
          @if (signupMode()) {
            <div class="fg">
              <label>Full Name <span style="color:#c62828">*</span></label>
              <input type="text" class="fc" [(ngModel)]="authName" placeholder="Jane Smith" autocomplete="name">
            </div>
            <div class="fg">
              <label>Email Address <span style="color:#c62828">*</span></label>
              <input type="email" class="fc" [(ngModel)]="authEmail" placeholder="jane@example.com" autocomplete="email">
            </div>
            <div class="fg">
              <label>Password <span style="color:#c62828">*</span></label>
              <input type="password" class="fc" [(ngModel)]="authPass" placeholder="Min 6 characters" autocomplete="new-password">
            </div>
            <div class="fg">
              <label>Confirm Password <span style="color:#c62828">*</span></label>
              <input type="password" class="fc" [(ngModel)]="authPass2" placeholder="Re-enter password" autocomplete="new-password">
            </div>
            <button class="btn btn-g" style="width:100%;justify-content:center;margin-bottom:.75rem" (click)="createAccount()" [disabled]="authLoading()">
              {{ authLoading() ? 'Creating…' : 'Create Account' }}
            </button>
            <p style="text-align:center;font-size:.82rem">
              Have an account? <a href="#" (click)="$event.preventDefault(); signupMode.set(false); authError.set('')" style="color:var(--green);font-weight:600">Sign in</a>
            </p>
          }
        }
      </div>
    </div>
  </div>

  <!-- TOAST CONTAINER -->
  <div class="t-wrap">
    @for (toast of toastService.toasts(); track toast.id) {
      <div class="toast" [class.ok]="toast.type==='success'" [class.err]="toast.type==='error'" (click)="toastService.dismiss(toast.id)">
        {{ toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️' }} {{ toast.message }}
      </div>
    }
  </div>

  <!-- FLOATING BUTTONS -->
  <div class="floats">
    <a class="fl-btn fl-wa" href="https://wa.me/61452635262?text=Hi%20Jaannz%20Spicy%20Spoon!" title="WhatsApp">💬</a>
    @if (scrolled()) {
      <button class="fl-btn fl-up" (click)="scrollTop()" title="Back to top">↑</button>
    }
  </div>
  `,
})
export class AppComponent implements OnInit {
  auth         = inject(AuthService);
  cart         = inject(CartService);
  toastService = inject(ToastService);

  loading = signal(true);
  scrolled   = signal(false);
  mobileOpen = signal(false);
  cartOpen   = signal(false);
  authOpen   = signal(false);

  // Auth form state
  authEmail  = '';
  authPass   = '';
  authPass2  = '';
  authName   = '';
  authError  = signal('');
  authLoading = signal(false);
  signupMode  = signal(false);
  signupSuccess = signal(false);
  signupEmail  = signal('');
  signupName   = signal('');

  ngOnInit() {
    setTimeout(() => this.loading.set(false), 1900);
  }

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 60); }

  toggleMobile() { this.mobileOpen.update(v => !v); }
  scrollTop()    { window.scrollTo({ top: 0, behavior: 'smooth' }); }

  onAuthOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('auth-ov')) this.closeAuth();
  }

  closeAuth() {
    this.authOpen.set(false);
    setTimeout(() => {
      this.authError.set('');
      this.signupMode.set(false);
      this.signupSuccess.set(false);
      this.authEmail = '';
      this.authPass  = '';
      this.authPass2 = '';
      this.authName  = '';
    }, 300);
  }

  async signInGoogle() {
    this.authLoading.set(true);
    this.authError.set('');
    try {
      await this.auth.signInWithGoogle();
      this.closeAuth();
    } catch (e: any) {
      this.authError.set('Google sign-in failed: ' + (e.message || e.code));
    } finally {
      this.authLoading.set(false);
    }
  }

  async signInEmail() {
    if (!this.authEmail || !this.authPass) { this.authError.set('Please enter email and password.'); return; }
    this.authLoading.set(true);
    this.authError.set('');
    try {
      await this.auth.signInWithEmail(this.authEmail, this.authPass);
      this.closeAuth();
      this.toastService.success('Welcome back! 🌶️');
    } catch (e: any) {
      const code = e.code ?? '';
      this.authError.set(
        code === 'auth/user-not-found'    ? 'No account with this email.' :
        code === 'auth/wrong-password'    ? 'Incorrect password.' :
        code === 'auth/invalid-credential'? 'Incorrect email or password.' :
        code === 'auth/too-many-requests' ? 'Too many attempts. Try again later.' :
        'Sign in failed: ' + (e.message || code)
      );
    } finally {
      this.authLoading.set(false);
    }
  }

  async createAccount() {
    this.authError.set('');
    if (!this.authName.trim())  { this.authError.set('Please enter your full name.'); return; }
    if (!this.authEmail.trim()) { this.authError.set('Please enter your email.'); return; }
    if (!this.authPass)         { this.authError.set('Please choose a password.'); return; }
    if (this.authPass.length < 6) { this.authError.set('Password must be at least 6 characters.'); return; }
    if (this.authPass !== this.authPass2) { this.authError.set('Passwords do not match.'); return; }

    this.authLoading.set(true);
    try {
      await this.auth.createAccount(this.authName.trim(), this.authEmail.trim(), this.authPass);
      this.signupName.set(this.authName.trim());
      this.signupEmail.set(this.authEmail.trim());
      this.signupSuccess.set(true);
    } catch (e: any) {
      const code = e.code ?? '';
      this.authError.set(
        code === 'auth/email-already-in-use' ? 'An account with this email already exists.' :
        code === 'auth/weak-password'        ? 'Password is too weak.' :
        'Sign up failed: ' + (e.message || code)
      );
    } finally {
      this.authLoading.set(false);
    }
  }

  async forgotPassword() {
    if (!this.authEmail) { this.authError.set('Enter your email above first.'); return; }
    try {
      await this.auth.resetPassword(this.authEmail);
      this.toastService.success('Password reset email sent! Check your inbox 📧');
      this.authError.set('');
    } catch (e: any) {
      this.authError.set('Reset failed: ' + (e.message || e.code));
    }
  }
}
