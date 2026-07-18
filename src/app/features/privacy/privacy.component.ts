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
        <p><strong>Effective Date: 18 July 2026</strong></p>

        <p>At Jaannz Spicy Spoon ("we", "our", or "us"), we are committed to protecting your privacy and handling your personal information responsibly in accordance with applicable Australian privacy laws.</p>

        <h3>1. Information We Collect</h3>
        <p>We may collect personal information that you voluntarily provide when using our website or services, including:</p>
        <ul>
          <li>Full name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Delivery or billing address</li>
          <li>Order details and purchase history</li>
          <li>Payment transaction information (processed securely through our payment provider)</li>
          <li>Account information (if you choose to create an account)</li>
          <li>Communications or enquiries you send to us</li>
        </ul>
        <p>We may also collect limited technical information such as device type, browser information, IP address, and website usage data to improve our services and maintain security.</p>

        <h3>2. How We Use Your Information</h3>
        <p>We use your personal information to:</p>
        <ul>
          <li>Process, prepare, and deliver your orders</li>
          <li>Verify transactions and prevent fraud</li>
          <li>Provide customer support</li>
          <li>Send order confirmations, receipts, and service-related notifications</li>
          <li>Respond to enquiries and requests</li>
          <li>Improve our website, products, and customer experience</li>
          <li>Comply with legal and regulatory obligations</li>
          <li>Send promotional offers or marketing communications where you have provided consent. You may opt out at any time.</li>
        </ul>
        <p>We only collect and use personal information that is reasonably necessary to operate our business.</p>

        <h3>3. Payment Security</h3>
        <p>Payments made through our website are processed by trusted third-party payment providers that comply with applicable payment security standards, including PCI DSS where applicable.</p>
        <p>We do not store your full payment card number, CVV, or other sensitive payment credentials on our systems.</p>

        <h3>4. Third-Party Services</h3>
        <p>We use trusted third-party service providers to operate our online business. These providers may process information on our behalf, including:</p>
        <ul>
          <li>Website hosting and infrastructure</li>
          <li>Authentication and account management</li>
          <li>Database and cloud storage services</li>
          <li>Payment processing</li>
          <li>Email and notification services</li>
          <li>Analytics and system monitoring</li>
        </ul>
        <p>For example, we use Google Firebase to provide authentication, cloud database, and storage services. Information processed through Google services is subject to Google's applicable privacy practices.</p>
        <p>If you choose to sign in using a third-party account (such as Google), we only receive the information that you authorise that provider to share with us.</p>

        <h3>5. Cookies and Similar Technologies</h3>
        <p>We use cookies, local storage, and similar technologies to:</p>
        <ul>
          <li>Keep your shopping cart active</li>
          <li>Remember your preferences</li>
          <li>Maintain your login session (where applicable)</li>
          <li>Improve website functionality and performance</li>
        </ul>
        <p>We do not use third-party advertising cookies without your consent.</p>
        <p>You can manage or disable cookies through your browser settings, although some website features may not function correctly.</p>

        <h3>6. Data Retention</h3>
        <p>We retain personal information only for as long as reasonably necessary to:</p>
        <ul>
          <li>Provide our services</li>
          <li>Complete transactions</li>
          <li>Maintain business records</li>
          <li>Meet legal, accounting, taxation, and regulatory requirements</li>
          <li>Resolve disputes and enforce our agreements</li>
        </ul>
        <p>When information is no longer required, we take reasonable steps to securely delete or de-identify it.</p>

        <h3>7. Your Privacy Rights</h3>
        <p>Subject to applicable law, you may request to:</p>
        <ul>
          <li>Access the personal information we hold about you</li>
          <li>Correct inaccurate or incomplete information</li>
          <li>Request deletion of your personal information where appropriate</li>
          <li>Withdraw consent for marketing communications</li>
          <li>Make a privacy-related complaint</li>
        </ul>
        <p>We will respond to requests within a reasonable timeframe and in accordance with applicable legal requirements.</p>

        <h3>8. Protecting Your Information</h3>
        <p>We take reasonable technical, administrative, and organisational measures to protect your personal information against unauthorised access, loss, misuse, alteration, or disclosure.</p>
        <p>While we implement appropriate safeguards, no method of electronic transmission or storage can be guaranteed to be completely secure.</p>

        <h3>9. Children's Privacy</h3>
        <p>Our services are not directed to children under the age of 16. We do not knowingly collect personal information from children without appropriate parental or guardian consent where required by law.</p>

        <h3>10. Changes to This Privacy Policy</h3>
        <p>We may update this Privacy Policy from time to time to reflect changes in our business, technology, or legal obligations.</p>
        <p>Any updates will be published on this page together with the revised effective date.</p>

        <h3>11. Contact Us</h3>
        <p>If you have any questions, requests, or concerns regarding this Privacy Policy or the handling of your personal information, please contact us:</p>
        <p>Jaannz Spicy Spoon<br>Email: <a href="mailto:jsn.marimuthu@gmail.com" style="color:var(--green)">jsn.marimuthu&#64;gmail.com</a></p>
      </div>
    </div>
  </section>
  `,
})
export class PrivacyComponent {}
