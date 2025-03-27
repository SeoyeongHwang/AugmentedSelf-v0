"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    console.log('AuthWrapper: Current state:', { user, loading, pathname })

    if (!loading) {
      if (!user) {
        console.log('AuthWrapper: No user, redirecting to login')
        // If user is not logged in, only allow access to login page
        if (pathname !== "/") {
          router.replace("/")
        }
      } else {
        console.log('AuthWrapper: User logged in, checking onboarding status:', user.onboardingCompleted)
        // If user is logged in
        if (pathname === "/") {
          // If on login page, redirect based on onboarding status
          if (!user.onboardingCompleted) {
            console.log('AuthWrapper: Redirecting to onboarding')
            router.replace("/onboarding")
          } else {
            console.log('AuthWrapper: Redirecting to dashboard')
            router.replace("/dashboard")
          }
        } else if (pathname === "/onboarding" && user.onboardingCompleted) {
          // If onboarding is completed, redirect to dashboard
          console.log('AuthWrapper: Onboarding completed, redirecting to dashboard')
          router.replace("/dashboard")
        } else if (pathname === "/dashboard" && !user.onboardingCompleted) {
          // If onboarding is not completed, redirect to onboarding
          console.log('AuthWrapper: Onboarding not completed, redirecting to onboarding')
          router.replace("/onboarding")
        }
      }
    }
  }, [user, loading, router, pathname])

  if (loading) {
    console.log('AuthWrapper: Loading state')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  console.log('AuthWrapper: Rendering children')
  return children
}

