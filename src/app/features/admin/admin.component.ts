import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { CouponService } from '../../core/services/coupon.service';
import { UserAdminService } from '../../core/services/user-admin.service';
import { MenuItem, Order, Coupon, UserProfile } from '../../core/models';
import { scheduleLabel } from '../../core/models/availability';

const DAY_OPTS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

@Component({
  selector: 'hs-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, FormsModule],
  template: `
  <div style="padding-top:70px">
    <div class="adm-wrap">
      <!-- SIDEBAR -->
      <div class="adm-side">
        <div class="adm-logo">
          <div class="adm-logo-t">Jaannz Spicy Spoon</div>
          <div class="adm-logo-s">Admin Dashboard</div>
        </div>
        <nav class="adm-nav">
          <a [class.on]="tab()==='overview'" (click)="tab.set('overview')">📊 Overview</a>
          <a [class.on]="tab()==='menu'" (click)="tab.set('menu')">🍽️ Menu Items</a>
          <a [class.on]="tab()==='coupons'" (click)="tab.set('coupons');coupons.loadAll()">🏷️ Coupons</a>
          <a [class.on]="tab()==='orders'" (click)="tab.set('orders')">📦 Orders</a>
          <a [class.on]="tab()==='users'" (click)="tab.set('users');userAdmin.loadAll()">👥 Users</a>
          <a [class.on]="tab()==='qr'" (click)="tab.set('qr')">📱 QR Codes</a>
        </nav>
        <div style="position:absolute;bottom:2rem;left:0;right:0;padding:0 1.5rem">
          <p style="font-size:.72rem;color:rgba(255,255,255,.45);margin-bottom:.5rem;word-break:break-all">{{ auth.user()?.email }}</p>
          <button class="btn btn-ow btn-sm" style="width:100%;justify-content:center" (click)="auth.signOut()">Sign Out</button>
        </div>
      </div>

      <!-- CONTENT -->
      <div class="adm-content">

        <!-- Mobile tab bar -->
        <div style="display:none" class="mob-tab-bar">
          <button [class.on]="tab()==='overview'" (click)="tab.set('overview')">📊</button>
          <button [class.on]="tab()==='menu'" (click)="tab.set('menu')">🍽️</button>
          <button [class.on]="tab()==='coupons'" (click)="tab.set('coupons');coupons.loadAll()">🏷️</button>
          <button [class.on]="tab()==='orders'" (click)="tab.set('orders')">📦</button>
          <button [class.on]="tab()==='users'" (click)="tab.set('users');userAdmin.loadAll()">👥</button>
          <button [class.on]="tab()==='qr'" (click)="tab.set('qr')">📱</button>
        </div>

        <!-- OVERVIEW / ANALYTICS -->
        @if (tab() === 'overview') {
          <div class="adm-topbar">
            <h2>Dashboard Overview</h2>
            <div style="font-size:.85rem;color:var(--text-light)">👤 {{ auth.user()?.displayName || auth.user()?.email }}</div>
          </div>

          <div class="stat-cards">
            <div class="s-card"><div class="si">📦</div><span class="sv">{{ allOrders().length }}</span><span class="sl">Total Orders</span></div>
            <div class="s-card"><div class="si">💰</div><span class="sv">{{ todayRevenue() | currency:'AUD':'symbol-narrow':'1.0-0' }}</span><span class="sl">Today's Revenue</span></div>
            <div class="s-card"><div class="si">🍽️</div><span class="sv">{{ menuService.items().length }}</span><span class="sl">Menu Items</span></div>
            <div class="s-card"><div class="si">⏳</div><span class="sv">{{ pendingCount() }}</span><span class="sl">Pending</span></div>
          </div>

          <div class="an-grid">
            <!-- Popular dishes -->
            <div class="co-card">
              <h3 style="margin-bottom:1rem">🔥 Most Popular Dishes</h3>
              @if (popularDishes().length === 0) {
                <p style="color:var(--text-light);font-size:.85rem">No orders yet — this fills in once you start taking orders.</p>
              }
              @for (d of popularDishes(); track d.name) {
                <div class="bar-row">
                  <span class="bar-lbl">{{ d.name }}</span>
                  <div class="bar-track"><div class="bar-fill" [style.width.%]="(d.qty / maxDishQty()) * 100"></div></div>
                  <span class="bar-val">{{ d.qty }}</span>
                </div>
              }
            </div>

            <!-- Orders by hour -->
            <div class="co-card">
              <h3 style="margin-bottom:1rem">🕐 Orders by Time of Day</h3>
              <div class="hr-chart">
                @for (h of ordersByHour(); track $index) {
                  <div class="hr-col" [title]="$index + ':00 — ' + h + ' orders'">
                    <div class="hr-bar" [style.height.%]="maxHourCount() ? (h / maxHourCount()) * 100 : 0"></div>
                    @if ($index % 3 === 0) { <span class="hr-lbl">{{ $index }}</span> }
                  </div>
                }
              </div>
              <p style="font-size:.72rem;color:var(--text-light);margin-top:.5rem">Hour of day (24h, local time) — helps with staffing decisions.</p>
            </div>

            <!-- Revenue last 7 days -->
            <div class="co-card">
              <h3 style="margin-bottom:1rem">📈 Revenue — Last 7 Days</h3>
              <div class="hr-chart" style="height:110px">
                @for (d of revenueByDay(); track d.label) {
                  <div class="hr-col" [title]="d.label + ': $' + d.amount.toFixed(2)">
                    <div class="hr-bar" style="background:var(--gold)" [style.height.%]="maxDayRevenue() ? (d.amount / maxDayRevenue()) * 100 : 0"></div>
                    <span class="hr-lbl">{{ d.label }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Top areas -->
            <div class="co-card">
              <h3 style="margin-bottom:1rem">📍 Top Delivery Areas</h3>
              @if (topAreas().length === 0) {
                <p style="color:var(--text-light);font-size:.85rem">No delivery address data yet.</p>
              }
              @for (a of topAreas(); track a.area) {
                <div class="bar-row">
                  <span class="bar-lbl">{{ a.area }}</span>
                  <div class="bar-track"><div class="bar-fill" style="background:var(--green-d)" [style.width.%]="(a.count / maxAreaCount()) * 100"></div></div>
                  <span class="bar-val">{{ a.count }}</span>
                </div>
              }
            </div>
          </div>

          <div class="co-card">
            <h3 style="margin-bottom:1.2rem">Recent Orders</h3>
            @for (o of allOrders().slice(0,5); track o.orderId) {
              <div class="oh-card" style="margin-bottom:.75rem">
                <div class="oh-hd">
                  <span class="oh-date">#{{ o.orderId }} · {{ formatDate(o) }}</span>
                  <span class="oh-st" [ngClass]="stClass(o.status)">{{ (o.status||'').replace('_',' ') }}</span>
                </div>
                <div class="oh-ft"><span>{{ o.customer?.name || 'Guest' }}</span><strong>{{ o.total | currency:'AUD':'symbol-narrow':'1.2-2' }}</strong></div>
              </div>
            }
            @if (allOrders().length === 0) { <p style="color:var(--text-light)">No orders yet.</p> }
          </div>
        }

        <!-- MENU MANAGEMENT -->
        @if (tab() === 'menu') {
          <div class="adm-topbar">
            <h2>Menu Management</h2>
            <button class="btn btn-g" (click)="openAddItem()">+ Add New Item</button>
          </div>
          <div style="display:flex;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap">
            <input type="text" class="fc" style="max-width:280px" placeholder="🔍 Search items…" [(ngModel)]="menuSearch">
            <select class="fc" style="max-width:180px" [(ngModel)]="menuCatFilter">
              <option value="">All Categories</option>
              <option>Breakfast</option><option>Lunch</option>
              <option>Snacks</option><option>Dinner</option><option>Drinks</option>
            </select>
            @if (menuService.items().length === 0) {
              <button class="btn btn-ol btn-sm" (click)="seedMenuData()" title="Seed Firestore with starter menu data">🌱 Seed Starter Menu</button>
            }
          </div>
          <div style="overflow-x:auto">
            <table class="adm-tbl">
              <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Diet</th><th>Availability</th><th>Actions</th></tr></thead>
              <tbody>
                @for (item of filteredAdmMenu(); track item.id) {
                  <tr [class.row-off]="!item.available">
                    <td><img [src]="item.image" [alt]="item.name" style="width:50px;height:50px;object-fit:cover;border-radius:8px" (error)="onImgErr($event)"></td>
                    <td><strong>{{ item.name }}</strong><br><small style="color:var(--text-light)">{{ (item.description || '').slice(0,50) }}…</small></td>
                    <td><span class="cat-chip">{{ item.category }}</span></td>
                    <td>
                      <strong>{{ (item.discountActive && item.discountPercent ? item.price*(1-item.discountPercent/100) : item.price) | currency:'AUD':'symbol-narrow':'1.2-2' }}</strong>
                      @if (item.discountActive && item.discountPercent) {
                        <br><small style="text-decoration:line-through;color:var(--text-light)">{{ item.price | currency:'AUD':'symbol-narrow':'1.2-2' }}</small>
                        <span class="cat-chip" style="background:#c62828;color:#fff;margin-left:.3rem">-{{ item.discountPercent }}%</span>
                      }
                    </td>
                    <td><span class="diet-chip" [ngClass]="'diet-'+item.diet">{{ dietLabel(item.diet) }}</span></td>
                    <td>
                      <label class="tgl-sw">
                        <input type="checkbox" [checked]="item.available" (change)="toggleAvail(item.id, $any($event.target).checked)">
                        <span class="tgl-sl"></span>
                      </label>
                      @if (item.scheduleEnabled) {
                        <div style="font-size:.68rem;color:var(--text-light);margin-top:.3rem">🕐 {{ schedLabel(item) }}</div>
                      }
                    </td>
                    <td style="white-space:nowrap">
                      <button class="abtn abtn-e" (click)="openEditItem(item)">✏️ Edit</button>
                      <button class="abtn abtn-d" style="margin-left:.3rem" (click)="deleteItem(item.id)">🗑️</button>
                    </td>
                  </tr>
                }
                @if (filteredAdmMenu().length === 0) {
                  <tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-light)">No items found</td></tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- COUPONS -->
        @if (tab() === 'coupons') {
          <div class="adm-topbar">
            <h2>Coupons &amp; Discounts</h2>
            <button class="btn btn-g" (click)="openAddCoupon()">+ New Coupon</button>
          </div>
          <div style="overflow-x:auto">
            <table class="adm-tbl">
              <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Usage</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                @for (c of coupons.coupons(); track c.id) {
                  <tr>
                    <td><code>{{ c.code }}</code></td>
                    <td>{{ c.type === 'percent' ? 'Percentage' : 'Fixed amount' }}</td>
                    <td><strong>{{ c.type === 'percent' ? c.value + '%' : ('$' + c.value.toFixed(2)) }}</strong></td>
                    <td>{{ c.minOrder ? ('$' + c.minOrder.toFixed(2)) : '—' }}</td>
                    <td>{{ c.usedCount || 0 }}{{ c.usageLimit ? ' / ' + c.usageLimit : '' }}</td>
                    <td>{{ c.expiresAt?.toDate ? (c.expiresAt.toDate() | date:'d MMM y') : 'Never' }}</td>
                    <td>
                      <label class="tgl-sw">
                        <input type="checkbox" [checked]="c.active" (change)="toggleCoupon(c, $any($event.target).checked)">
                        <span class="tgl-sl"></span>
                      </label>
                    </td>
                    <td style="white-space:nowrap">
                      <button class="abtn abtn-e" (click)="openEditCoupon(c)">✏️ Edit</button>
                      <button class="abtn abtn-d" style="margin-left:.3rem" (click)="deleteCoupon(c.id!)">🗑️</button>
                    </td>
                  </tr>
                }
                @if (coupons.coupons().length === 0) {
                  <tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-light)">No coupons yet — create one to offer a discount at checkout.</td></tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- ORDERS -->
        @if (tab() === 'orders') {
          <div class="adm-topbar">
            <h2>Order Management</h2>
            <span style="font-size:.82rem;color:var(--text-light)">Real-time updates</span>
          </div>
          <div style="overflow-x:auto">
            <table class="adm-tbl">
              <thead><tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                @for (o of allOrders().slice(0,50); track o.orderId) {
                  <tr>
                    <td><code style="font-size:.72rem">{{ o.orderId }}</code></td>
                    <td style="font-size:.8rem">{{ formatDate(o) }}</td>
                    <td><strong>{{ o.customer?.name || 'Guest' }}</strong><br><small>{{ o.customer?.email }}</small></td>
                    <td style="max-width:180px;font-size:.78rem">{{ itemsSummary(o) }}</td>
                    <td style="font-size:.78rem">
                      {{ o.paymentMethod === 'eway' ? '💳 Card (eWAY)' : '💵 Cash' }}
                      @if (o.couponCode) { <br><span class="cat-chip">🏷️ {{ o.couponCode }}</span> }
                    </td>
                    <td>
                      <strong>{{ o.total | currency:'AUD':'symbol-narrow':'1.2-2' }}</strong>
                      @if (o.discount) { <br><small style="color:var(--green)">-{{ o.discount | currency:'AUD':'symbol-narrow':'1.2-2' }} off</small> }
                    </td>
                    <td>{{ o.customer?.orderType || 'Delivery' }}</td>
                    <td>
                      <select class="st-sel" [value]="o.status" (change)="updateStatus(o.id!, $any($event.target).value)">
                        <option value="pending_payment">pending payment</option>
                        <option value="confirmed">confirmed</option>
                        <option value="preparing">preparing</option>
                        <option value="ready">ready</option>
                        <option value="out_for_delivery">out for delivery</option>
                        <option value="delivered">delivered</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </td>
                  </tr>
                }
                @if (allOrders().length === 0) {
                  <tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-light)">No orders yet</td></tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- USERS -->
        @if (tab() === 'users') {
          <div class="adm-topbar">
            <h2>User Management</h2>
            <span style="font-size:.82rem;color:var(--text-light)">{{ userAdmin.users().length }} registered accounts</span>
          </div>
          <div style="overflow-x:auto">
            <table class="adm-tbl">
              <thead><tr><th>User</th><th>Loyalty Pts</th><th>Orders</th><th>Joined</th><th>Role</th><th>Actions</th></tr></thead>
              <tbody>
                @for (u of userAdmin.users(); track u.uid) {
                  <tr>
                    <td><strong>{{ u.displayName || '—' }}</strong><br><small style="color:var(--text-light)">{{ u.email }}</small></td>
                    <td>{{ u.loyaltyPoints || 0 }}</td>
                    <td>{{ u.orderCount || 0 }}</td>
                    <td style="font-size:.8rem">{{ u.createdAt?.toDate ? (u.createdAt.toDate() | date:'d MMM y') : '—' }}</td>
                    <td><span class="cat-chip" [style.background]="u.role==='admin' ? 'var(--green)' : ''" [style.color]="u.role==='admin' ? '#fff' : ''">{{ u.role || 'customer' }}</span></td>
                    <td>
                      @if (u.role !== 'admin') {
                        <button class="abtn abtn-e" (click)="promote(u)">⬆️ Make Admin</button>
                      } @else if (u.email !== auth.user()?.email) {
                        <button class="abtn abtn-d" (click)="demote(u)">⬇️ Remove Admin</button>
                      } @else {
                        <span style="font-size:.75rem;color:var(--text-light)">You</span>
                      }
                    </td>
                  </tr>
                }
                @if (userAdmin.users().length === 0 && !userAdmin.loading()) {
                  <tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-light)">No registered users yet — guests can still order without an account.</td></tr>
                }
              </tbody>
            </table>
          </div>
          <p style="font-size:.75rem;color:var(--text-light);margin-top:1rem">🔒 For everyone's safety, card and payment details are never stored by this app — eWAY processes and holds those. This table only shows account and loyalty info.</p>
        }

        <!-- QR CODES -->
        @if (tab() === 'qr') {
          <div class="adm-topbar">
            <h2>QR Code Generator</h2>
          </div>
          <p style="margin-bottom:1rem;color:var(--text-mid)">Each table gets a unique URL. Customers scan to see the menu and order directly.</p>
          <div class="qr-grid">
            @for (t of tables; track t) {
              <div class="qr-card">
                <div class="qr-ph"><span class="qr-ph-ico">📱</span><div style="font-size:.65rem;color:var(--text-light);margin-top:.4rem;word-break:break-all">{{ qrUrl(t) }}</div></div>
                <div class="qr-lbl">Table {{ t }}</div>
                <button class="abtn abtn-e" style="width:100%;justify-content:center" (click)="copyQR(t)">📋 Copy Link</button>
              </div>
            }
          </div>
        }

      </div>
    </div>
  </div>

  <!-- ADD / EDIT MENU ITEM MODAL -->
  @if (showItemModal()) {
    <div class="amodal-ov" (click)="onModalOverlay($event)">
      <div class="amodal">
        <div class="amodal-hd">
          <h3>{{ editingId() ? 'Edit Menu Item' : 'Add Menu Item' }}</h3>
          <button class="auth-cls" (click)="showItemModal.set(false)">✕</button>
        </div>
        <div class="amodal-bd">
          <div class="fg-row">
            <div class="fg"><label>Item Name *</label><input type="text" class="fc" [(ngModel)]="form.name" placeholder="Butter Chicken"></div>
            <div class="fg"><label>Category *</label>
              <select class="fc" [(ngModel)]="form.category">
                <option>Breakfast</option><option>Lunch</option>
                <option>Snacks</option><option>Dinner</option><option>Drinks</option>
              </select>
            </div>
          </div>
          <div class="fg-row">
            <div class="fg"><label>Price (AUD) *</label><input type="number" class="fc" [(ngModel)]="form.price" placeholder="19.90" step="0.10" min="0"></div>
            <div class="fg"><label>Diet Type</label>
              <select class="fc" [(ngModel)]="form.diet">
                <option value="veg">🌱 Vegetarian</option>
                <option value="vegan">🥗 Vegan</option>
                <option value="nonveg">🍗 Non-Vegetarian</option>
              </select>
            </div>
          </div>
          <div class="fg"><label>Description *</label><textarea class="fc" [(ngModel)]="form.description" rows="2" placeholder="Describe the dish…"></textarea></div>
          <div class="fg"><label>Ingredients</label><input type="text" class="fc" [(ngModel)]="form.ingredients" placeholder="Chicken, tomato, cream…"></div>
          <div class="fg">
            <label>Image URL</label>
            <input type="url" class="fc" [(ngModel)]="form.image" placeholder="https://images.unsplash.com/…">
            <button class="btn btn-ol btn-sm" style="margin-top:.5rem" (click)="previewImage()">Preview Image</button>
            @if (previewSrc()) {
              <img [src]="previewSrc()" alt="Preview" class="img-preview">
            }
          </div>

          <div class="sub-panel">
            <label class="chk-lbl"><input type="checkbox" [(ngModel)]="form.discountActive"> 🏷️ Discount active on this item</label>
            @if (form.discountActive) {
              <div class="fg" style="margin-top:.5rem"><label>Discount %</label><input type="number" class="fc" [(ngModel)]="form.discountPercent" min="1" max="90" placeholder="15"></div>
            }
          </div>

          <div class="sub-panel">
            <label class="chk-lbl"><input type="checkbox" [(ngModel)]="form.scheduleEnabled"> 🕐 Restrict to specific times (e.g. breakfast only 6–11am)</label>
            @if (form.scheduleEnabled) {
              <div class="fg-row" style="margin-top:.5rem">
                <div class="fg"><label>Available From</label><input type="time" class="fc" [(ngModel)]="form.availableFrom"></div>
                <div class="fg"><label>Available To</label><input type="time" class="fc" [(ngModel)]="form.availableTo"></div>
              </div>
              <label style="font-size:.78rem;color:var(--text-light);display:block;margin:.4rem 0">Days (leave all unchecked for every day)</label>
              <div class="day-picker">
                @for (d of dayOpts; track d) {
                  <label class="day-chk" [class.on]="form.availableDays.includes(d)">
                    <input type="checkbox" [checked]="form.availableDays.includes(d)" (change)="toggleDay(d)"> {{ d }}
                  </label>
                }
              </div>
            }
          </div>

          <div style="display:flex;gap:1rem;margin-top:1rem">
            <button class="btn btn-g" style="flex:1;justify-content:center" (click)="saveItem()" [disabled]="saving()">
              {{ saving() ? 'Saving…' : (editingId() ? 'Update Item' : 'Add Item') }}
            </button>
            <button class="btn btn-ol" (click)="showItemModal.set(false)">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- ADD / EDIT COUPON MODAL -->
  @if (showCouponModal()) {
    <div class="amodal-ov" (click)="onCouponOverlay($event)">
      <div class="amodal">
        <div class="amodal-hd">
          <h3>{{ editingCouponId() ? 'Edit Coupon' : 'New Coupon' }}</h3>
          <button class="auth-cls" (click)="showCouponModal.set(false)">✕</button>
        </div>
        <div class="amodal-bd">
          <div class="fg"><label>Coupon Code *</label><input type="text" class="fc" style="text-transform:uppercase" [(ngModel)]="cform.code" placeholder="WELCOME10"></div>
          <div class="fg-row">
            <div class="fg"><label>Discount Type</label>
              <select class="fc" [(ngModel)]="cform.type">
                <option value="percent">Percentage off</option>
                <option value="fixed">Fixed amount off</option>
              </select>
            </div>
            <div class="fg"><label>{{ cform.type === 'percent' ? 'Percent (%)' : 'Amount ($)' }} *</label><input type="number" class="fc" [(ngModel)]="cform.value" min="0"></div>
          </div>
          <div class="fg-row">
            <div class="fg"><label>Minimum Order ($)</label><input type="number" class="fc" [(ngModel)]="cform.minOrder" min="0" placeholder="Optional"></div>
            <div class="fg"><label>Usage Limit</label><input type="number" class="fc" [(ngModel)]="cform.usageLimit" min="0" placeholder="Optional, blank = unlimited"></div>
          </div>
          <div class="fg"><label>Expiry Date</label><input type="date" class="fc" [(ngModel)]="cform.expiresAt"></div>
          <label class="chk-lbl"><input type="checkbox" [(ngModel)]="cform.active"> Active immediately</label>
          <div style="display:flex;gap:1rem;margin-top:1rem">
            <button class="btn btn-g" style="flex:1;justify-content:center" (click)="saveCoupon()" [disabled]="savingCoupon()">
              {{ savingCoupon() ? 'Saving…' : (editingCouponId() ? 'Update Coupon' : 'Create Coupon') }}
            </button>
            <button class="btn btn-ol" (click)="showCouponModal.set(false)">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  }
  `,
  styles: [`
    .adm-nav a { cursor: pointer; }
    @media (max-width: 1024px) {
      .mob-tab-bar { display:flex !important;gap:.5rem;margin-bottom:1.5rem;background:var(--bg-card);border-radius:12px;padding:.5rem;flex-wrap:wrap; }
      .mob-tab-bar button { flex:1;min-width:44px;padding:.6rem;border-radius:8px;font-size:1.2rem;transition:all .3s;background:transparent; }
      .mob-tab-bar button.on { background:var(--green);color:#fff; }
    }
    .an-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem;margin-bottom:1.5rem; }
    @media (max-width:900px) { .an-grid { grid-template-columns:1fr; } }
    .bar-row { display:flex;align-items:center;gap:.6rem;margin-bottom:.6rem;font-size:.82rem; }
    .bar-lbl { width:130px;flex-shrink:0;color:var(--text-mid);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .bar-track { flex:1;height:10px;background:var(--bg-alt);border-radius:99px;overflow:hidden; }
    .bar-fill { height:100%;background:var(--green);border-radius:99px;transition:width .4s; }
    .bar-val { width:28px;text-align:right;font-weight:700;color:var(--text-mid); }
    .hr-chart { display:flex;align-items:flex-end;gap:2px;height:90px; }
    .hr-col { flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;position:relative; }
    .hr-bar { width:70%;background:var(--green);border-radius:3px 3px 0 0;min-height:2px;transition:height .4s; }
    .hr-lbl { font-size:.6rem;color:var(--text-light);margin-top:.25rem; }
    .sub-panel { background:var(--bg-alt);border-radius:12px;padding:1rem;margin-top:1rem; }
    .chk-lbl { display:flex;align-items:center;gap:.5rem;font-size:.85rem;font-weight:600;cursor:pointer; }
    .day-picker { display:flex;gap:.4rem;flex-wrap:wrap; }
    .day-chk { font-size:.75rem;padding:.3rem .6rem;border-radius:8px;border:1px solid var(--border);cursor:pointer;display:flex;align-items:center;gap:.3rem; }
    .day-chk.on { background:var(--green);color:#fff;border-color:var(--green); }
    .day-chk input { accent-color:#fff; }
  `]
})
export class AdminComponent implements OnInit {
  auth       = inject(AuthService);
  menuService= inject(MenuService);
  orderSvc   = inject(OrderService);
  toast      = inject(ToastService);
  coupons    = inject(CouponService);
  userAdmin  = inject(UserAdminService);

