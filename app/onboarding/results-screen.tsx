"use client"

import { useOnboarding } from "@/contexts/onboarding-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { SelfAspectCardComponent } from "@/components/self-aspect-card"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"

export default function ResultsScreen() {
  const { generatedCards, updateCardStatus, completeOnboarding, isGenerating } = useOnboarding()
  const router = useRouter()
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    console.log("Current cards status:", generatedCards.map(card => ({
      id: card.id,
      status: card.status
    })))
    
    const hasNewCards = generatedCards.some((card) => card.status === "new")
    console.log("Has new cards:", hasNewCards)
    console.log("Is completing:", isCompleting)
    console.log("Button should be disabled:", hasNewCards || isCompleting)
  }, [generatedCards, isCompleting])

  const handleComplete = async () => {
    console.log("handleComplete started")
    try {
      setIsCompleting(true)
      console.log("Calling completeOnboarding...")
      const success = await completeOnboarding()
      
      if (success) {
        console.log("completeOnboarding successful, attempting navigation...")
        router.replace('/dashboard')
      }
    } catch (error) {
      console.error("온보딩 완료 중 오류 발생:", error)
      toast({
        title: "온보딩 완료에 실패했습니다.",
        description: "다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsCompleting(false)
    }
  }

  if (isGenerating) {
    return (
      <div className="text-center">
        <p>Generating your self-aspects...</p>
      </div>
    )
  }

  if (!generatedCards.length) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Self-Aspects Generated</h3>
          <p className="text-muted-foreground">Unable to generate self-aspects. Please try again.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-4">
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {generatedCards.map((card) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SelfAspectCardComponent
              card={card}
              onCollect={() => updateCardStatus(card.id, "collected")}
              onReject={() => updateCardStatus(card.id, "rejected")}
            />
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center pt-6">
        <Button
          onClick={() => {
            console.log("Button clicked")
            handleComplete()
          }}
          disabled={
            generatedCards.some((card) => card.status === "new") || 
            isCompleting
          }
        >
          {isCompleting ? "Completing..." : "Complete Onboarding"}
        </Button>
        <div className="text-sm text-gray-500 mt-2">
          {generatedCards.some((card) => card.status === "new")}
        </div>
      </div>
    </div>
  )
}

