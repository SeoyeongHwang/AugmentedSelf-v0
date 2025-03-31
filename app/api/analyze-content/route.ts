// 이 파일은 콘텐츠 분석을 위한 API 엔드포인트를 정의합니다.
// 클라이언트로부터 요청을 받아 OpenAI API를 호출하고,
// 분석 결과를 JSON 형식으로 반환합니다.
import { type NextRequest, NextResponse } from "next/server"
import type { SelfAspectCard } from "@/types/onboarding"
import OpenAI from "openai"
import { SYSTEM_PROMPT, constructSelfAspectPrompt } from '@/src/lib/prompts/self-aspects'
import { AI_MODELS, MODEL_CONFIGS } from '@/src/lib/constants/ai-models'

export const runtime = "nodejs"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Mock data for fallback
const mockNewCards: { cards: SelfAspectCard[] } = {
  cards: [
    {
      id: `mock-${Date.now()}-1`,
      title: "Personal Growth Journey",
      description: "Reflecting on personal development and self-discovery through daily experiences.",
      traits: ["Growth", "Self-awareness"],
      status: "new",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: `mock-${Date.now()}-2`,
      title: "Emotional Expression",
      description: "Exploring and expressing emotions through writing and reflection.",
      traits: ["Emotional intelligence", "Self-expression"],
      status: "new",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
}

export async function POST(request: NextRequest) {
  try {
    console.log("Starting content analysis")
    const { content, userData } = await request.json()
    
    if (!content || !userData) {
      return NextResponse.json(
        { error: "Content and user data are required" },
        { status: 400 }
      )
    }

    // Construct the prompt using journal type
    const prompt = constructSelfAspectPrompt(userData, 'journal', content)
    console.log("Constructed prompt length:", prompt.length)

    const model = AI_MODELS.DEFAULT.SELF_ASPECTS
    const config = MODEL_CONFIGS[model]

    console.log("Using model:", model)
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens
    })

    const aiResponse = response.choices[0].message.content || ""
    console.log("Raw AI response:", aiResponse)

    // Parse the response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
    } catch (error) {
      console.error("Error parsing AI response:", error)
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      )
    }

    return NextResponse.json(parsedResponse)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to analyze content" },
      { status: 500 }
    )
  }
}

// Helper function to parse the response
function parseResponse(responseText: string) {
  try {
    // Remove markdown code block markers and find JSON content
    const jsonMatch = responseText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) || 
                     responseText.match(/({[\s\S]*})/)
    
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response")
    }

    const jsonStr = jsonMatch[1]
    const parsed = JSON.parse(jsonStr)

    // Validate the response structure
    if (!parsed.cards || !Array.isArray(parsed.cards)) {
      throw new Error("Invalid response structure: missing or invalid cards array")
    }

    // Add IDs and status to each card
    const cards = parsed.cards.map((card: any, index: number) => ({
      ...card,
      id: `card-${Date.now()}-${index}`,
      status: "new" as const
    }))

    return { cards }
  } catch (error) {
    console.error("Error parsing response:", error)
    throw new Error("Failed to parse AI response")
  }
}

