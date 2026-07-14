/**
 * HomeSpice — deploy.js
 * Run:  node scripts/deploy.js
 *
 * Builds Angular + uploads to S3 + sets up CloudFront.
 * First run: creates everything. Subsequent runs: sync + cache invalidation.
 */

'use strict';

const { execSync } = require('child_process');
const fs           = require('fs');
const path         = require('path');

const {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  DeletePublicAccessBlockCommand,
  PutBucketOwnershipControlsCommand,
  PutBucketPolicyCommand,
  PutBucketWebsiteCommand,
  PutObjectCommand,
} = require('@aws-sdk/client-s3');

const {
  CloudFrontClient,
  CreateDistributionCommand,
  CreateInvalidationCommand,
} = require('@aws-sdk/client-cloudfront');

const mime = require('mime-types');

// ── CONFIG — edit BUCKET name if "homespice-site" is taken ──────────────────
const BUCKET = 'homespice-site';
const REGION = 'ap-southeast-2';   // Sydney — change if you prefer another region
const DIST   = path.join(__dirname, '..', 'dist', 'homespice', 'browser');
const STATE  = path.join(__dirname, 'aws-state.json');
// ─────────────────────────────────────────────────────────────────────────────

const s3 = new S3Client({ region: REGION });
const cf = new CloudFrontClient({ region: 'us-east-1' }); // CloudFront always us-east-1

const sleep = ms => new Promise(r => setTimeout(r, ms));

function title(msg) { console.log(`\n${'─'.repeat(52)}\n  ${msg}\n${'─'.repeat(52)}`); }
function ok(msg)    { console.log(`  ✓ ${msg}`); }
function info(msg)  { console.log(`  ${msg}`); }

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return {}; }
}
function saveState(data) {
  const merged = { ...loadState(), ...data };
  fs.writeFileSync(STATE, JSON.stringify(merged, null, 2));
}

// ── Retry wrapper — retries up to N times with delay ─────────────────────────
async function retry(fn, retries = 5, delayMs = 3000, label = '') {
  for (let i = 1; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries) throw e;
      info(`  ↻ ${label || e.name} — retrying in ${delayMs/1000}s (attempt ${i}/${retries})...`);
      await sleep(delayMs);
    }
  }
}

// ── STEP 1: Build Angular ────────────────────────────────────────────────────
async function buildAngular() {
  title('STEP 1 / 4 — Building Angular for production');
  info('Running ng build --configuration production...');
  info('(This takes ~30 seconds)\n');
  try {
    execSync('npx ng build --configuration production', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    ok('Build complete → dist/homespice/browser/');
  } catch (e) {
    throw new Error('Angular build failed. Check errors above.');
  }
}

// ── STEP 2: Create + configure S3 bucket ────────────────────────────────────
async function setupS3() {
  title('STEP 2 / 4 — Setting up S3 bucket');

  // 2a. Create bucket
  let bucketIsNew = false;
  try {
    const params = { Bucket: BUCKET };
    if (REGION !== 'us-east-1') {
      params.CreateBucketConfiguration = { LocationConstraint: REGION };
    }
    await s3.send(new CreateBucketCommand(params));
    ok(`Bucket created: ${BUCKET}`);
    bucketIsNew = true;
  } catch (e) {
    if (e.name === 'BucketAlreadyOwnedByYou') {
      ok(`Bucket already exists (owned by you): ${BUCKET}`);
    } else if (e.name === 'BucketAlreadyExists') {
      throw new Error(`Bucket name "${BUCKET}" is taken by another AWS account. Edit BUCKET in scripts/deploy.js to a unique name (e.g. "homespice-site-2026").`);
    } else {
      throw e;
    }
  }

  // 2b. Wait for bucket to be fully available (important for non-us-east-1)
  if (bucketIsNew) {
    info('Waiting for bucket to be ready...');
    await retry(
      () => s3.send(new HeadBucketCommand({ Bucket: BUCKET })),
      10, 2000, 'BucketNotReady'
    );
    ok('Bucket is ready');
    await sleep(1000); // extra buffer
  }

  // 2c. Remove public access block first (must happen before policy)
  await retry(
    () => s3.send(new DeletePublicAccessBlockCommand({ Bucket: BUCKET })),
    5, 2000, 'DeletePublicAccessBlock'
  );
  ok('Public access block removed');
  await sleep(1500);

  // 2d. Set ownership controls (must happen before policy on newer buckets)
  await retry(
    () => s3.send(new PutBucketOwnershipControlsCommand({
      Bucket: BUCKET,
      OwnershipControlsConfiguration: {
        Rules: [{ ObjectOwnership: 'BucketOwnerPreferred' }]
      }
    })),
    5, 2000, 'OwnershipControls'
  );
  ok('Ownership controls set');
  await sleep(1500);

  // 2e. Set public read bucket policy
  await retry(
    () => s3.send(new PutBucketPolicyCommand({
      Bucket: BUCKET,
      Policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Sid:       'PublicRead',
          Effect:    'Allow',
          Principal: '*',
          Action:    's3:GetObject',
          Resource:  `arn:aws:s3:::${BUCKET}/*`
        }]
      })
    })),
    5, 3000, 'PutBucketPolicy'
  );
  ok('Public read policy applied');

  // 2f. Enable static website hosting
  // ErrorDocument = index.html so Angular routes (/menu, /checkout etc) all work
  await retry(
    () => s3.send(new PutBucketWebsiteCommand({
      Bucket: BUCKET,
      WebsiteConfiguration: {
        IndexDocument: { Suffix: 'index.html' },
        ErrorDocument: { Key: 'index.html' }
      }
    })),
    5, 2000, 'PutBucketWebsite'
  );
  ok('Static website hosting enabled');
}

