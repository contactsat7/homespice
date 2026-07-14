// ── ABOUT ────────────────────────────────────────────────
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'hs-about',
  standalone: true,
  imports: [RouterLink],
  template: `
  <div class="pg-hd">
    <div class="container"><h1>About Jaannz Spicy Spoon</h1><p>Our story, our passion, our promise to you</p>
      <div class="bc"><a routerLink="/">Home</a> / About</div>
    </div>
  </div>
  <section class="section" style="background:var(--bg-card)">
    <div class="container">
      <div class="about-g">
        <div class="ab-imgs">
          <div class="ab-main"><img src="https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=700&q=80" alt="Malaysian and Indian cooking" loading="lazy"></div>
          <div class="ab-acc"><img src="https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=75" alt="Spices" loading="lazy"></div>
        </div>
        <div class="ab-content">
          <div class="ab-lbl">Who We Are</div>
          <h2>Welcome to Jaannz Spicy Spoon</h2>
          <p>At Jaannz Spicy Spoon, we bring the authentic flavours of Malaysia and India straight to your table. Our menu celebrates the rich diversity of Malaysian cuisine, featuring Malaysian Chinese favourites alongside both South Indian and North Indian specialties.</p>
          <p>We proudly cater to every palate with a wide range of vegetarian, non-vegetarian, and vegan dishes, all prepared using fresh ingredients, traditional recipes, and aromatic spices.</p>
          <p>Our culinary journey began in Toowong, Brisbane, where we operated from 2013. In 2020, we brought our passion for great food to Kardinya, Perth, where we continue serving our community with delicious, home-style meals and catering services.</p>
          <p>Over the years, we have built a loyal following and are especially well known for our signature Butter Chicken — rich, creamy, and packed with flavour — and our crowd-favourite Tofu Sambal, a perfect balance of spice and authentic Malaysian taste.</p>
          <p>Whether you're planning a family gathering, a special celebration, or simply craving authentic Malaysian and Indian cuisine, Jaannz Spicy Spoon is committed to delivering quality, flavour, and hospitality in every dish.</p>
        </div>
      </div>
    </div>
  </section>
  <section class="section" style="background:var(--bg)">
    <div class="container">
      <div class="sh"><div class="sh-sub">Our Values</div><h2>What We Stand For</h2></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1.5rem">
        <div class="icard"><div class="ic-ico">🌿</div><h4>Fresh &amp; Natural</h4><p>Every ingredient is sourced fresh. No artificial flavours, no preservatives.</p></div>
        <div class="icard"><div class="ic-ico">🍜</div><h4>Malaysian &amp; Indian, Together</h4><p>Malaysian Chinese favourites alongside South and North Indian specialties, all on one menu.</p></div>
        <div class="icard"><div class="ic-ico">🌱</div><h4>Something For Everyone</h4><p>A wide range of vegetarian, non-vegetarian and vegan dishes to suit every palate.</p></div>
        <div class="icard"><div class="ic-ico">🇦🇺</div><h4>Proudly Perth-Based</h4><p>Serving Kardinya and the wider Perth community since 2020.</p></div>
      </div>
    </div>
  </section>
  `,
})
export class AboutComponent {}
