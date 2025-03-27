import { type NextRequest, NextResponse } from "next/server"
import type { OnboardingData, SelfAspectCard } from "@/types/onboarding"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Mark this file as a server component
export const runtime = "nodejs" // This ensures it runs on the server

export async function POST(request: NextRequest) {
  try {
    console.log("Starting generate-self-aspects-ai-sdk API call")

    // Parse the request body
    const data: OnboardingData = await request.json()

    // Generate personality and value descriptions
    const personalityDescriptions = generatePersonalityDescriptions(data)
    const valueDescriptions = generateValueDescriptions(data)

    // Construct the prompt
    const prompt = constructPrompt(data, personalityDescriptions, valueDescriptions)

    try {
      // Use the AI SDK to generate text
      console.log("Calling OpenAI API via AI SDK...")
      const result = await generateText({
        model: openai("gpt-3.5-turbo"),
        prompt,
        system:
          "You are an expert psychologist specializing in self-concept analysis using the Augmented Self framework.",
        temperature: 0.7,
        maxTokens: 1000,
      })

      console.log("AI SDK response received")

      // Parse the response
      const cards = parseResponse(result.text)
      console.log("Generated cards:", cards.length)

      return NextResponse.json({ cards })
    } catch (aiError: any) {
      console.error("AI SDK error:", aiError)
      return NextResponse.json(
        {
          error: "AI SDK error",
          message: aiError.message || "Unknown AI error",
        },
        { status: 502 },
      )
    }
  } catch (error: any) {
    console.error("Error in generate-self-aspects-ai-sdk API route:", error)
    return NextResponse.json(
      {
        error: "Failed to generate self-aspects",
        message: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Function to parse the response into card objects
function parseResponse(responseText: string): SelfAspectCard[] {
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

    return response.cards.map((card: any, index: number) => ({
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: card.title?.trim() || 'Untitled Aspect',
      description: card.description?.trim() || 'No description available',
      traits: Array.isArray(card.traits) 
        ? card.traits.map((trait: string) => trait.trim())
        : ['Unknown'],
      status: "new" as const,
    }))
  } catch (error) {
    console.error('Error parsing response:', error)
    console.error('Original response text:', responseText)
    return [
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

// Helper function to construct the prompt
function constructPrompt(data: OnboardingData, personalityDescriptions: any, valueDescriptions: any) {
  return `
    Based on the following information about a person, generate exactly 3 self-aspect cards that capture their multidimensional self-concept.
    
    Social Identity (S):
    - Age: ${data.social.age || "Not specified"}
    - Biological Sex: ${data.social.biologicalSex || "Not specified"}
    - Gender Identity: ${data.social.genderIdentity || "Not specified"}
    - Sexual Orientation: ${data.social.sexualOrientation || "Not specified"}
    - Ethnicity: ${data.social.ethnicity || "Not specified"}
    - Race: ${data.social.race || "Not specified"}
    - Disabilities: ${data.social.disabilities.has ? data.social.disabilities.details : "None"}
    - Nationality: ${data.social.nationality || "Not specified"}
    - Dual Nationality: ${data.social.dualNationality.has ? data.social.dualNationality.details : "None"}
    - Residence: ${data.social.residence || "Not specified"}
    - Education: ${data.social.education || "Not specified"}
    - Occupation: ${data.social.occupation || "Not specified"}
    - Field of Study: ${data.social.fieldOfStudy || "Not specified"}
    - Job Title: ${data.social.jobTitle || "Not specified"}
    - Perceived Income: ${data.social.perceivedIncome || "Not specified"}
    - Subjective Income: ${data.social.subjectiveIncome || "Not specified"}
    - Income Satisfaction: ${data.social.incomeSatisfaction || "Not specified"}
    - Social Class: ${data.social.socialClass || "Not specified"}
    - Living Arrangement: ${data.social.livingArrangement || "Not specified"}
    - Political Affiliation: ${data.social.politicalAffiliation || "Not specified"}
    - Religious Affiliation: ${data.social.religiousAffiliation || "Not specified"}
    
    Personal Identity (P):
    ${personalityDescriptions}
    
    Values:
    ${valueDescriptions}
    
    Personal Context (C):
    ${data.context.diary || "No personal context provided"}
    
    Generate exactly 3 self-aspect cards. Return the response in the following JSON format:
    {
      "cards": [
        {
          "title": "A clear, concise title without any markdown or special characters",
          "description": "A detailed description in natural language (about 2-3 sentences)",
          "traits": ["Trait1", "Trait2", "Trait3"]
        },
        {
          "title": "Another clear title",
          "description": "Another detailed description",
          "traits": ["Trait1", "Trait2", "Trait3"]
        },
        {
          "title": "A third clear title",
          "description": "A third detailed description",
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
  `
}

// Helper function to generate personality descriptions
function generatePersonalityDescriptions(data: OnboardingData): string {
  // Group items by trait
  const extraversion = data.personal.personalityItems.filter((item) => item.id.startsWith("extraversion"))
  const conscientiousness = data.personal.personalityItems.filter((item) => item.id.startsWith("conscientiousness"))
  const neuroticism = data.personal.personalityItems.filter((item) => item.id.startsWith("neuroticism"))
  const openness = data.personal.personalityItems.filter((item) => item.id.startsWith("openness"))

  // Calculate average scores, accounting for reverse coding
  const calculateAverage = (items: any[]) => {
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
function generateValueDescriptions(data: OnboardingData): string {
  // Map values to their descriptions
  const valueMap = new Map(data.personal.valueItems.map((item) => [item.id, item.score]))

  // Generate descriptions
  return `
    Values:
    - Autonomy: ${getValueDescription("autonomy", valueMap.get("autonomy") || 4)}
    - Benevolence: ${getValueDescription("benevolence", valueMap.get("benevolence") || 4)}
    - Achievement: ${getValueDescription("achievement", valueMap.get("achievement") || 4)}
    - Security: ${getValueDescription("security", valueMap.get("security") || 4)}
    - Conformity: ${getValueDescription("conformity", valueMap.get("conformity") || 4)}
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
  if (value === "autonomy") {
    if (score >= 5.5) return "Strongly values independence and making own decisions"
    if (score >= 4) return "Moderately values autonomy while accepting guidance when helpful"
    return "Less emphasis on autonomy, comfortable with shared decision-making"
  }

  if (value === "benevolence") {
    if (score >= 5.5) return "Strongly values helping others and community welfare"
    if (score >= 4) return "Moderately values helping others while balancing personal needs"
    return "More selective about helping others, focusing on immediate concerns"
  }

  if (value === "achievement") {
    if (score >= 5.5) return "Strongly driven by success and accomplishment"
    if (score >= 4) return "Moderately values achievement alongside other priorities"
    return "Less focused on conventional success markers"
  }

  if (value === "security") {
    if (score >= 5.5) return "Strongly values safety, stability, and predictability"
    if (score >= 4) return "Moderately values security while accepting some change"
    return "Comfortable with uncertainty and changing situations"
  }

  if (value === "conformity") {
    if (score >= 5.5) return "Strongly values following social norms and expectations"
    if (score >= 4) return "Respects social norms while maintaining some independence"
    return "Less concerned with conventional expectations"
  }

  return "No description available"
}