// ── STEP 3: Upload all built files to S3 ────────────────────────────────────
async function uploadToS3() {
  title('STEP 3 / 4 — Uploading files to S3');

  // Collect all files from dist folder recursively
  function walkDir(dir, base) {
    base = base || dir;
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(walkDir(fullPath, base));
      } else {
        results.push(fullPath);
      }
    }
    return results;
  }

  if (!fs.existsSync(DIST)) {
    throw new Error(`Build output not found at ${DIST}. Run "npm run build" first.`);
  }

  const files = walkDir(DIST);
  info(`Uploading ${files.length} files to s3://${BUCKET} ...\n`);

  let uploaded = 0;
  // Upload concurrently in batches of 10
  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(batch.map(async filePath => {
      const key          = filePath.replace(DIST + path.sep, '').replace(/\\/g, '/');
      const contentType  = mime.lookup(filePath) || 'application/octet-stream';
      const body         = fs.readFileSync(filePath);
      const isIndex      = key === 'index.html';

      // index.html: always fetch fresh (no cache) so new deploys are instant
      // All other files: cache forever (they have content hashes in filenames)
      const cacheControl = isIndex
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=31536000, immutable';

      await s3.send(new PutObjectCommand({
        Bucket:       BUCKET,
        Key:          key,
        Body:         body,
        ContentType:  contentType,
        CacheControl: cacheControl,
      }));

      uploaded++;
      process.stdout.write(`\r  ✓ ${uploaded}/${files.length} files uploaded`);
    }));
  }

  console.log(`\n`);
  ok(`All ${files.length} files uploaded`);
}

