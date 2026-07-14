import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { MenuItem, Order } from '../../core/models';

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
          <a [class.on]="tab()==='menu'" (click)="tab.set('menu');loadMenu()">🍽️ Menu Items</a>
          <a [class.on]="tab()==='orders'" (click)="tab.set('orders');loadOrders()">📦 Orders</a>
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
          <button [class.on]="tab()==='menu'" (click)="tab.set('menu');loadMenu()">🍽️</button>
          <button [class.on]="tab()==='orders'" (click)="tab.set('orders');loadOrders()">📦</button>
          <button [class.on]="tab()==='qr'" (click)="tab.set('qr')">📱</button>
        </div>

        <!-- ── OVERVIEW ── -->
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

        <!-- ── MENU MANAGEMENT ── -->
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
            <button class="btn btn-ol btn-sm" (click)="seedMenuData()" title="Seed Firestore with menu data if empty">🌱 Seed Menu</button>
          </div>
          <div style="overflow-x:auto">
            <table class="adm-tbl">
              <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Diet</th><th>Available</th><th>Actions</th></tr></thead>
              <tbody>
        @for (item of filteredAdmMenu(); track item.id) {
                  <tr [class.row-off]="!item.available">
                    <td><img [src]="item.image" [alt]="item.name" style="width:50px;height:50px;object-fit:cover;border-radius:8px" (error)="onImgErr($event)"></td>
                    <td><strong>{{ item.name }}</strong><br><small style="color:var(--text-light)">{{ (item.description || '').slice(0,50) }}…</small></td>
                    <td><span class="cat-chip">{{ item.category }}</span></td>
                    <td><strong>{{ item.price | currency:'AUD':'symbol-narrow':'1.2-2' }}</strong></td>
                    <td><span class="diet-chip" [ngClass]="'diet-'+item.diet">{{ dietLabel(item.diet) }}</span></td>
                    <td>
                      <label class="tgl-sw">
                        <input type="checkbox" [checked]="item.available" (change)="toggleAvail(item.id, $any($event.target).checked)">
                        <span class="tgl-sl"></span>
                      </label>
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

        <!-- ── ORDERS ── -->
        @if (tab() === 'orders') {
          <div class="adm-topbar">
            <h2>Order Management</h2>
            <span style="font-size:.82rem;color:var(--text-light)">Real-time updates</span>
          </div>
          <div style="overflow-x:auto">
            <table class="adm-tbl">
              <thead><tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                @for (o of allOrders().slice(0,50); track o.orderId) {
                  <tr>
                    <td><code style="font-size:.72rem">{{ o.orderId }}</code></td>
                    <td style="font-size:.8rem">{{ formatDate(o) }}</td>
                    <td><strong>{{ o.customer?.name || 'Guest' }}</strong><br><small>{{ o.customer?.email }}</small></td>
                    <td style="max-width:180px;font-size:.78rem">{{ itemsSummary(o) }}</td>
                    <td><strong>{{ o.total | currency:'AUD':'symbol-narrow':'1.2-2' }}</strong></td>
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
                  <tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-light)">No orders yet</td></tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- ── QR CODES ── -->
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

  <!-- ADD / EDIT ITEM MODAL -->
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
          <div style="display:flex;gap:1rem;margin-top:.5rem">
            <button class="btn btn-g" style="flex:1;justify-content:center" (click)="saveItem()" [disabled]="saving()">
              {{ saving() ? 'Saving…' : (editingId() ? 'Update Item' : 'Add Item') }}
            </button>
            <button class="btn btn-ol" (click)="showItemModal.set(false)">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  }
  `,
  styles: [`
    .adm-nav a { cursor: pointer; }
    @media (max-width: 1024px) {
      .mob-tab-bar { display:flex !important;gap:.5rem;margin-bottom:1.5rem;background:var(--bg-card);border-radius:12px;padding:.5rem; }
      .mob-tab-bar button { flex:1;padding:.6rem;border-radius:8px;font-size:1.2rem;transition:all .3s;background:transparent; }
      .mob-tab-bar button.on { background:var(--green);color:#fff; }
    }
  `]
})
export class AdminComponent implements OnInit {
  auth       = inject(AuthService);
  menuService= inject(MenuService);
  orderSvc   = inject(OrderService);
  toast      = inject(ToastService);

  tab        = signal<'overview'|'menu'|'orders'|'qr'>('overview');
  allOrders  = signal<Order[]>([]);
  showItemModal = signal(false);
  editingId  = signal<string|null>(null);
  saving     = signal(false);
  previewSrc = signal('');
  menuSearch = '';
  menuCatFilter = '';
  tables     = Array.from({length:20},(_,i)=>i+1);

  form = { name:'', category:'Breakfast', price:0, description:'', ingredients:'', diet:'veg', image:'' };

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

  loadMenu() { /* menuService auto-loads */ }

  loadOrders() {
    this.orderSvc.getAllOrdersLive().subscribe(orders => this.allOrders.set(orders));
  }

  async seedMenuData() {
    if (!confirm('Seed Firestore with default menu items? Only do this once.')) return;
    await this.menuService.seedMenu();
    this.toast.success('Menu seeded successfully!');
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
    this.form = { name:'', category:'Breakfast', price:0, description:'', ingredients:'', diet:'veg', image:'' };
    this.previewSrc.set('');
    this.showItemModal.set(true);
  }

  openEditItem(item: MenuItem) {
    this.editingId.set(item.id);
    this.form = { name:item.name, category:item.category, price:item.price, description:item.description, ingredients:item.ingredients, diet:item.diet, image:item.image };
    this.previewSrc.set(item.image || '');
    this.showItemModal.set(true);
  }

  previewImage() { if (this.form.image) this.previewSrc.set(this.form.image); }

  async saveItem() {
    if (!this.form.name.trim() || !this.form.price) { this.toast.error('Name and price are required'); return; }
    this.saving.set(true);
    try {
      const payload = { name:this.form.name.trim(), category:this.form.category as any, price:Number(this.form.price), description:this.form.description.trim(), ingredients:this.form.ingredients.trim(), diet:this.form.diet as any, image:this.form.image.trim(), available:true };
      if (this.editingId()) {
        await this.menuService.updateItem(this.editingId()!, payload);
        this.toast.success('Item updated!');
      } else {
        await this.menuService.addItem(payload);
        this.toast.success('Item added!');
      }
      this.showItemModal.set(false);
    } catch(e: any) { this.toast.error('Save failed: ' + e.message); }
    finally { this.saving.set(false); }
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
