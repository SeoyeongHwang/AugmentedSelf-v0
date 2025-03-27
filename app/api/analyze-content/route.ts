import { type NextRequest, NextResponse } from "next/server"
import type { SelfAspectCard } from "@/types/onboarding"
import OpenAI from "openai"

export const runtime = "nodejs"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Mock data for fallback
const mockNewCards = {
  cards: [
    {
      title: "Personal Growth Journey",
      description: "Reflecting on personal development and self-discovery through daily experiences.",
      traits: ["Growth", "Self-awareness"]
    },
    {
      title: "Emotional Expression",
      description: "Exploring and expressing emotions through writing and reflection.",
      traits: ["Emotional intelligence", "Self-expression"]
    }
  ]
}

export async function POST(req: Request) {
  try {
    console.log("Starting analyze-content API call")
    const { content, userData } = await req.json()
    console.log("Received content length:", content?.length)
    console.log("User data:", JSON.stringify(userData, null, 2))

    if (!content) {
      console.error("No content provided")
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    // Generate personality and value descriptions from user data
    const personalityDescriptions = generatePersonalityDescriptions(userData)
    const valueDescriptions = generateValueDescriptions(userData)
    console.log("Generated descriptions:", {
      personality: personalityDescriptions,
      values: valueDescriptions
    })

    // Construct the prompt
    const prompt = constructPrompt(userData, content)
    console.log("Constructed prompt length:", prompt.length)

    console.log("Calling OpenAI API via AI SDK...")
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert psychologist specializing in self-concept analysis using the Augmented Self framework.
Your task is to analyze the user's social identity (S), personality traits (P), and journal entry content (C) to identify new self-aspects.
Return the analysis in a specific JSON format with cards containing title, description, and traits.

The response must be in this exact JSON format:
{
  "cards": [
    {
      "title": "A clear, concise title without any markdown or special characters",
      "description": "A detailed description in natural language (about 2-3 sentences)",
      "traits": ["Trait1", "Trait2", "Trait3"]
    }
  ]
}

Important:
1. Do not use any markdown formatting in the titles or descriptions
2. Keep titles concise and clear
3. Make descriptions natural and flowing
4. Include exactly 2-3 traits per card
5. Return ONLY the JSON object, no additional text`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    console.log("AI SDK response received")
    const aiResponse = response.choices[0].message.content || ""
    console.log("Raw AI response:", aiResponse)
    
    const parsedResponse = parseResponse(aiResponse)
    console.log("Parsed response:", JSON.stringify(parsedResponse, null, 2))

    return NextResponse.json(parsedResponse)
  } catch (error) {
    console.error("AI SDK error:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(mockNewCards)
  }
}

// Helper function to parse the response
function parseResponse(responseText: string) {
  try {
    // Remove markdown code block markers and find JSON content
    const jsonMatch = responseText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) || 
                     responseText.match(/({[\s\S]*})/)
    
    if (!jsonMatch) {
      console.error('No JSON content found in response')
      throw new Error('Invalid response format')
    }

    const jsonContent = jsonMatch[1].trim()
    console.log('Parsed JSON content:', jsonContent)
    
    // Try to parse the JSON content
    const response = JSON.parse(jsonContent)

    if (!response.cards || !Array.isArray(response.cards)) {
      console.error('Invalid response structure:', response)
      throw new Error('Invalid response format')
    }

    return {
      cards: response.cards.map((card: any, index: number) => ({
        id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: card.title?.trim() || 'Untitled Aspect',
        description: card.description?.trim() || 'No description available',
        traits: Array.isArray(card.traits) 
          ? card.traits.map((trait: string) => trait.trim())
          : ['Unknown'],
        status: "new" as const,
      }))
    }
  } catch (error) {
    console.error('Error parsing response:', error)
    console.error('Original response text:', responseText)
    return {
      cards: [
        {
          id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: "Error Processing Response",
          description: "The system encountered an error while processing the analysis results. Please try again.",
          traits: ["Error"],
          status: "new" as const,
        },
      ]
    }
  }
}

// Helper function to construct the prompt
function constructPrompt(data: any, content: string): string {
  // Handle both onboarding and new entry data structures
  const socialData = data.social || data.social_data || {};
  const personalData = data.personal || data.personal_data || {};

  // Get relevant social identity fields
  const relevantSocialData = {
    age: socialData.age || 30,
    occupation: socialData.occupation || 'Not specified',
    education: socialData.education || 'Not specified',
    location: socialData.location || 'Not specified',
    culturalBackground: socialData.culturalBackground || 'Not specified'
  };

  // Get personality and value descriptions
  const personalityDescriptions = generatePersonalityDescriptions(data);
  const valueDescriptions = generateValueDescriptions(data);

  return `
    Based on the following information about a person, generate self-aspect cards that capture their multidimensional self-concept.
    
    Social Identity (S):
    - Age: ${relevantSocialData.age}
    - Occupation: ${relevantSocialData.occupation}
    - Education: ${relevantSocialData.education}
    - Location: ${relevantSocialData.location}
    - Cultural Background: ${relevantSocialData.culturalBackground}

    Personality Traits (P):
    ${personalityDescriptions}

    Values:
    ${valueDescriptions}

    Journal Entry Content (C):
    ${content}

    Generate self-aspect cards that reflect new insights or developments in the user's self-concept based on their journal entry.
    Each self-aspect should be a unique combination of their social identity, personality traits, and the content of their journal entry.
    
    Return the analysis in the following JSON format:
    {
      "cards": [
        {
          "title": "A clear, concise title without any markdown or special characters",
          "description": "A detailed description in natural language (about 2-3 sentences)",
          "traits": ["Trait1", "Trait2", "Trait3"]
        }
      ]
    }
    
    Important:
    1. Do not use any markdown formatting in the titles or descriptions
    2. Keep titles concise and clear
    3. Make descriptions natural and flowing
    4. Include exactly 2-3 traits per card
    5. Return ONLY the JSON object, no additional text
  `;
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