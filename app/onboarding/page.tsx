"use client"

import { useState } from "react"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import SocialIdentityForm from "./social-identity-form"
import PersonalityAssessmentForm from "./personality-assessment-form"
import ValuesAssessmentForm from "./values-assessment-form"
import PersonalContextForm from "./personal-context-form"
import ResultsScreen from "./results-screen"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

export default function OnboardingPage() {
  const { currentStep, nextStep, prevStep, isGenerating, data, generateSelfAspectCards } = useOnboarding()
  const [isLoading, setIsLoading] = useState(false)

  const getProgress = () => {
    switch (currentStep) {
      case "social":
        return 20
      case "personality":
        return 40
      case "values":
        return 60
      case "context":
        return 80
      case "results":
        return 100
      default:
        return 0
    }
  }

  const handleNextStep = async () => {
    if (currentStep === "context") {
      try {
        setIsLoading(true)
        await generateSelfAspectCards()  // self-aspect 카드 생성
        setIsLoading(false)  // 먼저 로딩 상태를 해제하고
        setTimeout(() => {    // 약간의 지연 후 다음 단계로 이동
          nextStep()
        }, 100)
      } catch (error) {
        console.error("Error generating self-aspect cards:", error)
        setIsLoading(false)
      }
    } else {
      nextStep()
    }
  }

  const isNextDisabled = () => {
    if (isLoading || isGenerating) return true
    
    // context 단계에서의 유효성 검사
    if (currentStep === "context") {
      return !data.context.contexts.every((context) => context.content.trim() !== '')
    }
    
    return false
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-[1400px]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Tell Us About Yourself</CardTitle>
          <CardDescription className="text-center">
            {currentStep === "social" && "Let's understand your social identity"}
            {currentStep === "personality" && "Let's understand your personality traits"}
            {currentStep === "values" && "Let's understand your personal values"}
            {currentStep === "context" && "Share your personal life context"}
            {currentStep === "results" && "Your discovered self-aspect"}
          </CardDescription>
          <Progress value={getProgress()} className="w-full mt-2" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="text-xl font-semibold">Processing your information...</h3>
              <p className="text-muted-foreground mt-2">We're preparing to generate your self-aspects.</p>
            </div>
          ) : (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === "social" && <SocialIdentityForm />}
              {currentStep === "personality" && <PersonalityAssessmentForm />}
              {currentStep === "values" && <ValuesAssessmentForm />}
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
            <Button onClick={handleNextStep} disabled={isNextDisabled()}>
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

