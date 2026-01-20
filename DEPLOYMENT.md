# Deployment Checklist for Vercel

## Pre-Deployment

- [ ] All environment variables are in `.env` (never committed)
- [ ] `.env` is in `.gitignore`
- [ ] Test build locally: `npm run build`
- [ ] Test preview locally: `npm run preview`
- [ ] All console.logs are removed (or will be in production build)
- [ ] Error boundaries are in place
- [ ] Images are optimized

## Vercel Setup

1. **Connect Repository**
   - [ ] Push code to GitHub
   - [ ] Import project in Vercel
   - [ ] Select framework: Vite

2. **Environment Variables**
   Add these in Vercel → Project Settings → Environment Variables:
   - [ ] `VITE_SUPABASE_URL`
   - [ ] `VITE_SUPABASE_ANON_KEY`

3. **Build Settings** (should auto-detect)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy**
   - [ ] Click "Deploy"
   - [ ] Wait for build to complete
   - [ ] Visit your deployment URL

## Post-Deployment

1. **Update Supabase Settings**
   - [ ] Add Vercel URL to Supabase → Authentication → URL Configuration
   - [ ] Update Site URL: `https://your-app.vercel.app`
   - [ ] Add Redirect URL: `https://your-app.vercel.app/**`

2. **Update Google OAuth (if enabled)**
   - [ ] Add Vercel URL to Google Cloud Console
   - [ ] Authorized JavaScript origins: `https://your-app.vercel.app`
   - [ ] Authorized redirect URIs: `https://your-app.vercel.app`

3. **Test Production**
   - [ ] Sign up with test account
   - [ ] Sign in with email/password
   - [ ] Sign in with Google (if enabled)
   - [ ] Add family members
   - [ ] Upload photos
   - [ ] Test auto-layout
   - [ ] Test theme switching
   - [ ] Check mobile responsiveness

## Performance Checks

- [ ] Run Lighthouse audit (aim for 90+ on all metrics)
- [ ] Check bundle size (should be < 500KB gzipped)
- [ ] Test loading speed on slow 3G
- [ ] Verify images load quickly

## Monitoring

- [ ] Check Vercel Analytics (if enabled)
- [ ] Monitor error logs in Vercel dashboard
- [ ] Check Supabase logs for any auth issues

## Ongoing

- [ ] Set up automatic deployments (Vercel does this by default)
- [ ] Every git push to main = automatic deployment
- [ ] Preview deployments for pull requests