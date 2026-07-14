import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'hs-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, FormsModule],
  template: `
  <div class="pg-hd">
    <div class="container">
      <h1>Checkout</h1>
      <p>Complete your order securely</p>
      <div class="bc"><a routerLink="/">Home</a> / Checkout</div>
    </div>
  </div>

  <section class="section" style="background:var(--bg)">
    <div class="container">
      @if (cart.items().length === 0) {
        <div style="text-align:center;padding:4rem;background:var(--bg-card);border-radius:24px;box-shadow:var(--shadow-s)">
          <div style="font-size:3rem;margin-bottom:1rem">🛒</div>
          <h3>Your cart is empty</h3>
          <p style="margin-bottom:1.5rem">Add some delicious dishes first!</p>
          <a routerLink="/menu" class="btn btn-g btn-lg">Browse Menu</a>
        </div>
      } @else {
        <div class="co-grid">
          <!-- LEFT: customer details + payment -->
          <div>
            <div class="co-card" style="margin-bottom:1.5rem">
              <h3>👤 Your Details</h3>
              <div class="fg-row">
                <div class="fg"><label>Full Name *</label><input type="text" class="fc" [(ngModel)]="name" placeholder="John Smith"></div>
                <div class="fg"><label>Phone *</label><input type="tel" class="fc" [(ngModel)]="phone" placeholder="+61 4XX XXX XXX"></div>
              </div>
              <div class="fg"><label>Email Address *</label><input type="email" class="fc" [(ngModel)]="email" [placeholder]="auth.user()?.email || 'john@email.com'"></div>
              <div class="fg"><label>Delivery Address</label><input type="text" class="fc" [(ngModel)]="address" placeholder="Street, Suburb, State, Postcode"></div>
              <div class="fg-row">
                <div class="fg">
                  <label>Order Type</label>
                  <select class="fc" [(ngModel)]="orderType">
                    <option value="delivery">🚚 Delivery</option>
                    <option value="pickup">🏪 Pickup</option>
                  </select>
                </div>
                <div class="fg"><label>Special Instructions</label><input type="text" class="fc" [(ngModel)]="notes" placeholder="Allergies, spice level…"></div>
              </div>
            </div>

            <div class="co-card">
              <h3>💳 Payment Method</h3>
              <div style="margin-top:.75rem">
                <label class="popt" [class.sel]="payMethod()==='eway'" (click)="payMethod.set('eway')">
                  <input type="radio" name="pay" value="eway" [checked]="payMethod()==='eway'">
                  <div>
                    💳 <strong>Pay Online (eWAY — Secure Australian Payments)</strong>
                    <div style="font-size:.75rem;color:var(--text-light);margin-top:.25rem">🔒 Secure card payment · Visa, Mastercard, Amex · Australian payments</div>
                  </div>
                </label>
                <label class="popt" [class.sel]="payMethod()==='cash'" (click)="payMethod.set('cash')">
                  <input type="radio" name="pay" value="cash" [checked]="payMethod()==='cash'">
                  💵 <strong>Cash on Pickup / Delivery</strong>
                </label>
              </div>

              @if (payMethod() === 'eway') {
                <div style="background:var(--bg-alt);border-radius:8px;padding:1rem;margin-top:.75rem">
                  <div class="fg">
                    <label>Card Number</label>
                    <input type="text" class="fc" [(ngModel)]="cardNum" placeholder="1234 5678 9012 3456" maxlength="19" (input)="formatCard()">
                  </div>
                  <div class="fg-row">
                    <div class="fg"><label>Expiry (MM/YY)</label><input type="text" class="fc" [(ngModel)]="cardExp" placeholder="MM/YY" maxlength="5"></div>
                    <div class="fg"><label>CVV</label><input type="text" class="fc" [(ngModel)]="cardCvv" placeholder="123" maxlength="3"></div>
                  </div>
                  <p style="font-size:.72rem;color:var(--text-light)">🔒 Your payment is processed securely by eWAY. Jaannz Spicy Spoon never stores card details.</p>
                </div>
              }
            </div>
          </div>

          <!-- RIGHT: order summary -->
          <div>
            <div class="co-card" style="position:sticky;top:90px">
              <h3>📋 Order Summary</h3>
              @for (item of cart.items(); track item.id) {
                <div class="co-item">
                  <img [src]="item.image" [alt]="item.name" (error)="onImgErr($event)">
                  <div><div class="co-nm">{{ item.name }}</div><div class="co-qt">× {{ item.qty }}</div></div>
                  <div class="co-pr">{{ (item.price * item.qty) | currency:'AUD':'symbol-narrow':'1.2-2' }}</div>
                </div>
              }
              <div style="margin-top:1rem">
                <div class="sum-row"><span>Subtotal</span><span>{{ cart.subtotal() | currency:'AUD':'symbol-narrow':'1.2-2' }}</span></div>
                <div class="sum-row"><span>GST (10%)</span><span>{{ cart.gst() | currency:'AUD':'symbol-narrow':'1.2-2' }}</span></div>
                <div class="sum-row"><span>Delivery</span><span style="color:var(--green)">Free</span></div>
                <div class="sum-row tot"><span>Total</span><span>{{ cart.total() | currency:'AUD':'symbol-narrow':'1.2-2' }}</span></div>
              </div>

              @if (auth.user()) {
                <div style="background:var(--gold-l);border-radius:8px;padding:.7rem 1rem;margin:1rem 0;font-size:.8rem">
                  🌟 You'll earn <strong>{{ cart.total() | number:'1.0-0' }}</strong> loyalty points with this order!
                </div>
              }

              <div style="background:var(--green-ll);border-radius:8px;padding:.7rem 1rem;margin:1rem 0;font-size:.78rem;color:var(--text-mid)">
                💡 <strong>No account needed!</strong> Order as a guest. Sign in to earn loyalty points &amp; track orders.
              </div>

              <button class="btn btn-g btn-lg" style="width:100%;justify-content:center" (click)="placeOrder()" [disabled]="placing()">
                {{ placing() ? 'Placing Order…' : 'Place Order →' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  </section>
  `,
})
export class CheckoutComponent implements OnInit {
  cart    = inject(CartService);
  orders  = inject(OrderService);
  auth    = inject(AuthService);
  toast   = inject(ToastService);
  router  = inject(Router);

