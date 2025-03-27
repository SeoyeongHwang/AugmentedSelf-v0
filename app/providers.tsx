"use client"

import type React from "react"

import { AuthProvider } from "@/contexts/auth-context"
import { OnboardingProvider } from "@/contexts/onboarding-context"
import AuthWrapper from "./auth-wrapper"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <AuthWrapper>{children}</AuthWrapper>
      </OnboardingProvider>
    </AuthProvider>
  )
}

