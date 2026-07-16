import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../core/services/menu.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { MenuItem, MENU_CATEGORIES, MenuCategory } from '../../core/models';
import { isOrderableNow, isWithinSchedule, effectivePrice, scheduleLabel } from '../../core/models/availability';

@Component({
  selector: 'hs-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, FormsModule],
  template: `
  <div class="pg-hd">
    <div class="container">
      <h1>Our Menu</h1>
      <p>Authentic Indian flavours crafted with love, tradition and the freshest ingredients</p>
      <div class="bc"><a routerLink="/">Home</a> / Menu</div>
    </div>
  </div>

  <section class="section" style="background:var(--bg)">
    <div class="container">

      <!-- Table badge (QR scan) -->
      @if (tableNum()) {
        <div class="tbl-tag">📱 Ordering from <strong>Table {{ tableNum() }}</strong></div>
      }

      <!-- Search -->
      <div style="margin-bottom:1.5rem;max-width:400px">
        <input type="search" class="fc" [(ngModel)]="searchQ" placeholder="🔍  Search dishes, ingredients…" style="padding-left:1rem">
      </div>

      <!-- Category tabs -->
      <div class="menu-tabs" style="display:flex;justify-content:center;gap:.6rem;flex-wrap:wrap;margin-bottom:2rem">
        @for (cat of categories; track cat) {
          <button class="mtab" [class.on]="activeCategory() === cat" (click)="setCategory(cat)">
            {{ catEmoji(cat) }} {{ cat }}
          </button>
        }
      </div>

      <!-- Top bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">
        <p style="font-size:.85rem;color:var(--text-light)">{{ filtered().length }} items</p>
        <div style="display:flex;gap:.4rem">
          <button class="vtbtn" [class.on]="view()==='grid'" (click)="view.set('grid')" title="Grid view">⊞</button>
          <button class="vtbtn" [class.on]="view()==='list'" (click)="view.set('list')" title="List view">☰</button>
        </div>
      </div>

      <!-- Menu grid -->
      @if (menuService.loading()) {
        <div style="text-align:center;padding:4rem;color:var(--text-light)">
          <div style="font-size:2rem;margin-bottom:1rem">🍛</div>
          <p>Loading menu from the kitchen…</p>
        </div>
      } @else if (filtered().length === 0) {
        <div style="text-align:center;padding:4rem;color:var(--text-light)">
          <div style="font-size:2rem;margin-bottom:1rem">🔍</div>
          <p>No items match your search. Try a different category or keyword.</p>
        </div>
      } @else {
        <div class="mgrid" [class.lview]="view()==='list'">
          @for (item of filtered(); track item.id) {
            <div class="mcard">
              <div class="card-img">
                <img [src]="item.image" [alt]="item.name" loading="lazy" (error)="onImgErr($event)">
                <div class="diet-pin" [ngClass]="dietClass(item.diet)">{{ dietLabel(item.diet) }}</div>
                @if (item.discountActive && item.discountPercent) {
                  <div class="disc-pin">-{{ item.discountPercent }}%</div>
                }
                @if (!item.available) {
                  <div class="unavail-mask">Currently Unavailable</div>
                } @else if (!isWithinSchedule(item)) {
                  <div class="unavail-mask">{{ scheduleLabel(item) }}</div>
                }
              </div>
              <div class="card-b">
                <div class="card-cat">{{ item.category }}</div>
                <div class="card-nm">{{ item.name }}</div>
                <div class="card-ds">{{ item.description }}</div>
                <div class="card-ing"><strong>Ingredients:</strong> {{ item.ingredients }}</div>
                @if (item.scheduleEnabled && isWithinSchedule(item)) {
                  <div class="sched-tag">🕐 {{ scheduleLabel(item) }}</div>
                }
                <div class="card-ft">
                  <div class="card-pr">
                    @if (item.discountActive && item.discountPercent) {
                      <span style="text-decoration:line-through;color:var(--text-light);font-size:.82em;margin-right:.35rem">{{ item.price | currency:'AUD':'symbol-narrow':'1.2-2' }}</span>
                    }
                    {{ price(item) | currency:'AUD':'symbol-narrow':'1.2-2' }} <small>AUD</small>
                  </div>
                  <button class="atc" [disabled]="!orderable(item)" (click)="addToCart(item)">+</button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  </section>
  `,
  styles: [`
    .menu-tabs .mtab { padding:.55rem 1.4rem;border-radius:50px;font-size:.82rem;font-weight:600;border:2px solid var(--border);color:var(--text-mid);background:var(--bg-card);transition:all .3s;cursor:pointer; }
    .menu-tabs .mtab:hover,.menu-tabs .mtab.on { border-color:var(--green);background:var(--green);color:#fff; }
    .vtbtn { width:36px;height:36px;border-radius:8px;border:2px solid var(--border);background:var(--bg-card);display:flex;align-items:center;justify-content:center;font-size:.9rem;color:var(--text-light);transition:all .3s;cursor:pointer; }
    .vtbtn.on,.vtbtn:hover { border-color:var(--green);color:var(--green);background:var(--green-l); }
    .disc-pin { position:absolute;top:.6rem;left:.6rem;background:#c62828;color:#fff;font-size:.7rem;font-weight:800;padding:.25rem .55rem;border-radius:6px; }
    .sched-tag { font-size:.72rem;color:var(--text-light);background:var(--bg-alt);display:inline-block;padding:.2rem .5rem;border-radius:6px;margin-bottom:.5rem; }
  `]
})
export class MenuComponent implements OnInit {
  menuService = inject(MenuService);
  cartService = inject(CartService);
  toast       = inject(ToastService);
  route       = inject(ActivatedRoute);