  name     = '';  phone = '';  email = '';  address = '';
  notes    = '';  cardNum = '';  cardExp = '';  cardCvv = '';
  orderType = 'delivery';
  payMethod = signal<'eway'|'cash'>('eway');
  placing   = signal(false);

  ngOnInit() {
    // Pre-fill from logged-in user
    const user = this.auth.user();
    if (user) {
      this.email = user.email ?? '';
      this.name  = user.displayName ?? '';
    }
  }

  formatCard() {
    this.cardNum = this.cardNum.replace(/\D/g,'').slice(0,16).replace(/(\d{4})(?=\d)/g,'$1 ');
  }
  onImgErr(e: Event) { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=80&q=60'; }

  async placeOrder() {
    if (!this.name.trim())  { this.toast.error('Please enter your name.'); return; }
    if (!this.phone.trim()) { this.toast.error('Please enter your phone number.'); return; }
    if (!this.email.trim()) { this.toast.error('Please enter your email.'); return; }
    if (this.cart.items().length === 0) { this.toast.error('Your cart is empty!'); return; }

    this.placing.set(true);

    const orderId = this.orders.generateOrderId();

    try {
      // For eWAY: in production redirect to eWAY hosted page
      // For now we simulate a successful transaction with a fake transaction ID
      const ewayTransactionId = this.payMethod() === 'eway'
        ? 'EWAY-' + Date.now().toString(36).toUpperCase()
        : undefined;
      const ewayAuthCode = this.payMethod() === 'eway' ? '123456' : undefined;

      await this.orders.placeOrder({
        orderId,
        customer: {
          name:      this.name.trim(),
          phone:     this.phone.trim(),
          email:     this.email.trim(),
          address:   this.address.trim(),
          orderType: this.orderType as 'delivery'|'pickup',
          notes:     this.notes.trim()
        },
        items:          this.cart.items(),
        subtotal:       this.cart.subtotal(),
        gst:            this.cart.gst(),
        total:          this.cart.total(),
        paymentMethod:  this.payMethod(),
        ewayTransactionId,
        ewayAuthCode,
        status:         this.payMethod() === 'eway' ? 'confirmed' : 'confirmed',
        userId:         this.auth.currentUser?.uid ?? null as any,
        tableNum:       localStorage.getItem('hs_table') ?? null
      });

      this.cart.clear();
      this.router.navigate(['/order-confirm', orderId]);
    } catch (e: any) {
      this.toast.error('Order failed: ' + (e.message || 'Please try again.'));
    } finally {
      this.placing.set(false);
    }
  }
}