// ── STEP 4: Create CloudFront distribution or invalidate cache ───────────────
async function setupCloudFront() {
  title('STEP 4 / 4 — CloudFront CDN');

  const state = loadState();

  // Re-deploy: just invalidate the cache
  if (state.cfDistId) {
    info(`Distribution exists: ${state.cfDistId}`);
    info('Invalidating CloudFront cache...');
    await cf.send(new CreateInvalidationCommand({
      DistributionId: state.cfDistId,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: { Quantity: 1, Items: ['/*'] }
      }
    }));
    ok('Cache invalidated — new version live in ~30 seconds');
    return state.cfDomain;
  }

  // First deploy: create distribution
  info('Creating CloudFront distribution...');
  info('(First time only — propagates globally in ~5 minutes)');

  const s3Origin = `${BUCKET}.s3-website-${REGION}.amazonaws.com`;

  const result = await cf.send(new CreateDistributionCommand({
    DistributionConfig: {
      CallerReference:   Date.now().toString(),
      Comment:           'HomeSpice Indian Restaurant',
      DefaultRootObject: 'index.html',
      Enabled:           true,
      HttpVersion:       'http2and3',
      PriceClass:        'PriceClass_All',

      Origins: {
        Quantity: 1,
        Items: [{
          Id:         'S3WebsiteOrigin',
          DomainName: s3Origin,
          CustomOriginConfig: {
            HTTPPort:             80,
            HTTPSPort:            443,
            OriginProtocolPolicy: 'http-only'  // S3 website endpoints are HTTP only
          }
        }]
      },

      DefaultCacheBehavior: {
        TargetOriginId:       'S3WebsiteOrigin',
        ViewerProtocolPolicy: 'redirect-to-https',
        // AWS Managed-CachingOptimized policy
        CachePolicyId:        '658327ea-f89d-4fab-a63d-7e88639e58f6',
        Compress:             true,
        AllowedMethods: {
          Quantity: 2, Items: ['GET', 'HEAD'],
          CachedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] }
        }
      },

      // Angular SPA routing: all 404/403 from S3 → serve index.html
      CustomErrorResponses: {
        Quantity: 2,
        Items: [
          { ErrorCode: 404, ResponseCode: 200, ResponsePagePath: '/index.html', ErrorCachingMinTTL: 0 },
          { ErrorCode: 403, ResponseCode: 200, ResponsePagePath: '/index.html', ErrorCachingMinTTL: 0 }
        ]
      },

      ViewerCertificate: {
        CloudFrontDefaultCertificate: true  // Free *.cloudfront.net HTTPS
      }
    }
  }));

  const distId   = result.Distribution.Id;
  const cfDomain = `https://${result.Distribution.DomainName}`;

  saveState({ cfDistId: distId, cfDomain, bucket: BUCKET, region: REGION });
  ok(`Distribution created: ${distId}`);

  return cfDomain;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🍛  HomeSpice — Deploy to AWS S3 + CloudFront\n');

  try {
    await buildAngular();
    await setupS3();
    await uploadToS3();
    const cfDomain = await setupCloudFront();

    const state  = loadState();
    const domain = cfDomain || state.cfDomain;

    console.log(`\n${'═'.repeat(52)}`);
    console.log(`\n  🚀  DEPLOY COMPLETE!\n`);
    console.log(`  Live URL:       ${domain}`);
    console.log(`  S3 Bucket:      s3://${BUCKET}`);
    if (state.cfDistId) {
      console.log(`  CloudFront ID:  ${state.cfDistId}`);
    }
    console.log(`\n  ⏳  First deploy: wait ~5 mins to go fully global.`);
    console.log(`  ⚡  Re-deploys: live in ~30 seconds.\n`);
    console.log(`  📌  Add this URL to Firebase Authorized Domains:`);
    console.log(`      Firebase Console → Auth → Settings → Authorized domains`);
    console.log(`      → Add: ${domain.replace('https://','')}\n`);
    console.log(`${'═'.repeat(52)}\n`);

  } catch (e) {
    console.error(`\n❌ Deploy failed: ${e.message || e}\n`);
    if (e.message?.includes('credentials') || e.message?.includes('UnauthorizedAccess') || e.message?.includes('InvalidClientTokenId')) {
      console.error('  → Your AWS credentials are not set or are invalid.');
      console.error('  → Run: aws configure');
      console.error('  → Enter your AWS Access Key ID + Secret Access Key\n');
    }
    if (e.message?.includes('AccessDenied')) {
      console.error('  → Your AWS user lacks permissions.');
      console.error('  → Attach these policies in AWS IAM:');
      console.error('      AmazonS3FullAccess');
      console.error('      CloudFrontFullAccess\n');
    }
    process.exit(1);
  }
}

main();
