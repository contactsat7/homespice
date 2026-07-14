import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'hs-privacy',
  standalone: true,
  imports: [RouterLink],
  template: `
  <div class="pg-hd">
    <div class="container">
      <h1>Privacy Policy</h1>
      <p>How we collect, use and protect your data</p>
      <div class="bc"><a routerLink="/">Home</a> / Privacy Policy</div>
    </div>
  </div>
  <section class="section" style="background:var(--bg)">
    <div class="container">
      <div class="legal-content">
        <p><strong>Last updated: 14 July 2026</strong></p>
        <h3>1. Information We Collect</h3>
        <p>Jaannz Spicy Spoon collects information you provide directly, including name, email address, phone number, delivery address, and payment details when you place an order.</p>
        <h3>2. How We Use Your Information</h3>
        <ul>
          <li>To process and fulfil your orders</li>
          <li>To send order confirmations and status updates</li>
          <li>To improve our products and services</li>
          <li>To communicate promotions (with your consent)</li>
        </ul>
        <h3>3. Payment Security</h3>
        <p>All payments are processed securely through eWAY, a certified PCI-DSS compliant payment provider. Jaannz Spicy Spoon never stores your full card details on our systems.</p>
        <h3>4. Firebase &amp; Google Services</h3>
        <p>We use Google Firebase for database, authentication and storage. Google's privacy policy applies to data processed through these services. Optional Google sign-in allows order tracking — this is never mandatory.</p>
        <h3>5. Your Rights (Australian Privacy Act 1988)</h3>
        <p>You have the right to access, correct or delete your personal data. Contact us at <a href="mailto:jsn.marimuthu@gmail.com" style="color:var(--green)">jsn.marimuthu&#64;gmail.com</a>.</p>
        <h3>6. Cookies</h3>
        <p>We use local storage to remember your cart and preferences. No third-party advertising cookies are used.</p>
        <h3>7. Contact</h3>
        <p>Privacy enquiries: <a href="mailto:jsn.marimuthu@gmail.com" style="color:var(--green)">jsn.marimuthu&#64;gmail.com</a></p>
      </div>
    </div>
  </section>
  `,
})
export class PrivacyComponent {}