// Helper function to generate personality descriptions
function generatePersonalityDescriptions(data: any): string {
  // Handle both onboarding and new entry data structures
  const personalData = data.personal || data.personal_data || {};
  const personalityItems = personalData.personalityItems || [];

  // Check if data and required properties exist
  if (!personalityItems.length) {
    console.log('No personality data available, using default values')
    return `
      Personality Traits:
      - Extraversion: Moderately extraverted, balancing sociability with alone time
      - Conscientiousness: Moderately organized, balancing structure with flexibility
      - Emotional Stability: Moderately emotionally stable with balanced emotional responses
      - Openness: Moderately open to new experiences while valuing some familiarity
    `
  }

  // Group items by trait
  const extraversion = personalityItems.filter((item: any) => item.id.startsWith("extraversion"))
  const conscientiousness = personalityItems.filter((item: any) => item.id.startsWith("conscientiousness"))
  const neuroticism = personalityItems.filter((item: any) => item.id.startsWith("neuroticism"))
  const openness = personalityItems.filter((item: any) => item.id.startsWith("openness"))

  // Calculate average scores, accounting for reverse coding
  const calculateAverage = (items: any[]) => {
    if (!items.length) return 4 // Default to moderate if no items
    return (
      items.reduce((sum, item) => {
        return sum + (item.isReverseCoded ? 8 - item.score : item.score)
      }, 0) / items.length
    )
  }

  const extraversionScore = calculateAverage(extraversion)
  const conscientiousnessScore = calculateAverage(conscientiousness)
  const neuroticismScore = calculateAverage(neuroticism)
  const opennessScore = calculateAverage(openness)

  // Generate descriptions
  return `
    Personality Traits:
    - Extraversion: ${getPersonalityDescription("extraversion", extraversionScore)}
    - Conscientiousness: ${getPersonalityDescription("conscientiousness", conscientiousnessScore)}
    - Emotional Stability: ${getPersonalityDescription("emotional-stability", 8 - neuroticismScore)}
    - Openness: ${getPersonalityDescription("openness", opennessScore)}
  `
}

// Helper function to generate value descriptions
function generateValueDescriptions(data: any): string {
  // Handle both onboarding and new entry data structures
  const personalData = data.personal || data.personal_data || {};
  const valueItems = personalData.valueItems || [];

  // Check if data and required properties exist
  if (!valueItems.length) {
    console.log('No value data available, using default values')
    return `
      Values:
      - Autonomy: Moderately important
      - Benevolence: Moderately important
      - Achievement: Moderately important
      - Security: Moderately important
      - Conformity: Moderately important
    `
  }

  // Map values to their descriptions
  const valueMap = new Map(valueItems.map((item: any) => [item.id, item.score]))

  // Generate descriptions
  return `
    Values:
    - Autonomy: ${getValueDescription("autonomy", (valueMap.get("autonomy") as number) || 4)}
    - Benevolence: ${getValueDescription("benevolence", (valueMap.get("benevolence") as number) || 4)}
    - Achievement: ${getValueDescription("achievement", (valueMap.get("achievement") as number) || 4)}
    - Security: ${getValueDescription("security", (valueMap.get("security") as number) || 4)}
    - Conformity: ${getValueDescription("conformity", (valueMap.get("conformity") as number) || 4)}
  `
}

// Helper function for personality descriptions
function getPersonalityDescription(trait: string, score: number): string {
  if (trait === "extraversion") {
    if (score >= 5.5) return "Highly extraverted, sociable, and outgoing"
    if (score >= 4) return "Moderately extraverted, balancing sociability with alone time"
    return "More introverted, preferring smaller social settings or solitude"
  }

  if (trait === "conscientiousness") {
    if (score >= 5.5) return "Highly organized, detail-oriented, and disciplined"
    if (score >= 4) return "Moderately organized, balancing structure with flexibility"
    return "More spontaneous and flexible, preferring less structure"
  }

  if (trait === "emotional-stability") {
    if (score >= 5.5) return "Very emotionally stable and calm under pressure"
    if (score >= 4) return "Moderately emotionally stable with balanced emotional responses"
    return "More emotionally sensitive and reactive to stressors"
  }

  if (trait === "openness") {
    if (score >= 5.5) return "Highly curious, imaginative, and open to new experiences"
    if (score >= 4) return "Moderately open to new experiences while valuing some familiarity"
    return "More conventional, preferring familiar routines and practical thinking"
  }

  return "No description available"
}

// Helper function for value descriptions
function getValueDescription(value: string, score: number): string {
  if (score >= 5.5) return "Very important"
  if (score >= 4) return "Moderately important"
  return "Less important"
} 