  tab        = signal<'overview'|'menu'|'coupons'|'orders'|'users'|'qr'>('overview');
  allOrders  = signal<Order[]>([]);
  showItemModal = signal(false);
  editingId  = signal<string|null>(null);
  saving     = signal(false);
  previewSrc = signal('');
  menuSearch = '';
  menuCatFilter = '';
  tables     = Array.from({length:20},(_,i)=>i+1);
  dayOpts    = DAY_OPTS;

  showCouponModal  = signal(false);
  editingCouponId  = signal<string|null>(null);
  savingCoupon     = signal(false);

  form: any = { name:'', category:'Breakfast', price:0, description:'', ingredients:'', diet:'veg', image:'',
                discountActive:false, discountPercent:15, scheduleEnabled:false, availableFrom:'06:00', availableTo:'11:00', availableDays:[] as string[] };

  cform: any = { code:'', type:'percent', value:10, minOrder:null, usageLimit:null, expiresAt:'', active:true };

  popularDishes = computed(() => {
    const counts = new Map<string, number>();
    for (const o of this.allOrders()) {
      for (const item of (o.items || [])) {
        counts.set(item.name, (counts.get(item.name) || 0) + item.qty);
      }
    }
    return Array.from(counts.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);
  });
  maxDishQty = computed(() => Math.max(1, ...this.popularDishes().map(d => d.qty)));

