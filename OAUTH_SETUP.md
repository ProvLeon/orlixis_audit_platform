# OAuth Configuration Setup Guide

This guide helps you configure OAuth providers for the Orlixis Audit Platform to fix redirect URI errors.

## Problem Description

If you're seeing an error like "The `redirect_uri` is not associated with this application", it means your GitHub OAuth app configuration doesn't include the redirect URI that NextAuth is trying to use.

## GitHub OAuth App Configuration

### Step 1: Access GitHub OAuth App Settings

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click on "OAuth Apps"
3. Select your existing OAuth app or create a new one

### Step 2: Configure Redirect URIs

Your GitHub OAuth app needs TWO redirect URIs to support both sign-in and account linking:

#### For Local Development:
```
http://localhost:3000/api/auth/callback/github
http://localhost:3000/api/auth/link-github/callback
```

#### For Production:
```
https://yourdomain.com/api/auth/callback/github
https://yourdomain.com/api/auth/link-github/callback
```

### Step 3: Why Two Redirect URIs?

1. **`/api/auth/callback/github`** - Used by NextAuth for standard GitHub sign-in
2. **`/api/auth/link-github/callback`** - Used for linking GitHub accounts when already signed in with another provider (e.g., Google)

This approach separates concerns and avoids OAuth state conflicts between sign-in and account linking flows.

## Environment Variables Setup

Create or update your `.env.local` file:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL="your-database-connection-string"
```

## Production Environment Variables

For production deployment, update these values:

```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret-key
```

## Creating OAuth Apps

### GitHub OAuth App Setup

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Orlixis Audit Platform
   - **Homepage URL**: `http://localhost:3000` (dev) or `https://yourdomain.com` (prod)
   - **Authorization callback URL**: Add both URLs mentioned above
4. Save and copy the Client ID and Client Secret

### Google OAuth App Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Configure consent screen first if required
6. Create Web application credentials:
   - **Authorized JavaScript origins**: `http://localhost:3000`, `https://yourdomain.com`
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google`

## Testing the Configuration

### 1. Test Standard Sign-in Flow
- Visit `/auth/signin`
- Try signing in with both GitHub and Google
- Should work without redirect errors

### 2. Test Account Linking Flow
- Sign in with Google
- Go to `/profile` or `/upload`
- Try linking GitHub account
- Should redirect properly without OAuth errors

## Troubleshooting

### Common Issues

1. **"redirect_uri mismatch"**
   - Check that the GitHub OAuth callback URI is exactly configured: `/api/auth/callback/github`
   - Ensure no trailing slashes or typos in your GitHub OAuth app settings

2. **"NEXTAUTH_URL not set"**
   - Add `NEXTAUTH_URL` to your environment variables
   - Make sure it matches your actual domain (no trailing slash)

3. **"Client ID not found"**
   - Verify environment variables are loaded correctly
   - Check for typos in variable names

### Debug Mode

Enable NextAuth debug mode by adding to your `.env.local`:

```env
# Required environment variables
NEXTAUTH_DEBUG=true
```

This will provide detailed logs in your console for debugging both sign-in and account linking flows.

### Checking Environment Variables

Add this to any API route to verify your environment variables are loaded:

```typescript
console.log("Environment check:", {
  hasGithubId: !!process.env.GITHUB_CLIENT_ID,
  hasGithubSecret: !!process.env.GITHUB_CLIENT_SECRET,
  hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
  nextAuthUrl: process.env.NEXTAUTH_URL
})
```

## Security Notes

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use different secrets for production** - Don't reuse development secrets
3. **Restrict OAuth app permissions** - Only request necessary scopes
4. **Use HTTPS in production** - Never use HTTP for OAuth in production

## Support

If you continue to have issues:

1. Check the browser developer console for detailed error messages
2. Review server logs for OAuth flow errors
3. Verify OAuth app configuration matches exactly
4. Test with a fresh incognito/private browser session

## OAuth Flow Diagram

```
User Flow 1: GitHub Sign-in
User → /auth/signin → GitHub OAuth → /api/auth/callback/github → Dashboard

User Flow 2: Google + GitHub Linking
User → /auth/signin (Google) → Dashboard → Link GitHub → GitHub OAuth → /api/auth/link-github/callback → Profile
```

Each flow uses its dedicated callback endpoint to avoid OAuth state conflicts.
