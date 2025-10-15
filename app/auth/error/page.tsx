"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react"

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get("error")

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case "OAuthAccountNotLinked":
        return {
          title: "Account Already Exists",
          message: "An account with this email already exists with a different sign-in method. Please use the same method you used when you first signed up.",
          suggestion: "Try signing in with the original provider you used to create your account."
        }
      case "OAuthSignin":
        return {
          title: "OAuth Sign-in Error",
          message: "There was an error during the OAuth sign-in process.",
          suggestion: "Please try again or contact support if the issue persists."
        }
      case "OAuthCallback":
        return {
          title: "OAuth Callback Error",
          message: "There was an error processing the OAuth callback.",
          suggestion: "Please try signing in again."
        }
      case "OAuthCreateAccount":
        return {
          title: "Account Creation Error",
          message: "Unable to create your account with this OAuth provider.",
          suggestion: "Please try again or use a different sign-in method."
        }
      case "EmailCreateAccount":
        return {
          title: "Email Account Error",
          message: "Unable to create an account with this email address.",
          suggestion: "Please check your email address and try again."
        }
      case "Callback":
        return {
          title: "Callback Error",
          message: "There was an error in the authentication callback.",
          suggestion: "Please try signing in again."
        }
      case "EmailSignin":
        return {
          title: "Email Sign-in Error",
          message: "Unable to send sign-in email.",
          suggestion: "Please check your email address and try again."
        }
      case "CredentialsSignin":
        return {
          title: "Invalid Credentials",
          message: "The credentials you provided are incorrect.",
          suggestion: "Please check your details and try again."
        }
      case "SessionRequired":
        return {
          title: "Session Required",
          message: "You must be signed in to access this page.",
          suggestion: "Please sign in to continue."
        }
      case "AccessDenied":
        return {
          title: "Access Denied",
          message: "You do not have permission to access this resource.",
          suggestion: "Please contact support if you believe this is an error."
        }
      case "Verification":
        return {
          title: "Verification Error",
          message: "The verification token is invalid or has expired.",
          suggestion: "Please request a new verification link."
        }
      default:
        return {
          title: "Authentication Error",
          message: "An unexpected error occurred during authentication.",
          suggestion: "Please try again or contact support if the issue persists."
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border border-slate-700 bg-slate-800/90 backdrop-blur shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 flex items-center gap-3">
              <Image src="/orlixis_logomark.png" alt="Orlixis" width={32} height={32} className="rounded-lg" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">Orlixis</div>
                <div className="text-xs text-slate-400">Audit Platform</div>
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-white">
              Authentication Error
            </CardTitle>
            <CardDescription className="text-slate-300 text-sm">
              We encountered an issue while signing you in
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert className="border-red-500/40 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">
                <div className="font-semibold mb-1">{errorInfo.title}</div>
                <div className="text-sm">{errorInfo.message}</div>
              </AlertDescription>
            </Alert>

            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-slate-200 mb-2">What to do next:</h4>
              <p className="text-xs text-slate-300">{errorInfo.suggestion}</p>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                <Link href="/auth/signin">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full bg-transparent border-slate-600 text-slate-200 hover:bg-slate-700">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Home
                </Link>
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <p className="text-xs text-center text-slate-400">
                Still having trouble?{" "}
                <Link href="/support" className="text-teal-400 hover:underline">
                  Contact Support
                </Link>
              </p>
            </div>

            {process.env.NODE_ENV === "development" && error && (
              <div className="mt-4 p-3 bg-slate-900/50 rounded border border-slate-600">
                <p className="text-xs text-slate-400 font-mono">
                  Debug: {error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  )
}