  ordersByHour = computed(() => {
    const buckets = new Array(24).fill(0);
    for (const o of this.allOrders()) {
      const date = (o as any).createdAt?.toDate?.();
      if (date) buckets[date.getHours()]++;
    }
    return buckets;
  });
  maxHourCount = computed(() => Math.max(1, ...this.ordersByHour()));

  revenueByDay = computed(() => {
    const days: { label: string; key: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ label: d.toLocaleDateString('en-AU', { weekday: 'short' }), key: d.toDateString(), amount: 0 });
    }
    for (const o of this.allOrders()) {
      const date = (o as any).createdAt?.toDate?.();
      if (!date) continue;
      const bucket = days.find(d => d.key === date.toDateString());
      if (bucket) bucket.amount += (o.total || 0);
    }
    return days;
  });
  maxDayRevenue = computed(() => Math.max(1, ...this.revenueByDay().map(d => d.amount)));

  topAreas = computed(() => {
    const counts = new Map<string, number>();
    for (const o of this.allOrders()) {
      const addr = o.customer?.address?.trim();
      if (!addr) continue;
      const parts = addr.split(',').map(p => p.trim()).filter(Boolean);
      const area = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
      if (!area) continue;
      counts.set(area, (counts.get(area) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  });
  maxAreaCount = computed(() => Math.max(1, ...this.topAreas().map(a => a.count)));

  filteredAdmMenu(): MenuItem[] {
    let items = this.menuService.items();
    if (this.menuSearch) {
      const q = this.menuSearch.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    if (this.menuCatFilter) items = items.filter(i => i.category === this.menuCatFilter);
    return items;
  }

  todayRevenue(): number {
    const today = new Date().toDateString();
    return this.allOrders()
      .filter(o => (o as any).createdAt?.toDate?.()?.toDateString() === today)
      .reduce((s, o) => s + (o.total || 0), 0);
  }

  pendingCount(): number {
    return this.allOrders().filter(o =>
      ['pending_payment','confirmed','preparing'].includes(o.status || '')
    ).length;
  }

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orderSvc.getAllOrdersLive().subscribe(orders => this.allOrders.set(orders));
  }

  async seedMenuData() {
    if (!confirm('Seed Firestore with a starter menu? Only do this if the menu is empty.')) return;
    try {
      await this.menuService.seedMenu();
      this.toast.success('Starter menu seeded! Edit or add to it from here.');
    } catch (e: any) {
      this.toast.error('Seeding failed: ' + (e.message || 'permission denied'));
    }
  }

  async toggleAvail(id: string, available: boolean) {
    try { await this.menuService.toggleAvailability(id, available); this.toast.success(available ? 'Item enabled' : 'Item disabled'); }
    catch(e: any) { this.toast.error('Update failed'); }
  }

  async deleteItem(id: string) {
    if (!confirm('Delete this menu item? This cannot be undone.')) return;
    try { await this.menuService.deleteItem(id); this.toast.success('Item deleted'); }
    catch(e: any) { this.toast.error('Delete failed'); }
  }

  openAddItem() {
    this.editingId.set(null);
    this.form = { name:'', category:'Breakfast', price:0, description:'', ingredients:'', diet:'veg', image:'',
                  discountActive:false, discountPercent:15, scheduleEnabled:false, availableFrom:'06:00', availableTo:'11:00', availableDays:[] };
    this.previewSrc.set('');
    this.showItemModal.set(true);
  }

  openEditItem(item: MenuItem) {
    this.editingId.set(item.id);
    this.form = {
      name:item.name, category:item.category, price:item.price, description:item.description,
      ingredients:item.ingredients, diet:item.diet, image:item.image,
      discountActive: item.discountActive || false, discountPercent: item.discountPercent || 15,
      scheduleEnabled: item.scheduleEnabled || false,
      availableFrom: item.availableFrom || '06:00', availableTo: item.availableTo || '11:00',
      availableDays: item.availableDays ? [...item.availableDays] : []
    };
    this.previewSrc.set(item.image || '');
    this.showItemModal.set(true);
  }

  toggleDay(d: string) {
    const i = this.form.availableDays.indexOf(d);
    if (i >= 0) this.form.availableDays.splice(i, 1);
    else this.form.availableDays.push(d);
  }

  previewImage() { if (this.form.image) this.previewSrc.set(this.form.image); }

  async saveItem() {
    if (!this.form.name.trim() || !this.form.price) { this.toast.error('Name and price are required'); return; }
    this.saving.set(true);
    try {
      const payload: any = {
        name:this.form.name.trim(), category:this.form.category, price:Number(this.form.price),
        description:this.form.description.trim(), ingredients:this.form.ingredients.trim(),
        diet:this.form.diet, image:this.form.image.trim(),
        discountActive: !!this.form.discountActive,
        discountPercent: this.form.discountActive ? Number(this.form.discountPercent) || 0 : 0,
        scheduleEnabled: !!this.form.scheduleEnabled,
        availableFrom: this.form.scheduleEnabled ? this.form.availableFrom : null,
        availableTo:   this.form.scheduleEnabled ? this.form.availableTo   : null,
        availableDays: this.form.scheduleEnabled ? this.form.availableDays : []
      };
      if (this.editingId()) {
        await this.menuService.updateItem(this.editingId()!, payload);
        this.toast.success('Item updated!');
      } else {
        payload.available = true;
        await this.menuService.addItem(payload);
        this.toast.success('Item added!');
      }
      this.showItemModal.set(false);
    } catch(e: any) { this.toast.error('Save failed: ' + e.message); }
    finally { this.saving.set(false); }
  }

  schedLabel(item: MenuItem) { return scheduleLabel(item); }

  openAddCoupon() {
    this.editingCouponId.set(null);
    this.cform = { code:'', type:'percent', value:10, minOrder:null, usageLimit:null, expiresAt:'', active:true };
    this.showCouponModal.set(true);
  }

  openEditCoupon(c: Coupon) {
    this.editingCouponId.set(c.id!);
    this.cform = {
      code: c.code, type: c.type, value: c.value,
      minOrder: c.minOrder ?? null, usageLimit: c.usageLimit ?? null,
      expiresAt: c.expiresAt?.toDate ? c.expiresAt.toDate().toISOString().slice(0,10) : '',
      active: c.active
    };
    this.showCouponModal.set(true);
  }

  async saveCoupon() {
    if (!this.cform.code.trim() || !this.cform.value) { this.toast.error('Code and value are required'); return; }
    this.savingCoupon.set(true);
    try {
      const payload: any = {
        code: this.cform.code.trim(), type: this.cform.type, value: Number(this.cform.value),
        active: !!this.cform.active
      };
      if (this.cform.minOrder) payload.minOrder = Number(this.cform.minOrder);
      if (this.cform.usageLimit) payload.usageLimit = Number(this.cform.usageLimit);
      if (this.cform.expiresAt) payload.expiresAt = new Date(this.cform.expiresAt);

      if (this.editingCouponId()) {
        await this.coupons.updateCoupon(this.editingCouponId()!, payload);
        this.toast.success('Coupon updated!');
      } else {
        await this.coupons.addCoupon(payload);
        this.toast.success('Coupon created!');
      }
      this.showCouponModal.set(false);
    } catch (e: any) { this.toast.error('Save failed: ' + e.message); }
    finally { this.savingCoupon.set(false); }
  }

  async toggleCoupon(c: Coupon, active: boolean) {
    try { await this.coupons.updateCoupon(c.id!, { active }); this.toast.success(active ? 'Coupon activated' : 'Coupon deactivated'); }
    catch (e: any) { this.toast.error('Update failed'); }
  }

  async deleteCoupon(id: string) {
    if (!confirm('Delete this coupon? This cannot be undone.')) return;
    try { await this.coupons.deleteCoupon(id); this.toast.success('Coupon deleted'); }
    catch (e: any) { this.toast.error('Delete failed'); }
  }

  onCouponOverlay(e: MouseEvent) { if ((e.target as HTMLElement).classList.contains('amodal-ov')) this.showCouponModal.set(false); }

  async promote(u: UserProfile) {
    if (!confirm(`Grant admin access to ${u.email}? They'll be able to manage the whole restaurant dashboard.`)) return;
    try { await this.userAdmin.grantAdmin(u.uid, this.auth.user()?.email || ''); this.toast.success(`${u.email} is now an admin`); }
    catch (e: any) { this.toast.error('Failed: ' + e.message); }
  }

  async demote(u: UserProfile) {
    if (!confirm(`Remove admin access from ${u.email}?`)) return;
    try { await this.userAdmin.revokeAdmin(u.uid); this.toast.success(`Admin access removed for ${u.email}`); }
    catch (e: any) { this.toast.error('Failed: ' + e.message); }
  }

  async updateStatus(id: string, status: string) {
    try { await this.orderSvc.updateStatus(id, status as any); this.toast.success('Status updated'); }
    catch(e: any) { this.toast.error('Update failed'); }
  }

  qrUrl(table: number) { return `${window.location.origin}/menu?table=${table}`; }
  copyQR(t: number)    { navigator.clipboard.writeText(this.qrUrl(t)).then(() => this.toast.success(`Table ${t} link copied!`)); }

  onModalOverlay(e: MouseEvent) { if ((e.target as HTMLElement).classList.contains('amodal-ov')) this.showItemModal.set(false); }

  formatDate(o: any) {
    if (o.createdAt?.toDate) return o.createdAt.toDate().toLocaleDateString('en-AU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
    return '—';
  }
  itemsSummary(o: Order) { return (o.items||[]).map(i=>`${i.name}×${i.qty}`).join(', ').slice(0,60); }
  stClass(s?: string) { return { [`st${(s||'confirmed').replace(/_/g,'')}`]: true }; }
  dietLabel(d: string) { return d==='veg'?'🌱 Veg':d==='vegan'?'🥗 Vegan':'🍗 Non-Veg'; }
  onImgErr(e: Event)   { (e.target as HTMLImageElement).src='https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=80&q=50'; }
}
