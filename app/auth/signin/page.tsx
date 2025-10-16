"use client"

import React, { useState, useEffect, Suspense } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Github,
  Chrome,
  Shield,
  CheckCircle,
  Lock,
  Zap,
  Users,
  BarChart3,
  AlertCircle,
  Loader2,
  ArrowRight
} from "lucide-react"
import { SiGithub, SiGooglechrome } from "react-icons/si"

const features = [
  {
    icon: Shield,
    title: "Advanced Security",
    description: "Comprehensive vulnerability scanning"
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Live insights and metrics"
  },
  {
    icon: Zap,
    title: "Fast Processing",
    description: "Lightning-fast analysis"
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Share and collaborate"
  }
]

const benefits = [
  "Access to all GitHub repositories",
  "Professional audit reports",
  "Real-time vulnerability scanning",
  "Team collaboration tools"
]

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard"
  const errorParam = searchParams?.get("error")

  useEffect(() => {
    if (errorParam) {
      switch (errorParam) {
        case "OAuthSignin":
          setError("Error occurred during OAuth sign in. Please try again.")
          break
        case "OAuthCallback":
          setError("Error in OAuth callback. Please try again.")
          break
        case "OAuthCreateAccount":
          setError("Could not create OAuth account. Please try again.")
          break
        case "EmailCreateAccount":
          setError("Could not create account. Please try again.")
          break
        case "Callback":
          setError("Error in callback. Please try again.")
          break
        case "OAuthAccountNotLinked":
          setError("An account with this email already exists. Please sign in with your original provider (GitHub or Google) that you first used to create your account.")
          break
        case "EmailSignin":
          setError("Check your email address.")
          break
        case "CredentialsSignin":
          setError("Sign in failed. Check the details you provided are correct.")
          break
        case "SessionRequired":
          setError("Please sign in to access this page.")
          break
        default:
          setError("An error occurred during sign in. Please try again.")
      }
    }

    // Check if user is already signed in
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push(callbackUrl)
      }
    }
    checkSession()
  }, [errorParam, router, callbackUrl])

  const handleSignIn = async (provider: "github" | "google") => {
    try {
      setIsLoading(provider)
      setError(null)

      const result = await signIn(provider, {
        callbackUrl,
        redirect: false
      })

      if (result?.error) {
        setError(`Failed to sign in with ${provider}. Please try again.`)
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      console.error(`${provider} sign in error:`, error)
      setError(`An error occurred during ${provider} sign in. Please try again.`)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* Left Side - Sign In Form */}
        <div className="flex justify-center lg:justify-end">
          <Card className="w-full max-w-md border border-slate-700 bg-slate-800/90 backdrop-blur shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 flex items-center gap-3">
                <Image src="/orlixis_logomark.png" alt="Orlixis" width={32} height={32} className="rounded-lg" />
                <div className="text-left">
                  <div className="text-xl font-bold text-white">Orlixis</div>
                  <div className="text-xs text-slate-400">Audit Platform</div>
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-white">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-slate-300 text-sm">
                Sign in to access professional codebase auditing
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-500/40 bg-red-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {/* GitHub Sign In */}
                <Button
                  onClick={() => handleSignIn("github")}
                  disabled={isLoading !== null}
                  size="lg"
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white border-0 shadow-md transition-all duration-200"
                >
                  {isLoading === "github" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <SiGithub className="h-4 w-4 mr-2" />
                  )}
                  Continue with GitHub
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-slate-800 px-2 text-slate-400">or</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <Button
                  onClick={() => handleSignIn("google")}
                  disabled={isLoading !== null}
                  size="lg"
                  variant="outline"
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 hover:text-gray-900 border border-slate-600 focus:text-gray-900"
                >
                  {isLoading === "google" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <SiGooglechrome className="h-4 w-4 mr-2" />
                  )}
                  Continue with Google
                </Button>
              </div>

              {/* Compact Benefits */}
              <div className="pt-4 border-t border-slate-700">
                <div className="grid grid-cols-2 gap-2">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-teal-400 flex-shrink-0" />
                      <span className="text-slate-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Lock className="h-4 w-4 text-teal-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-teal-400">Secure Authentication</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Industry-standard OAuth 2.0. Your credentials are never stored.
                      {errorParam === "OAuthAccountNotLinked" && (
                        <span className="block mt-1 text-yellow-300">
                          Tip: Use the same sign-in method (GitHub or Google) that you used when you first created your account.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <p className="text-xs text-center text-slate-400">
                By signing in, you agree to our{" "}
                <Link href="/terms" className="text-teal-400 hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-teal-400 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Hero Content */}
        <div className="relative flex items-center justify-center lg:justify-start">
          <div className="relative w-full max-w-lg">
            {/* Subtle background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-purple-500/20 rounded-3xl blur-3xl transform scale-110" />

            {/* Content */}
            <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
              <Badge variant="secondary" className="mb-4 bg-teal-500/20 text-teal-300 border-teal-500/30">
                Professional Code Auditing
              </Badge>

              <h1 className="text-3xl font-bold text-white mb-3 leading-tight">
                Secure your codebase with{" "}
                <span className="bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
                  confidence
                </span>
              </h1>

              <p className="text-slate-300 mb-6">
                Comprehensive security analysis, vulnerability detection, and professional reporting for modern development teams.
              </p>

              {/* Compact Features Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {features.map((feature, index) => (
                  <div key={index} className="group">
                    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 hover:bg-slate-700/70 transition-colors">
                      <div className="flex items-start space-x-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20">
                          <feature.icon className="h-4 w-4 text-teal-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm mb-1">{feature.title}</h3>
                          <p className="text-xs text-slate-300">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Ready to get started?</h3>
                    <p className="text-teal-100 text-sm">Join thousands of developers</p>
                  </div>
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>

              {/* Compact Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-700">
                <div className="text-center">
                  <div className="text-xl font-bold text-teal-400">50K+</div>
                  <div className="text-xs text-slate-400">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-teal-400">1M+</div>
                  <div className="text-xs text-slate-400">Vulnerabilities</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-teal-400">99.9%</div>
                  <div className="text-xs text-slate-400">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
