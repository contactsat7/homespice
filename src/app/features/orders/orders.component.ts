import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models';

@Component({
  selector: 'hs-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
  <div class="pg-hd">
    <div class="container">
      <h1>My Orders</h1>
      <p>Your order history and loyalty points</p>
      <div class="bc"><a routerLink="/">Home</a> / My Orders</div>
    </div>
  </div>

  <section class="section" style="background:var(--bg)">
    <div class="container" style="max-width:820px">

      @if (!auth.user() && localOrders().length === 0) {
        <!-- Not signed in, no local orders -->
        <div style="text-align:center;padding:3rem;background:var(--bg-card);border-radius:24px;box-shadow:var(--shadow-s)">
          <div style="font-size:3rem;margin-bottom:1rem">🔒</div>
          <h3>Track Your Orders</h3>
          <p style="margin-bottom:1.5rem">Sign in to see your full order history, or check your recent guest orders below.</p>
          <button class="btn btn-g btn-lg" routerLink="/" [queryParams]="{auth:'1'}">Sign In with Google</button>
        </div>
      } @else {
        <!-- Header row -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">
          <h3 style="font-family:'Playfair Display',serif">
            {{ auth.user() ? 'Your Order History' : 'Recent Guest Orders' }}
          </h3>
          @if (loyaltyPts() > 0) {
            <div class="loyalty-bar">🌟 {{ loyaltyPts() }} Loyalty Points</div>
          }
        </div>

        @if (loading()) {
          <div style="text-align:center;padding:2rem;color:var(--text-light)">Loading orders…</div>
        } @else if (orders().length === 0) {
          <div style="text-align:center;padding:3rem;background:var(--bg-card);border-radius:16px;box-shadow:var(--shadow-s)">
            <div style="font-size:2.5rem;margin-bottom:.75rem">📦</div>
            <p>No orders yet — go ahead and order something delicious! 🍛</p>
            <a routerLink="/menu" class="btn btn-g" style="margin-top:1rem;display:inline-flex">Browse Menu</a>
          </div>
        } @else {
          @for (o of orders(); track o.orderId) {
            <div class="oh-card">
              <div class="oh-hd">
                <span class="oh-date">📅 {{ formatDate(o) }} · #{{ o.orderId }}</span>
                <span class="oh-st" [ngClass]="statusClass(o.status)">{{ (o.status || '').replace('_',' ') }}</span>
              </div>
              @if (o.ewayTransactionId) {
                <div style="font-size:.75rem;color:var(--text-light);margin-bottom:.4rem">
                  🔒 eWAY Ref: <span style="font-family:monospace">{{ o.ewayTransactionId }}</span>
                </div>
              }
              <div class="oh-items">{{ itemsSummary(o) }}</div>
              <div class="oh-ft">
                <span>💳 {{ o.paymentMethod === 'eway' ? 'Card (eWAY)' : 'Cash' }}</span>
                <strong>{{ o.total | currency:'AUD':'symbol-narrow':'1.2-2' }}</strong>
              </div>
            </div>
          }
        }
      }
    </div>
  </section>
  `,
  styles: [`
    .loyalty-bar { background:linear-gradient(90deg,#e65100,#FFB300);color:#1a1209;border-radius:50px;padding:.35rem 1rem;font-size:.75rem;font-weight:700;display:inline-flex;align-items:center;gap:.4rem; }
  `]
})
export class OrdersComponent implements OnInit {
  auth    = inject(AuthService);
  orderSvc = inject(OrderService);

  orders      = signal<Order[]>([]);
  localOrders = signal<Order[]>([]);
  loading     = signal(true);
  loyaltyPts  = signal(0);

  async ngOnInit() {
    this.localOrders.set(this.orderSvc.getLocalOrders());
    const all = await this.orderSvc.getUserOrders();
    this.orders.set(all);
    this.loading.set(false);
    if (this.auth.currentUser) {
      const pts = await this.orderSvc.getLoyaltyPoints(this.auth.currentUser.uid);
      this.loyaltyPts.set(pts);
    }
  }

  formatDate(o: any): string {
    if (o.createdAt?.toDate) return o.createdAt.toDate().toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    if (o.createdAtLocal)    return new Date(o.createdAtLocal).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    return 'Recent';
  }

  itemsSummary(o: Order): string {
    return (o.items||[]).map(i => `${i.name} ×${i.qty}`).join(', ');
  }

  statusClass(status?: string): Record<string,boolean> {
    const s = (status||'confirmed').replace(/_/g,'');
    return { [`st${s}`]: true };
  }
}
