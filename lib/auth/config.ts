import { prisma } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import type { Adapter } from "next-auth/adapters"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GitHubProvider({
      clientId: (process.env.GITHUB_CLIENT_ID ?? "").trim(),
      clientSecret: (process.env.GITHUB_CLIENT_SECRET ?? "").trim(),
      authorization: { params: { scope: "read:user user:email repo" } }
    }),
    GoogleProvider({
      clientId: (process.env.GOOGLE_CLIENT_ID ?? "").trim(),
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET ?? "").trim(),
      authorization: { params: { scope: "openid email profile" } }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60
  },
  callbacks: {
    async signIn({ account, user }) {
      console.log("SignIn callback received:", {
        provider: account?.provider,
        email: user?.email,
        hasAccount: !!account,
        hasUser: !!user,
        userImage: user?.image,
        accountData: account ? {
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId
        } : null
      })

      // Basic validation
      if (!user?.email || !account) {
        console.log("SignIn rejected: Missing email or account", {
          userEmail: user?.email,
          accountProvider: account?.provider
        })
        return false
      }

      try {
        // Check if this is a valid OAuth flow
        if (!account.providerAccountId) {
          console.log("SignIn rejected: Missing provider account ID")
          return false
        }

        // Allow sign in - PrismaAdapter will handle user/account creation
        console.log("SignIn allowed for:", {
          provider: account.provider,
          email: user.email,
          providerAccountId: account.providerAccountId
        })

        return true
      } catch (error) {
        console.error("SignIn callback error:", error)
        return false
      }
    },
    async jwt({ token, account, user }) {
      // Debug logging for user data from OAuth provider
      if (user) {
        console.log("JWT callback - User data from OAuth:", {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          provider: account?.provider
        })
      }

      // Persist provider/Access Token on sign-in
      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
        console.log("JWT callback - Account data:", {
          provider: account.provider,
          hasAccessToken: !!account.access_token
        })
      }
      // Hydrate basic profile fields on first sign-in
      if (user) {
        token.name = user.name
        token.email = user.email
        token.picture = user.image
        console.log("JWT callback - Token updated with user data:", {
          name: token.name,
          email: token.email,
          picture: token.picture
        })
      }
      // token.sub is the database user id when using PrismaAdapter
      return token
    },
    async session({ session, token }) {
      console.log("Session callback received:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasToken: !!token,
        tokenSub: token?.sub,
        tokenEmail: token?.email,
        tokenPicture: token?.picture,
        sessionUserEmail: session?.user?.email,
        sessionUserImage: session?.user?.image
      })

      if (session.user && token.sub) {
        session.user.id = token.sub
        if (token.email) session.user.email = token.email as string
        if (token.name) session.user.name = token.name as string
        if (token.picture) session.user.image = token.picture as string
        console.log("Session user ID set to:", token.sub)
          // Type assertion for extending session object
          ; (session as any).accessToken = token.accessToken as string | undefined
          ; (session as any).provider = token.provider as string | undefined
      }

      console.log("Final session:", {
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userImage: session?.user?.image,
        provider: (session as any)?.provider
      })

      return session
    },
    async redirect({ url, baseUrl }) {
      // Handle GitHub linking redirect with state parameter
      try {
        const urlObj = new URL(url)
        const state = urlObj.searchParams.get('state')

        if (state) {
          const parsedState = JSON.parse(state)

          // If this is a GitHub linking flow, redirect to the callback URL
          if (parsedState.linking === true && parsedState.callbackUrl) {
            return `${baseUrl}${parsedState.callbackUrl}?github_linked=success`
          }
        }
      } catch {
        // Not a valid state parameter, continue with normal redirect
      }

      // Check if this is a GitHub linking redirect
      if (url.includes('github_linked=true')) {
        return url // Allow the redirect with the parameter
      }

      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },
  events: {
    async linkAccount({ user, account }) {
      console.log("Account linked event:", { userId: user.id, provider: account.provider })

      if (account.provider === 'github') {
        console.log("GitHub account linked successfully:", {
          userId: user.id,
          githubId: account.providerAccountId,
          accessToken: account.access_token ? "present" : "missing",
          scope: account.scope
        })
      }
    },
    async createUser({ user }) {
      console.log("User created:", { userId: user.id, email: user.email })
    },
    async signIn({ user, account, isNewUser }) {
      console.log("SignIn event triggered:", {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser: isNewUser
      })

      if (account?.provider === 'github') {
        console.log("GitHub sign-in event successful:", {
          userId: user.id,
          email: user.email,
          provider: account.provider,
          isNewUser: isNewUser,
          scope: account.scope
        })
      }
    }
  },
  debug: process.env.NEXTAUTH_DEBUG === "true",
  secret: process.env.NEXTAUTH_SECRET
}
