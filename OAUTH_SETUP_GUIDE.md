# OAuth Setup Guide for BRANDING TEAM

This guide will help you set up Google and GitHub OAuth authentication for your BRANDING TEAM platform.

## Prerequisites

- Convex deployed to production (`npm convex deploy`)
- Production Convex URL: `https://warmhearted-marmot-427.convex.cloud`
- Your production domain (e.g., `your-app.vercel.app`)

---

## 1. Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**

### Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in required information:
   - **App name**: BRANDING TEAM
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Add test users (your email) for testing
6. Save and continue

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: BRANDING TEAM Production
5. **Authorized JavaScript origins**:
   ```
   https://your-app.vercel.app
   http://localhost:3000  (for local testing)
   ```
6. **Authorized redirect URIs**:
   ```
   https://warmhearted-marmot-427.convex.cloud/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google (for local testing)
   ```
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

---

## 2. GitHub OAuth Setup

### Step 1: Create OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: BRANDING TEAM
   - **Homepage URL**: `https://your-app.vercel.app`
   - **Authorization callback URL**:
     ```
     https://warmhearted-marmot-427.convex.cloud/api/auth/callback/github
     ```
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret**
7. Copy the **Client Secret**

---

## 3. Configure Convex with OAuth Credentials

### Step 1: Set Environment Variables in Convex

Run these commands in your terminal:

```bash
# Google OAuth
npx convex env set AUTH_GOOGLE_ID "your-google-client-id"
npx convex env set AUTH_GOOGLE_SECRET "your-google-client-secret"

# GitHub OAuth
npx convex env set AUTH_GITHUB_ID "your-github-client-id"
npx convex env set AUTH_GITHUB_SECRET "your-github-client-secret"
```

### Step 2: Deploy with New Configuration

```bash
npx convex deploy -y
```

---

## 4. Configure Vercel

### Environment Variables

In your Vercel project settings, add:

```
NEXT_PUBLIC_CONVEX_URL=https://warmhearted-marmot-427.convex.cloud
```

### Important: Update Redirect URIs

Once you know your Vercel production URL (e.g., `brandingteam.vercel.app`), update:

1. **Google Cloud Console**:
   - Add `https://brandingteam.vercel.app` to Authorized JavaScript origins
   - Keep the Convex callback URL as-is

2. **GitHub OAuth App**:
   - Update Homepage URL to `https://brandingteam.vercel.app`
   - Keep the callback URL as-is

---

## 5. Testing

### Local Testing

1. Make sure `.env.local` has:
   ```
   NEXT_PUBLIC_CONVEX_URL=https://warmhearted-marmot-427.convex.cloud
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Go to `http://localhost:3000/login`
4. Click **Google** or **GitHub** button
5. Complete OAuth flow

### Production Testing

1. Deploy to Vercel
2. Visit your production URL `/login`
3. Test OAuth buttons

---

## Troubleshooting

### "redirect_uri_mismatch" Error

**Problem**: OAuth provider rejects the redirect URI

**Solution**:
- Double-check redirect URIs in Google/GitHub match **exactly**
- Use the Convex deployment URL for callback: `https://warmhearted-marmot-427.convex.cloud/api/auth/callback/[provider]`
- Make sure there are no trailing slashes

### "Invalid client" Error

**Problem**: Client ID or Secret is wrong

**Solution**:
- Re-check credentials in Google Cloud Console / GitHub
- Re-run `npx convex env set` commands
- Redeploy: `npx convex deploy -y`

### OAuth Works Locally but Not in Production

**Problem**: Authorized origins not updated

**Solution**:
- Add your Vercel domain to authorized JavaScript origins (Google)
- Update homepage URL (GitHub)
- Remember: callback URL always points to **Convex**, not your app

---

## Security Notes

1. **Never commit OAuth secrets** to version control
2. Rotate secrets periodically
3. Use different OAuth apps for development and production
4. Monitor OAuth usage in Google Cloud Console

---

## Quick Reference

| Provider | Callback URL |
|----------|-------------|
| Google   | `https://warmhearted-marmot-427.convex.cloud/api/auth/callback/google` |
| GitHub   | `https://warmhearted-marmot-427.convex.cloud/api/auth/callback/github` |

**Convex Environment Variables:**
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`

**Set with:**
```bash
npx convex env set AUTH_GOOGLE_ID "your-value"
```

---

## Need Help?

- [Convex Auth Documentation](https://docs.convex.dev/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps)
