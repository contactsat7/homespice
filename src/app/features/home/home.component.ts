import { Component, inject, OnInit, AfterViewInit, ElementRef, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MenuService } from '../../core/services/menu.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { MenuItem } from '../../core/models';
import { isOrderableNow, effectivePrice } from '../../core/models/availability';

@Component({
  selector: 'hs-home',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  template: `
  <!-- HERO -->
  <section class="hero">
    <div class="hero-img"></div>
    <div class="hero-ov"></div>
    <canvas id="pcanvas" class="hero-sparks"></canvas>
    <div class="container">
      <div class="hero-c">
        <div class="h-badge">🇦🇺 Malaysian &amp; Indian Cuisine</div>
        <h1 class="h-title">Taste the<br><em>Spice of Malaysia &amp; India</em></h1>
        <p class="h-sub">Authentic Malaysian and Indian flavours straight to your table — Malaysian Chinese favourites alongside South and North Indian specialties, made with fresh ingredients and aromatic spices.</p>
        <div class="h-acts">
          <a routerLink="/menu" class="btn btn-au btn-lg">🍽️ Explore Menu</a>
          <a routerLink="/checkout" class="btn btn-ow btn-lg">Order Online</a>
        </div>
        <div class="h-stats">
          <div><span class="h-stat-n">50+</span><span class="h-stat-l">Menu Items</span></div>
          <div><span class="h-stat-n">100%</span><span class="h-stat-l">Fresh Daily</span></div>
          <div><span class="h-stat-n">🇦🇺</span><span class="h-stat-l">Made in Australia</span></div>
        </div>
      </div>
    </div>
    <div class="hero-scroll"><span>Scroll</span><div class="hero-scroll-arrow">▼</div></div>
  </section>

  <!-- FEATURE STRIP -->
  <div class="feat-strip">
    <div class="container">
      <div class="feat-grid">
        <div class="feat-item" data-a><div class="feat-ico">🌿</div><div class="feat-t"><strong>100% Fresh</strong><span>Daily sourced ingredients</span></div></div>
        <div class="feat-item" data-a><div class="feat-ico">👩‍🍳</div><div class="feat-t"><strong>Home-Style Recipes</strong><span>Traditional family cooking</span></div></div>
        <div class="feat-item" data-a><div class="feat-ico">🚚</div><div class="feat-t"><strong>Online Ordering</strong><span>Order from anywhere</span></div></div>
        <div class="feat-item" data-a><div class="feat-ico">🌱</div><div class="feat-t"><strong>Veg &amp; Non-Veg</strong><span>Something for everyone</span></div></div>
      </div>
    </div>
  </div>

  <!-- FEATURED MENU -->
  <section class="section" style="background:var(--bg)">
    <div class="container">
      <div class="sh" data-a>
        <div class="sh-sub">Our Specialities</div>
        <h2>Must-Try Dishes</h2>
        <p>A handpicked selection of our most-loved Malaysian and Indian recipes.</p>
      </div>
      @if (menuService.loading()) {
        <div style="text-align:center;padding:3rem;color:var(--text-light)">Loading menu… 🍛</div>
      } @else if (featured().length === 0) {
        <div style="text-align:center;padding:3rem;color:var(--text-light)">
          <p>Our menu is being freshly prepared — check back shortly, or view the <a routerLink="/menu" style="color:var(--green);font-weight:600">full menu page</a>.</p>
        </div>
      } @else {
        <div class="mgrid">
          @for (item of featured(); track item.id) {
            <div class="mcard" data-a>
              <div class="card-img">
                <img [src]="item.image" [alt]="item.name" loading="lazy" (error)="onImgError($event)">
                <div class="diet-pin" [ngClass]="dietClass(item.diet)">{{ dietLabel(item.diet) }}</div>
                @if (!item.available) { <div class="unavail-mask">Currently Unavailable</div> }
              </div>
              <div class="card-b">
                <div class="card-cat">{{ item.category }}</div>
                <div class="card-nm">{{ item.name }}</div>
                <div class="card-ds">{{ item.description }}</div>
                <div class="card-ing"><strong>Ingredients:</strong> {{ item.ingredients }}</div>
                <div class="card-ft">
                  <div class="card-pr">
                    @if (item.discountActive && item.discountPercent) {
                      <span style="text-decoration:line-through;color:var(--text-light);font-size:.82em;margin-right:.35rem">{{ item.price | currency:'AUD':'symbol-narrow':'1.2-2' }}</span>
                    }
                    {{ price(item) | currency:'AUD':'symbol-narrow':'1.2-2' }} <small>AUD</small>
                  </div>
                  <button class="atc" [disabled]="!orderable(item)" (click)="addToCart(item)" title="Add to cart">+</button>
                </div>
              </div>
            </div>
          }
        </div>
      }
      <div style="text-align:center;margin-top:3rem" data-a>
        <a routerLink="/menu" class="btn btn-g btn-lg">View Full Menu →</a>
      </div>
    </div>
  </section>

  <!-- ABOUT SNIPPET -->
  <section class="section" style="background:var(--bg-card)">
    <div class="container">
      <div class="about-g">
        <div class="ab-imgs" data-a>
          <div class="ab-main"><img src="https://images.unsplash.com/photo-1596797038530-2c107229654b?w=700&q=80" alt="Indian spices" loading="lazy"></div>
          <div class="ab-acc"><img src="https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=75" alt="Traditional cooking" loading="lazy"></div>
          <div class="ab-badge"><span style="font-family:'Playfair Display',serif;font-size:1.9rem;font-weight:900;display:block;line-height:1">🇦🇺</span><span style="font-size:.7rem">Proudly Australian</span></div>
        </div>
        <div class="ab-content" data-a>
          <div class="ab-lbl">Our Story</div>
          <h2>Welcome to Jaannz Spicy Spoon</h2>
          <p>We bring the authentic flavours of Malaysia and India straight to your table — Malaysian Chinese favourites alongside South Indian and North Indian specialties, with vegetarian, non-vegetarian and vegan options for every palate.</p>
          <p>Our journey began in Toowong, Brisbane in 2013, and since 2020 we've called Kardinya, Perth home — known for our signature Butter Chicken and crowd-favourite Tofu Sambal.</p>
          <div class="ab-feats">
            <div class="ab-f"><span>✅</span> Malaysian &amp; Indian menu</div>
            <div class="ab-f"><span>✅</span> Freshly ground spices</div>
            <div class="ab-f"><span>✅</span> No artificial flavours</div>
            <div class="ab-f"><span>✅</span> Vegetarian, vegan &amp; non-veg</div>
            <div class="ab-f"><span>✅</span> Catering available</div>
            <div class="ab-f"><span>✅</span> Local Australian produce</div>
          </div>
          <a routerLink="/about" class="btn btn-g">Learn More About Us</a>
        </div>
      </div>
    </div>
  </section>

  <!-- GALLERY -->
  <section class="section" style="background:var(--bg)">
    <div class="container">
      <div class="sh" data-a>
        <div class="sh-sub">Visual Feast</div>
        <h2>A Glimpse of Our World</h2>
        <p>A celebration of colour, culture, and the art of Indian cooking.</p>
      </div>
      <div class="gal-g" data-a>
        @for (img of galleryImages; track img.src) {
          <div class="gal-i" (click)="openLb(img.src)">
            <img [src]="img.src" [alt]="img.alt" loading="lazy">
            <div class="gal-ov">🔍</div>
          </div>
        }
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="section cta-sec">
    <div class="cta-blob cta-b1"></div><div class="cta-blob cta-b2"></div>
    <div class="container" style="position:relative;z-index:1">
      <div data-a>
        <div style="font-size:3rem;margin-bottom:1rem">🌶️ 🥘 🇦🇺</div>
        <h2>Ready to Experience Jaannz Spicy Spoon?</h2>
        <p>Order online for pickup or delivery. Fresh, authentic Malaysian and Indian food — whenever you crave it.</p>
        <div class="cta-acts">
          <a routerLink="/checkout" class="btn btn-au btn-lg pulse-anim">🛒 Order Now</a>
          <a routerLink="/menu" class="btn btn-ow btn-lg">Browse Menu</a>
        </div>
      </div>
    </div>
  </section>

  <!-- INFO CARDS -->
  <section style="background:var(--bg-card);padding:3.5rem 0">
    <div class="container">
      <div class="info-g">
        <div class="icard" data-a>
          <div class="ic-ico">🕐</div><h4>Opening Hours</h4>
          <table class="hours-t">
            <tr><td>Mon – Thu</td><td>11:00 – 22:00</td></tr>
            <tr><td>Fri – Sat</td><td>11:00 – 22:30</td></tr>
            <tr><td>Sunday</td><td>11:00 – 21:00</td></tr>
          </table>
        </div>
        <div class="icard" data-a>
          <div class="ic-ico">📞</div><h4>Get in Touch</h4>
          <p style="margin-bottom:.5rem"><strong style="color:var(--green)">📞 +61 452 635 262</strong></p>
          <p style="margin-bottom:.5rem"><strong style="color:var(--green)">✉️ jsn.marimuthu&#64;gmail.com</strong></p>
          <p style="font-size:.8rem;color:var(--text-light)">We respond within 2 hours during business hours</p>
        </div>
        <div class="icard" data-a>
          <div class="ic-ico">🗺️</div><h4>Find Us</h4>
          <p>Kardinya, WA — delivering across Perth 🇦🇺</p>
          <p style="font-size:.8rem;color:var(--text-light);margin-top:.5rem">Order online for pickup or delivery to your area.</p>
          <a routerLink="/contact" class="btn btn-ol btn-sm" style="margin-top:1rem;display:inline-flex">View Contact Details</a>
        </div>
      </div>
    </div>
  </section>

  <!-- LIGHTBOX -->
  @if (lbSrc()) {
    <div class="lb" (click)="closeLb()">
      <img [src]="lbSrc()" alt="Gallery image" (click)="$event.stopPropagation()">
      <button class="lb-cls" (click)="closeLb()">✕</button>
    </div>
  }
  `,
})
export class HomeComponent implements OnInit, AfterViewInit {
  menuService = inject(MenuService);
  cartService = inject(CartService);
  toast       = inject(ToastService);

