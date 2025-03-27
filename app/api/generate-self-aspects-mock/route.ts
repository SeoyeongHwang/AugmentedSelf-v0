import { type NextRequest, NextResponse } from "next/server"
import type { SelfAspectCard } from "@/types/onboarding"

export async function POST(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock generated cards
    const mockCards: SelfAspectCard[] = [
      {
        id: "card-1",
        title: "Analytical Problem-Solver",
        description:
          "You enjoy breaking down complex problems into manageable parts and finding practical solutions. You're thoughtful and methodical in your approach to challenges, preferring to understand all aspects before making decisions.",
        traits: ["Conscientiousness", "Openness"],
        status: "new",
      },
      {
        id: "card-2",
        title: "Compassionate Community Member",
        description:
          "You care deeply about the welfare of others and your community. You find fulfillment in helping people and contributing positively to society, often putting others' needs alongside your own.",
        traits: ["Benevolence", "Agreeableness"],
        status: "new",
      },
      {
        id: "card-3",
        title: "Independent Self-Determiner",
        description:
          "You value your independence and ability to make your own choices. You prefer setting your own path rather than following others' expectations, and you take responsibility for your decisions and their outcomes.",
        traits: ["Autonomy", "Low Conformity"],
        status: "new",
      },
    ]

    return NextResponse.json({ cards: mockCards })
  } catch (error) {
    console.error("Error in mock API:", error)
    return NextResponse.json({ error: "Failed to generate mock self-aspects" }, { status: 500 })
  }
}

