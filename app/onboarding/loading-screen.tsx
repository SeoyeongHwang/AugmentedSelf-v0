"use client"

import { Loader2 } from "lucide-react"

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h3 className="text-xl font-semibold">Generating your self-aspects...</h3>
      <p className="text-muted-foreground mt-2">
        We're analyzing your information to identify your unique self-aspects.
      </p>
    </div>
  )
}