  featured = signal<MenuItem[]>([]);
  lbSrc    = signal('');

  galleryImages = [
    { src: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=700&q=80', alt: 'Indian feast' },
    { src: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=75', alt: 'Spices' },
    { src: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=75', alt: 'Biryani' },
    { src: 'https://images.unsplash.com/photo-1601303516371-e673c75b766e?w=400&q=75', alt: 'Dessert' },
    { src: 'https://images.unsplash.com/photo-1527761939622-9119a3a08f6a?w=400&q=75', alt: 'Lassi' },
  ];

  ngOnInit() {
    // Watch for menu data and set featured
    const update = () => {
      const f = this.menuService.getFeatured();
      if (f.length) this.featured.set(f);
    };
    update();
    // Polling if not loaded yet
    const t = setInterval(() => {
      update();
      if (this.featured().length) clearInterval(t);
    }, 500);
  }

  ngAfterViewInit() {
    this.initParticles();
    this.initAOS();
  }

  addToCart(item: MenuItem) {
    if (!isOrderableNow(item)) { this.toast.error('This item isn\'t available right now.'); return; }
    this.cartService.add({ id: item.id, name: item.name, price: effectivePrice(item), image: item.image, diet: item.diet });
    this.toast.success(`${item.name} added to cart! 🛒`);
  }

  price(item: MenuItem) { return effectivePrice(item); }
  orderable(item: MenuItem) { return isOrderableNow(item); }

  dietClass(diet: string) {
    return { dv: diet === 'veg', dva: diet === 'vegan', dnv: diet === 'nonveg' };
  }
  dietLabel(diet: string) {
    return diet === 'veg' ? '🌱 Veg' : diet === 'vegan' ? '🥗 Vegan' : '🍗 Non-Veg';
  }
  onImgError(e: Event) {
    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=75';
  }
  openLb(src: string) { this.lbSrc.set(src); document.body.style.overflow = 'hidden'; }
  closeLb()           { this.lbSrc.set(''); document.body.style.overflow = ''; }

  private initAOS() {
    const items = document.querySelectorAll('[data-a]');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    items.forEach(el => obs.observe(el));
  }

  private initParticles() {
    const canvas = document.getElementById('pcanvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let W: number, H: number;
    const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    const emojis = ['✨','🌶️','🍛','⭐','💫','🌿','🔥','🌸'];
    const particles: any[] = [];
    class P {
      x=0;y=0;sz=0;vx=0;vy=0;alpha=0;life=0;maxL=0;e='';rot=0;rs=0;
      constructor(init=false) { this.reset(init); }
      reset(init=false) {
        this.x=Math.random()*W; this.y=init?Math.random()*H:H+20;
        this.sz=Math.random()*11+7; this.vx=(Math.random()-.5)*.55;
        this.vy=-(Math.random()*.75+.25); this.alpha=Math.random()*.45+.12;
        this.life=0; this.maxL=Math.random()*220+100;
        this.e=emojis[Math.floor(Math.random()*emojis.length)];
        this.rot=Math.random()*Math.PI*2; this.rs=(Math.random()-.5)*.025;
      }
      update() { this.x+=this.vx;this.y+=this.vy;this.rot+=this.rs;this.life++; if(this.y<-25||this.life>this.maxL)this.reset(false); }
      draw() {
        const a=Math.min(1,(this.maxL-this.life)/35)*this.alpha;
        ctx.save();ctx.globalAlpha=a;ctx.translate(this.x,this.y);ctx.rotate(this.rot);
        ctx.font=`${this.sz}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(this.e,0,0);ctx.restore();
      }
    }
    for(let i=0;i<30;i++) particles.push(new P(true));
    const loop = () => { ctx.clearRect(0,0,W,H); particles.forEach(p=>{p.update();p.draw();}); requestAnimationFrame(loop); };
    loop();
  }
}