  categories     = MENU_CATEGORIES;
  activeCategory = signal<MenuCategory>('All');
  view           = signal<'grid'|'list'>('grid');
  searchQ        = '';
  tableNum       = signal('');

  filtered = computed(() => {
    let items = this.menuService.items();
    if (this.activeCategory() !== 'All') {
      items = items.filter(i => i.category === this.activeCategory());
    }
    if (this.searchQ.trim()) {
      const q = this.searchQ.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.ingredients.toLowerCase().includes(q)
      );
    }
    return items;
  });

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['cat']) this.activeCategory.set(p['cat'] as MenuCategory);
      if (p['table']) { this.tableNum.set(p['table']); localStorage.setItem('hs_table', p['table']); }
    });
    const stored = localStorage.getItem('hs_table');
    if (stored && !this.tableNum()) this.tableNum.set(stored);
  }

  setCategory(cat: MenuCategory) { this.activeCategory.set(cat); }

  addToCart(item: MenuItem) {
    if (!isOrderableNow(item)) { this.toast.error('This item isn\'t available right now.'); return; }
    this.cartService.add({ id: item.id, name: item.name, price: effectivePrice(item), image: item.image, diet: item.diet });
    this.toast.success(`${item.name} added to cart! 🛒`);
  }

  price(item: MenuItem) { return effectivePrice(item); }
  orderable(item: MenuItem) { return isOrderableNow(item); }
  isWithinSchedule(item: MenuItem) { return isWithinSchedule(item); }
  scheduleLabel(item: MenuItem) { return scheduleLabel(item); }

  catEmoji(cat: string): string {
    const map: Record<string,string> = { All:'🍽️',Breakfast:'🌅',Lunch:'☀️',Snacks:'🥪',Dinner:'🌙',Drinks:'🥤' };
    return map[cat] ?? '🍽️';
  }
  dietClass(d: string) { return { dv: d==='veg', dva: d==='vegan', dnv: d==='nonveg' }; }
  dietLabel(d: string) { return d==='veg' ? '🌱 Veg' : d==='vegan' ? '🥗 Vegan' : '🍗 Non-Veg'; }
  onImgErr(e: Event)   { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=75'; }
}
