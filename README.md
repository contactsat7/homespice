# 🌶️ Jaannz Spicy Spoon — Malaysian &amp; Indian Restaurant
### Angular 18 · Firebase Auth + Firestore · AWS S3 + CloudFront

---

## Architecture

```
Browser → CloudFront (CDN, HTTPS) → S3 (static files)
             ↕
         Firebase Auth  (Google + Email sign-in)
         Firebase Firestore  (menu, orders, users)
```

- **Hosting:** AWS S3 + CloudFront — fast global CDN, free SSL
- **Database:** Firebase Firestore — real-time, no server needed
- **Auth:** Firebase Auth — Google + email/password
- **No Firebase Storage needed** — menu images use Unsplash URLs

---

## QUICK START — Run locally

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm start
# → Opens http://localhost:4200
```

---

## DEPLOY TO AWS (Production)

### One-time prerequisites

**Install AWS CLI:**
- Windows: https://awscli.amazonaws.com/AWSCLIV2.msi
- Mac: `brew install awscli`

**Configure AWS credentials:**
```bash
aws configure
```
Enter when prompted:
```
AWS Access Key ID:     YOUR_ACCESS_KEY_ID
AWS Secret Access Key: YOUR_SECRET_ACCESS_KEY
Default region:        ap-southeast-2
Default output format: json
```

> Get your Access Key from: AWS Console → IAM → Users → Your User → Security Credentials → Create Access Key

**Required IAM permissions for your AWS user:**
- `AmazonS3FullAccess`
- `CloudFrontFullAccess`

### Deploy (one command)

```bash
npm run deploy
```

That's it. The script will:
1. Build Angular for production
2. Create S3 bucket `homespice-site` (first time only)
3. Upload all files with correct cache headers
4. Create CloudFront distribution with HTTPS (first time only)
5. On re-deploys: invalidate cache so changes go live in ~30 seconds
6. Print your live URL

**First deploy output looks like:**
```
═══════════════════════════════════════════════════
  🚀  DEPLOY COMPLETE!

  Your live site:   https://d1234abcd.cloudfront.net
  S3 bucket:        s3://homespice-site
  CloudFront ID:    ABCDEF123456

  First deploy: wait ~5 mins for CloudFront to propagate globally.
  Re-deploys:   live within ~30 seconds after cache invalidation.
═══════════════════════════════════════════════════
```

**First deploy:** wait ~5 minutes. CloudFront deploys to all global edge locations.

**Every re-deploy after that:** `npm run deploy` — live in ~30 seconds.

---

## CUSTOM DOMAIN (homespice.com.au)

### Step 1 — Request SSL certificate (free, AWS ACM)
1. AWS Console → **Certificate Manager** → **Request certificate**
2. Enter: `homespice.com.au` and `www.homespice.com.au`
3. Choose **DNS validation** → click **Request**
4. Add the CNAME records shown to your domain's DNS
5. Wait ~5 minutes for validation

### Step 2 — Add domain to CloudFront
1. AWS Console → **CloudFront** → click your distribution
2. **Edit** → **Alternate domain names** → add `homespice.com.au` and `www.homespice.com.au`
3. **Custom SSL Certificate** → select the certificate you just created
4. Save changes

### Step 3 — Point your domain to CloudFront
In your domain registrar DNS settings, add:
```
Type:  CNAME
Name:  www
Value: d1234abcd.cloudfront.net   ← your CloudFront domain

Type:  CNAME  (or ALIAS for root domain)
Name:  @
Value: d1234abcd.cloudfront.net
```

### Step 4 — Add domain to Firebase Authorized Domains
Firebase Console → Authentication → Settings → Authorized domains → Add:
- `homespice.com.au`
- `www.homespice.com.au`

---

## FIREBASE SETUP

### Add your admin email
Open `src/environments/environment.ts`:
```typescript
adminEmails: [
  'your-gmail@gmail.com',   // ← your actual Google account
]
```
Same in `environment.prod.ts`.

### Deploy Firestore security rules
```bash
npm run deploy:rules
```

### Seed menu data (run once)
1. `npm start` → open http://localhost:4200
2. Sign in with your admin Google account
3. Go to `/admin` → Menu Items tab → click **🌱 Seed Menu**
4. All 22 menu items appear in Firestore

### Enable Google Sign-In in Firebase Console
Firebase Console → Authentication → Sign-in method → Enable:
- Google ✅
- Email/Password ✅

Add authorized domains:
- `localhost`
- `d1234abcd.cloudfront.net` (your CloudFront domain)
- `homespice.com.au` (when ready)

---

## PROJECT STRUCTURE

```
src/
├── app/
│   ├── app.component.ts        ← Shell (navbar, cart, auth modal, footer)
│   ├── app.config.ts           ← Angular + Firebase providers
│   ├── app.routes.ts           ← Lazy-loaded routes
│   ├── core/
│   │   ├── models/index.ts     ← TypeScript interfaces + menu seed data
│   │   ├── services/
│   │   │   ├── auth.service.ts    ← Google + email auth, admin check
│   │   │   ├── cart.service.ts    ← Cart with Angular signals
│   │   │   ├── menu.service.ts    ← Firestore menu CRUD
│   │   │   ├── order.service.ts   ← Orders, history, loyalty points
│   │   │   └── toast.service.ts   ← Notifications
│   │   └── guards/auth.guard.ts   ← Route protection
│   └── features/
│       ├── home/           ← Homepage
│       ├── menu/           ← Full menu with filters
│       ├── checkout/       ← Order form + payment
│       ├── orders/         ← Order history
│       ├── admin/          ← Admin dashboard
│       ├── about/
│       ├── contact/
│       └── privacy/
├── environments/
│   ├── environment.ts          ← Dev config
│   └── environment.prod.ts     ← Production config
└── styles.scss                 ← Global styles
scripts/
├── deploy.js                   ← AWS deploy automation
└── aws-state.json              ← Auto-created, stores your CloudFront ID
```

---

## MAKE CHANGES

### Change colours
Edit CSS variables at top of `src/styles.scss`:
```scss
:root {
  --green:  #00843D;   ← brand green
  --gold:   #FFB300;   ← accent gold
}
```

### Add a menu item
Admin dashboard → Menu Items → **+ Add New Item**

### Change phone number / email
Search for `+61 400 000 000` in `src/app/` and replace.

### Add a new page
```bash
# Create component
# src/app/features/newpage/newpage.component.ts

# Add to app.routes.ts
{ path: 'newpage', loadComponent: () => import('./features/newpage/newpage.component').then(m => m.NewpageComponent) }

# Add link in app.component.ts navbar
```

---

## USEFUL COMMANDS

```bash
npm start              # Dev server → localhost:4200
npm run build          # Production build only
npm run deploy         # Build + deploy to AWS (production)
npm run deploy:rules   # Deploy Firestore security rules only
```

---

## FIRESTORE COLLECTIONS

| Collection | What it stores |
|---|---|
| `menu` | All menu items (name, price, category, diet, image, available) |
| `orders` | Customer orders (items, total, status, payment ref) |
| `users` | User profiles (name, email, role, loyaltyPoints) |
| `admins` | Admin user IDs (doc ID = Firebase UID) |
| `loyalty` | Loyalty point entries per order |

---

© 2026 HomeSpice Indian Restaurant · Built in 🇦🇺 Australia
