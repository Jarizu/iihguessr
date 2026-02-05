# IIHGuessr Deployment Guide

## Prerequisites

1. **GitHub Repository**: Already created and ready to push
2. **Domain**: iihguessr.com (you're purchasing)
3. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
4. **Neon PostgreSQL**: We'll create this
5. **Google OAuth Credentials**: You already have these

## Step 1: Create Neon PostgreSQL Database

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project named "iihguessr"
3. Select a region close to your users
4. Copy the connection string - it will look like:
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

## Step 2: Update Prisma Schema for PostgreSQL

The schema has already been set up for PostgreSQL. The main difference from SQLite:
- Uses `postgresql` instead of `sqlite` provider
- All existing migrations will need to be run fresh

## Step 3: Push to GitHub

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/iihguessr.git

# Push to GitHub
git push -u origin main
```

## Step 4: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository `iihguessr`
3. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next
   - **Install Command**: `npm install`

4. Add Environment Variables:

```env
# Database
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# NextAuth
NEXTAUTH_URL=https://iihguessr.com
NEXTAUTH_SECRET=<generate-new-secret>

# Google OAuth (same as local)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

To generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

5. Click "Deploy"

## Step 5: Run Database Migrations

After first deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.production

# Run migrations against production database
npx prisma migrate deploy

# Or if you prefer to use Vercel's CLI directly:
vercel env exec -- npx prisma migrate deploy
```

## Step 6: Seed Database with Card Data

You'll need to populate the database with card data from 17lands and Scryfall:

```bash
# This should be run once to populate all cards
# You may want to create a separate script or endpoint for this
npm run sync
```

Or create an admin endpoint at `/api/admin/sync` that you can call once after deployment.

## Step 7: Configure Domain

1. In Vercel project settings, go to "Domains"
2. Add your domain: `iihguessr.com`
3. Follow Vercel's instructions to update your DNS settings:
   - Add A record pointing to Vercel's IP
   - Or add CNAME record pointing to `cname.vercel-dns.com`

## Step 8: Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your OAuth credentials
3. Add authorized redirect URIs:
   ```
   https://iihguessr.com/api/auth/callback/google
   https://www.iihguessr.com/api/auth/callback/google
   ```

## Database Migration Notes

### Differences from SQLite to PostgreSQL:

1. **Connection String Format**:
   - SQLite: `file:./dev.db`
   - PostgreSQL: `postgresql://user:pass@host/db?sslmode=require`

2. **Data Types**: Prisma handles this automatically
3. **No Local .db File**: All data is remote in Neon

### Migrating Existing Data (Optional)

If you want to keep your local test data:

1. Export from SQLite:
```bash
sqlite3 prisma/dev.db .dump > backup.sql
```

2. Transform and import to PostgreSQL (manual process, may need adjustments)

For a fresh start (recommended):
- Just run `npma prisma migrate deploy` on the production database
- The schema will be created empty
- Run sync scripts to populate card data

## Monitoring and Maintenance

1. **Database**: Monitor usage in Neon dashboard
2. **Vercel**: Check deployment logs and analytics
3. **17lands Data**: Consider setting up a cron job to update card data weekly

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all environment variables are set
- Verify PostgreSQL connection string is correct

### Database Connection Issues
- Verify `?sslmode=require` is in connection string
- Check Neon project is active
- Ensure IP allowlist is configured (if applicable)

### OAuth Issues
- Verify redirect URIs match exactly
- Check NEXTAUTH_URL matches your domain
- Ensure NEXTAUTH_SECRET is set

## Cost Estimates

- **Neon PostgreSQL**: Free tier (500MB storage, 1GB data transfer)
- **Vercel**: Free tier (unlimited hobby projects, bandwidth limits)
- **Domain**: ~$12/year
- **Total**: ~$12/year (within free tiers)

## Updating the Application

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main

# Vercel will automatically deploy
```
