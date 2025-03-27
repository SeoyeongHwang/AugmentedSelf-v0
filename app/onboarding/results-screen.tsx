"use client"

import { useOnboarding } from "@/contexts/onboarding-context"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

export default function ResultsScreen() {
  const { generatedCards, updateCardStatus, completeOnboarding, isGenerating, data } = useOnboarding()
  const [isUsingMockApi, setIsUsingMockApi] = useState(false)
  const [mockCards, setMockCards] = useState<any[]>([])
  const [isMockLoading, setIsMockLoading] = useState(false)

  const tryMockApi = async () => {
    setIsMockLoading(true)
    try {
      const response = await fetch("/api/generate-self-aspects-mock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.cards) {
        setMockCards(result.cards)
        setIsUsingMockApi(true)
      }
    } catch (error) {
      console.error("Error using mock API:", error)
    } finally {
      setIsMockLoading(false)
    }
  }

  const displayCards = isUsingMockApi ? mockCards : generatedCards
  const isLoading = isUsingMockApi ? isMockLoading : isGenerating

  const handleCardStatus = (card: any, status: "collected" | "rejected") => {
    if (isUsingMockApi) {
      setMockCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, status } : c)))
    } else {
      updateCardStatus(card.id, status)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <h3 className="text-xl font-semibold">Generating your self-aspects...</h3>
        <p className="text-muted-foreground mt-2">
          We're analyzing your information to identify your unique self-aspects.
        </p>
      </div>
    )
  }

  // Check if there's an error card
  const hasError = displayCards.some((card) => card.title === "API Error" || card.traits.includes("Error"))

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Your Self-Aspect Cards</h2>
        <p className="text-muted-foreground">
          Based on your information, we've identified these self-aspects. Collect the ones that resonate with you.
        </p>
      </div>

      {hasError && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <AlertTriangle className="h-6 w-6 text-amber-500 mt-1" />
              <div>
                <h3 className="font-medium">There was an error generating your self-aspects</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We encountered an issue with the AI service. You can try again or use our backup system.
                </p>
                <Button
                  onClick={tryMockApi}
                  variant="outline"
                  className="mt-4"
                  disabled={isMockLoading || isUsingMockApi}
                >
                  {isMockLoading ? "Loading..." : "Try Backup System"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {displayCards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
                <div className="flex flex-wrap gap-1 mt-2">
                  {card.traits.map((trait: string) => (
                    <span
                      key={trait}
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant={card.status === "collected" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCardStatus(card, "collected")}
                  className={card.status === "collected" ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Collect
                </Button>
                <Button
                  variant={card.status === "rejected" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCardStatus(card, "rejected")}
                  className={card.status === "rejected" ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  <ThumbsDown className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <Button onClick={completeOnboarding} size="lg">
          Complete Onboarding
        </Button>
      </div>
    </div>
  )
}

