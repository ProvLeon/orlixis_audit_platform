# Dual GitHub OAuth App Setup Guide

This guide explains how to set up two separate GitHub OAuth applications to handle both sign-in and account linking flows without redirect URI conflicts.

## Why Two OAuth Apps?

GitHub OAuth apps only allow one authorization callback URL per app. Since we need:
1. `/api/auth/callback/github` for NextAuth sign-in
2. `/api/auth/link-github/callback` for account linking

We need two separate OAuth applications.

## Step 1: Create GitHub OAuth Apps

### App 1: Sign-In (NextAuth)
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in details:
   ```
   Application name: Orlixis Audit Platform
   Homepage URL: http://localhost:3000
   Authorization callback URL: http://localhost:3000/api/auth/callback/github
   ```
4. Save and copy Client ID and Client Secret

### App 2: Account Linking
1. Click "New OAuth App" again
2. Fill in details:
   ```
   Application name: Orlixis Audit Platform - Account Linking
   Homepage URL: http://localhost:3000
   Authorization callback URL: http://localhost:3000/api/auth/link-github/callback
   ```
3. Save and copy Client ID and Client Secret

## Step 2: Environment Variables

Update your `.env.local` file with both sets of credentials:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# GitHub OAuth App 1 (Sign-In)
GITHUB_CLIENT_ID=your-signin-client-id
GITHUB_CLIENT_SECRET=your-signin-client-secret

# GitHub OAuth App 2 (Account Linking)
GITHUB_LINK_CLIENT_ID=your-linking-client-id
GITHUB_LINK_CLIENT_SECRET=your-linking-client-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL="your-database-connection-string"
```

## Step 3: Production Setup

For production, create the same two OAuth apps with production URLs:

### App 1: Sign-In (Production)
```
Application name: Orlixis Audit Platform (Production)
Homepage URL: https://yourdomain.com
Authorization callback URL: https://yourdomain.com/api/auth/callback/github
```

### App 2: Account Linking (Production)
```
Application name: Orlixis Audit Platform - Account Linking (Production)
Homepage URL: https://yourdomain.com
Authorization callback URL: https://yourdomain.com/api/auth/link-github/callback
```

Production environment variables:
```env
NEXTAUTH_URL=https://yourdomain.com
# ... rest of production credentials
```

## Step 4: Update Code Configuration

The account linking endpoint will automatically use the new environment variables:

- NextAuth uses `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` for sign-in
- Account linking uses `GITHUB_LINK_CLIENT_ID` and `GITHUB_LINK_CLIENT_SECRET`

## Step 5: Verify Setup

1. **Test Sign-In Flow**:
   - Visit `/auth/signin`
   - Click "Continue with GitHub"
   - Should redirect to GitHub and back successfully

2. **Test Account Linking Flow**:
   - Sign in with Google first
   - Go to Profile page
   - Click "Connect GitHub"
   - Should redirect to GitHub and back with account linked

## Benefits of This Approach

✅ **Clean Separation**: Each OAuth flow has its dedicated app
✅ **No Conflicts**: No redirect URI conflicts
✅ **Better Security**: Separate scopes and permissions if needed
✅ **Easier Debugging**: Clear separation of concerns
✅ **GitHub Compliance**: Follows GitHub OAuth best practices

## Troubleshooting

### Common Issues

1. **Wrong Environment Variables**:
   - Make sure `GITHUB_LINK_CLIENT_ID` and `GITHUB_LINK_CLIENT_SECRET` are set
   - Check that you're using credentials from the correct OAuth app

2. **Redirect URI Mismatch**:
   - Verify the linking OAuth app has exactly: `/api/auth/link-github/callback`
   - No trailing slashes or typos

3. **CORS Issues**:
   - Make sure Homepage URL matches your actual domain
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`

### Debug Steps

1. Check environment variables are loaded:
   ```bash
   # In your terminal
   echo $GITHUB_LINK_CLIENT_ID
   ```

2. Visit debug endpoint:
   ```
   GET /api/auth/debug
   ```

3. Check server logs for OAuth errors

## Security Notes

- Never commit `.env.local` to version control
- Use different secrets for development and production
- Consider using GitHub Apps instead of OAuth Apps for enhanced security
- Regularly rotate OAuth secrets
- Monitor OAuth app usage in GitHub settings

## OAuth Flow Diagram

```
Sign-In Flow:
User → /auth/signin → GitHub OAuth App 1 → /api/auth/callback/github → Dashboard

Linking Flow:
User (signed in) → Profile → Link GitHub → GitHub OAuth App 2 → /api/auth/link-github/callback → Profile
```

This setup ensures both flows work independently without conflicts.
