"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/")
    } else if (user && !user.onboardingCompleted) {
      router.replace("/onboarding")
    }
  }, [user, loading, router])

  if (loading) {
    return null
  }

  if (!user) {
    return null
  }

  return children
}

