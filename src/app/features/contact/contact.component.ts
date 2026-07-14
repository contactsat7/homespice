import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'hs-contact',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  template: `
  <div class="pg-hd">
    <div class="container"><h1>Contact Us</h1><p>We'd love to hear from you</p>
      <div class="bc"><a routerLink="/">Home</a> / Contact</div>
    </div>
  </div>
  <section class="section" style="background:var(--bg)">
    <div class="container">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:start">
        <div>
          <div class="co-card" style="margin-bottom:1.5rem">
            <h3>📍 Location &amp; Hours</h3>
            <p style="margin-bottom:.5rem"><strong>Kardinya, WA, Australia</strong></p>
            <p style="margin-bottom:1rem">Malaysian &amp; Indian cuisine — pickup, delivery and catering across Perth.</p>
            <table class="hours-t">
              <tr><td>Mon – Thu</td><td>11:00 AM – 10:00 PM</td></tr>
              <tr><td>Fri – Sat</td><td>11:00 AM – 10:30 PM</td></tr>
              <tr><td>Sunday</td><td>11:00 AM – 9:00 PM</td></tr>
            </table>
          </div>
          <div class="co-card">
            <h3>📞 Get In Touch</h3>
            <div style="display:flex;flex-direction:column;gap:.75rem;margin-top:.5rem">
              <div><strong>Phone:</strong> <a href="tel:+61452635262" style="color:var(--green)">+61 452 635 262</a></div>
              <div><strong>Email:</strong> <a href="mailto:jsn.marimuthu@gmail.com" style="color:var(--green)">jsn.marimuthu&#64;gmail.com</a></div>
              <div><strong>WhatsApp:</strong> <a href="https://wa.me/61452635262" style="color:#25d366">+61 452 635 262</a></div>
            </div>
          </div>
        </div>
        <div class="co-card">
          <h3>✉️ Send a Message</h3>
          @if (sent()) {
            <div style="text-align:center;padding:2rem">
              <div style="font-size:2.5rem;margin-bottom:.75rem">✅</div>
              <h4>Message Sent!</h4>
              <p>We'll get back to you within 2 business hours.</p>
            </div>
          } @else {
            <div style="margin-top:1rem">
              <div class="fg"><label>Your Name</label><input type="text" class="fc" [(ngModel)]="cName" placeholder="John Smith"></div>
              <div class="fg"><label>Email</label><input type="email" class="fc" [(ngModel)]="cEmail" placeholder="john@email.com"></div>
              <div class="fg"><label>Subject</label><input type="text" class="fc" [(ngModel)]="cSubject" placeholder="Enquiry about…"></div>
              <div class="fg"><label>Message</label><textarea class="fc" [(ngModel)]="cMsg" rows="4" placeholder="How can we help?"></textarea></div>
              <button class="btn btn-g" style="width:100%;justify-content:center" (click)="sendMsg()">Send Message</button>
            </div>
          }
        </div>
      </div>
    </div>
  </section>
  `,
})
export class ContactComponent {
  cName=''; cEmail=''; cSubject=''; cMsg='';
  sent = signal(false);
  sendMsg() { if (this.cName && this.cEmail && this.cMsg) this.sent.set(true); }
}
