"use client"

import { useState } from "react"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import SocialIdentityForm from "./social-identity-form"
import PersonalIdentityForm from "./personal-identity-form"
import PersonalContextForm from "./personal-context-form"
import ResultsScreen from "./results-screen"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

export default function OnboardingPage() {
  const { currentStep, nextStep, prevStep, isGenerating } = useOnboarding()
  const [isLoading, setIsLoading] = useState(false)

  const getProgress = () => {
    switch (currentStep) {
      case "social":
        return 25
      case "personal":
        return 50
      case "context":
        return 75
      case "results":
        return 100
      default:
        return 0
    }
  }

  const handleNextStep = async () => {
    if (currentStep === "context") {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsLoading(false)
    }
    nextStep()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Augmented Self Onboarding</CardTitle>
          <CardDescription className="text-center">
            {currentStep === "social" && "Tell us about your social identity"}
            {currentStep === "personal" && "Let's understand your personality and values"}
            {currentStep === "context" && "Share your personal life context"}
            {currentStep === "results" && "Your self-aspect cards"}
          </CardDescription>
          <Progress value={getProgress()} className="w-full mt-2" />
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="text-xl font-semibold">Processing your information...</h3>
              <p className="text-muted-foreground mt-2">We're preparing to generate your self-aspects.</p>
            </div>
          ) : (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === "social" && <SocialIdentityForm />}
              {currentStep === "personal" && <PersonalIdentityForm />}
              {currentStep === "context" && <PersonalContextForm />}
              {currentStep === "results" && <ResultsScreen />}
            </motion.div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === "social" || isLoading || isGenerating}>
            Previous
          </Button>
          {currentStep !== "results" ? (
            <Button onClick={handleNextStep} disabled={isLoading || isGenerating}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Next"
              )}
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  )
}

