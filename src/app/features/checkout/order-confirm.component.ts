import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models';

@Component({
  selector: 'hs-order-confirm',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  template: `
  <section class="section" style="background:var(--bg);min-height:80vh;display:flex;align-items:center">
    <div class="container">
      <div style="text-align:center;background:var(--bg-card);border-radius:24px;padding:3.5rem 2rem;max-width:560px;margin:0 auto;box-shadow:var(--shadow-l)">
        <div style="font-size:4rem;margin-bottom:1rem">🎉</div>
        <h2 style="color:var(--green);margin-bottom:.7rem">Order Confirmed!</h2>
        <p style="font-size:1.05rem;margin-bottom:1.5rem">Thank you for your order! We're preparing your food with love.</p>

        <div style="background:var(--green-l);border-radius:8px;padding:1.2rem;margin-bottom:1.5rem;text-align:left">
          <p style="font-size:.85rem;font-weight:600;margin-bottom:.4rem">Order ID: <span style="color:var(--green);font-family:monospace">{{ orderId() }}</span></p>
          @if (order()?.ewayTransactionId) {
            <p style="font-size:.82rem">eWAY Transaction: <span style="font-family:monospace;color:var(--green)">{{ order()?.ewayTransactionId }}</span></p>
          }
          <p style="font-size:.82rem;margin-top:.4rem">A confirmation email has been sent to <strong>{{ order()?.customer?.email }}</strong>.</p>
        </div>

        @if (order()) {
          <div style="text-align:left;margin-bottom:1.5rem">
            <h4 style="margin-bottom:.75rem;font-family:'Playfair Display',serif">Order Details</h4>
            @for (item of order()!.items; track item.id) {
              <div style="display:flex;justify-content:space-between;padding:.4rem 0;border-bottom:1px solid var(--border);font-size:.88rem">
                <span>{{ item.name }} × {{ item.qty }}</span>
                <strong>{{ (item.price * item.qty) | currency:'AUD':'symbol-narrow':'1.2-2' }}</strong>
              </div>
            }
            <div style="display:flex;justify-content:space-between;padding:.6rem 0;font-weight:700;font-size:1rem;color:var(--green)">
              <span>Total Paid</span>
              <span>{{ order()!.total | currency:'AUD':'symbol-narrow':'1.2-2' }}</span>
            </div>
          </div>
        }

        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
          <a routerLink="/menu" class="btn btn-g">Order More 🍛</a>
          <a routerLink="/orders" class="btn btn-ol">View Orders</a>
          <a routerLink="/" class="btn btn-ol">Back to Home</a>
        </div>
        <p style="font-size:.78rem;color:var(--text-light);margin-top:1.5rem">
          Questions? Call <a href="tel:+61452635262" style="color:var(--green)">+61 452 635 262</a>
        </p>
      </div>
    </div>
  </section>
  `,
})
export class OrderConfirmComponent implements OnInit {
  route  = inject(ActivatedRoute);
  orders = inject(OrderService);

  orderId = signal('');
  order   = signal<Order | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.orderId.set(id);
    // Load from localStorage (works for both guests and logged in)
    const local = this.orders.getLocalOrders().find(o => o.orderId === id);
    if (local) this.order.set(local);
  }
}
