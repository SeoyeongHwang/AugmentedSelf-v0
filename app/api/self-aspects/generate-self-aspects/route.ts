// 이 파일은 자기 측면 생성을 위한 API 엔드포인트를 정의합니다.
// 클라이언트로부터 요청을 받아 OpenAI API를 호출하고,
// 생성된 자기 측면 카드를 JSON 형식으로 반환합니다.
import { type NextRequest, NextResponse } from "next/server"
import type { OnboardingData, SelfAspectCard, PersonalityItem, ValueItem } from "@/types/onboarding"
import OpenAI from "openai"
import { SYSTEM_PROMPT, constructSelfAspectPrompt } from '@/src/lib/prompts/self-aspects'
import { AI_MODELS, MODEL_CONFIGS } from '@/src/lib/constants/ai-models'

// Mark this file as a server component
export const runtime = "nodejs" // This ensures it runs on the server

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log("Starting generate-self-aspects API call")
    const { data } = await request.json()
    console.log("Received data:", JSON.stringify(data, null, 2))

    if (!data) {
      console.error("No data provided")
      return NextResponse.json(
        { error: "Data is required" },
        { status: 400 }
      )
    }

    // Construct the prompt
    const prompt = constructSelfAspectPrompt(data, 'onboarding')
    console.log("Constructed prompt length:", prompt.length)

    // Get model configuration
    const model = AI_MODELS.DEFAULT.SELF_ASPECTS
    const config = MODEL_CONFIGS[model]

    console.log("Calling OpenAI API...")
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens
    })

    console.log("OpenAI API response received")
    const aiResponse = response.choices[0].message.content || ""
    console.log("Raw AI response:", aiResponse)
    
    const parsedResponse = parseResponse(aiResponse)
    console.log("Parsed response:", JSON.stringify(parsedResponse, null, 2))

    return NextResponse.json(parsedResponse)
  } catch (error) {
    console.error("OpenAI API error:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { error: "Failed to generate self-aspects" },
      { status: 500 }
    )
  }
}

// Function to parse the GPT response into card objects
function parseGPTResponse(responseText: string): SelfAspectCard[] {
  try {
    console.log("Parsing GPT response")

    // Try to parse as JSON first (if you've instructed GPT to return JSON)
    try {
      const now = new Date().toISOString()
      const jsonResponse = JSON.parse(responseText)
      if (Array.isArray(jsonResponse)) {
        return jsonResponse.map((card, index) => ({
          id: `card-${index + 1}`,
          title: card.title || "Untitled Self-Aspect",
          description: card.description || "",
          traits: card.traits || [],
          status: "new",
          created_at: now,
          updated_at: now,
        }))
      }
    } catch (e) {
      console.log("Response is not valid JSON, trying text parsing")
    }

    // Text parsing fallback
    // Split by numbered sections (1., 2., 3.)
    const sections = responseText.split(/\d+\.\s+/).filter(Boolean)
    const now = new Date().toISOString()

    return sections.map((section, index) => {
      // Extract title (assuming it's the first line)
      const lines = section.trim().split("\n")
      const title = lines[0].replace(/^[^a-zA-Z0-9]+/, "").trim()

      // Extract description (assuming it's the bulk of the text)
      const descriptionLines = lines
        .slice(1)
        .filter((line) => !line.toLowerCase().includes("traits:") && !line.toLowerCase().includes("key traits:"))
      const description = descriptionLines.join(" ").trim()

      // Extract traits
      const traitsLine = lines.find(
        (line) => line.toLowerCase().includes("traits:") || line.toLowerCase().includes("key traits:"),
      )

      let traits: string[] = []
      if (traitsLine) {
        const traitsText = traitsLine.split(":")[1]
        traits = traitsText.split(",").map((trait) => trait.trim())
      }

      return {
        id: `card-${index + 1}`,
        title,
        description,
        traits,
        status: "new",
        created_at: now,
        updated_at: now
      }
    })
  } catch (error) {
    console.error("Error parsing GPT response:", error)
    const now = new Date().toISOString()
    // Return a fallback card if parsing fails
    return [
      {
        id: "card-1",
        title: "Self-Aspect",
        description: "The system was unable to parse the response properly. Please try again.",
        traits: ["Error"],
        status: "new",
        created_at: now,
        updated_at: now,
      },
    ]
  }
}

// The rest of your existing functions remain the same
function generatePersonalityDescriptions(items: PersonalityItem[]) {
  // Group items by trait
  const extraversion = items.filter((item) => item.id.startsWith("extraversion"))
  const conscientiousness = items.filter((item) => item.id.startsWith("conscientiousness"))
  const neuroticism = items.filter((item) => item.id.startsWith("neuroticism"))
  const openness = items.filter((item) => item.id.startsWith("openness"))

  // Calculate average scores, accounting for reverse coding
  const calculateAverage = (items: PersonalityItem[]) => {
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
  return {
    expert: {
      extraversion: getExpertExtraversionDescription(extraversionScore),
      conscientiousness: getExpertConscientiousnessDescription(conscientiousnessScore),
      neuroticism: getExpertNeuroticismDescription(neuroticismScore),
      openness: getExpertOpennessDescription(opennessScore),
    },
    everyday: {
      extraversion: getEverydayExtraversionDescription(extraversionScore),
      conscientiousness: getEverydayConscientiousnessDescription(conscientiousnessScore),
      neuroticism: getEverydayNeuroticismDescription(neuroticismScore),
      openness: getEverydayOpennessDescription(opennessScore),
    },
  }
}

function generateValueDescriptions(items: ValueItem[]) {
  // Map values to their descriptions
  const valueMap = new Map(items.map((item) => [item.id, item.score]))

  // Generate descriptions
  return {
    expert: {
      autonomy: getExpertValueDescription("autonomy", valueMap.get("autonomy") || 4),
      benevolence: getExpertValueDescription("benevolence", valueMap.get("benevolence") || 4),
      achievement: getExpertValueDescription("achievement", valueMap.get("achievement") || 4),
      security: getExpertValueDescription("security", valueMap.get("security") || 4),
      conformity: getExpertValueDescription("conformity", valueMap.get("conformity") || 4),
    },
    everyday: {
      autonomy: getEverydayValueDescription("autonomy", valueMap.get("autonomy") || 4),
      benevolence: getEverydayValueDescription("benevolence", valueMap.get("benevolence") || 4),
      achievement: getEverydayValueDescription("achievement", valueMap.get("achievement") || 4),
      security: getEverydayValueDescription("security", valueMap.get("security") || 4),
      conformity: getEverydayValueDescription("conformity", valueMap.get("conformity") || 4),
    },
  }
}

// Expert descriptions for personality traits
function getExpertExtraversionDescription(score: number) {
  if (score >= 5.5)
    return "Exhibits high extraversion, characterized by pronounced sociability, assertiveness, and positive emotionality. Demonstrates a strong preference for social interaction and external stimulation."
  if (score >= 4)
    return "Demonstrates moderate extraversion, balancing sociability with occasional need for solitude. Shows situational assertiveness and generally positive emotional expression."
  return "Displays introversion tendencies, characterized by preference for solitude, reflective thought, and reserved emotional expression. Social engagement is more selective and deliberate."
}

function getExpertConscientiousnessDescription(score: number) {
  if (score >= 5.5)
    return "Exhibits high conscientiousness, characterized by strong self-discipline, organization, and goal-directed behavior. Demonstrates meticulous attention to detail and reliability in task completion."
  if (score >= 4)
    return "Shows moderate conscientiousness, balancing organization with flexibility. Demonstrates adequate self-discipline while maintaining adaptability to changing circumstances."
  return "Displays lower conscientiousness, characterized by spontaneity, flexibility, and a less structured approach to tasks. May prioritize adaptability and creativity over systematic planning."
}

function getExpertNeuroticismDescription(score: number) {
  if (score >= 5.5)
    return "Exhibits elevated neuroticism, characterized by heightened emotional reactivity and sensitivity to stressors. May experience more frequent or intense negative emotions and require more time to return to baseline after emotional arousal."
  if (score >= 4)
    return "Demonstrates moderate emotional stability, with balanced emotional responses to stressors. Generally recovers from negative emotional states within a reasonable timeframe."
  return "Displays notable emotional stability, characterized by resilience to stressors and consistent emotional regulation. Tends to maintain composure under pressure and returns quickly to baseline after emotional arousal."
}

function getExpertOpennessDescription(score: number) {
  if (score >= 5.5)
    return "Exhibits high openness to experience, characterized by intellectual curiosity, aesthetic sensitivity, and preference for novelty and variety. Demonstrates creative thinking and willingness to explore unconventional ideas."
  if (score >= 4)
    return "Shows moderate openness to experience, balancing curiosity with pragmatism. Appreciates both familiar and novel experiences, with selective exploration of new ideas."
  return "Displays conventional tendencies, characterized by preference for familiarity, practicality, and established methods. May prioritize concrete thinking and traditional approaches over abstract or experimental ones."
}

// Everyday descriptions for personality traits
function getEverydayExtraversionDescription(score: number) {
  if (score >= 5.5)
    return "You're outgoing and sociable, enjoying the company of others and seeking out social situations. You're energized by being around people and tend to be talkative and assertive in groups."
  if (score >= 4)
    return "You balance sociability with alone time, enjoying social gatherings but also valuing your personal space. You can be outgoing in comfortable situations while still appreciating quiet moments."
  return "You prefer smaller, more intimate social settings or spending time alone. You're more reserved in groups and find your energy is drained by extensive social interaction. You value deeper connections with fewer people."
}

function getEverydayConscientiousnessDescription(score: number) {
  if (score >= 5.5)
    return "You're highly organized and detail-oriented, preferring to plan ahead and follow schedules. You're reliable, disciplined, and take your responsibilities seriously."
  if (score >= 4)
    return "You balance organization with flexibility, planning when necessary but also adapting when plans change. You're generally reliable while maintaining some spontaneity."
  return "You prefer to go with the flow rather than stick to rigid plans. You value flexibility and spontaneity, and may find too much structure limiting or constraining."
}

function getEverydayNeuroticismDescription(score: number) {
  if (score >= 5.5)
    return "You tend to experience emotions intensely and may worry or feel anxious more often than others. You're sensitive to stress and may need more time to recover from emotional situations."
  if (score >= 4)
    return "You experience a normal range of emotions, sometimes feeling stressed or worried but generally bouncing back relatively quickly. You're neither overly sensitive nor unusually calm."
  return "You're emotionally stable and calm under pressure. You rarely get upset or anxious, and when you do, you recover quickly. Stress doesn't typically affect you for long periods."
}

function getEverydayOpennessDescription(score: number) {
  if (score >= 5.5)
    return "You're curious and imaginative, enjoying new ideas, experiences, and creative pursuits. You're interested in abstract concepts and tend to think outside the box."
  if (score >= 4)
    return "You appreciate both new experiences and familiar routines. You're somewhat curious about new ideas while still valuing practical, proven approaches."
  return "You prefer familiar routines and practical, concrete thinking. You value tradition and conventional approaches, focusing on what's worked in the past rather than experimenting with new ideas."
}

// Expert descriptions for values
function getExpertValueDescription(value: string, score: number) {
  if (value === "autonomy") {
    if (score >= 5.5)
      return "Demonstrates high valuation of self-direction and autonomy, prioritizing independent thought and action. Shows strong internal locus of control and resistance to external constraints on personal choice."
    if (score >= 4)
      return "Moderately values autonomy, balancing self-direction with consideration of external guidance. Appreciates independence while recognizing the utility of established frameworks."
    return "Places lower emphasis on autonomy, potentially prioritizing collective harmony or established structures over individual self-direction. May prefer guidance or shared decision-making to independent action."
  }

  if (value === "benevolence") {
    if (score >= 5.5)
      return "Exhibits strong prosocial orientation and altruistic tendencies. Prioritizes others' welfare and demonstrates commitment to community values and interpersonal harmony."
    if (score >= 4)
      return "Shows moderate benevolence, balancing concern for others with personal needs. Demonstrates situational altruism and general consideration for community welfare."
    return "Places lower emphasis on broad social welfare concerns, potentially prioritizing immediate circle or individual considerations over wider community needs."
  }

  if (value === "achievement") {
    if (score >= 5.5)
      return "Highly values personal success and demonstration of competence according to social standards. Motivated by achievement recognition and goal attainment."
    if (score >= 4)
      return "Moderately values achievement, balancing success orientation with other life priorities. Appreciates recognition while not being primarily driven by external validation."
    return "Places lower emphasis on conventional achievement markers, potentially prioritizing other values such as relationships, stability, or personal fulfillment over socially recognized success."
  }

  if (value === "security") {
    if (score >= 5.5)
      return "Strongly prioritizes safety, harmony, and stability in both personal life and broader social context. Demonstrates risk-aversion and preference for predictable environments."
    if (score >= 4)
      return "Moderately values security, balancing safety needs with openness to change. Appreciates stability while maintaining adaptability to new circumstances."
    return "Places lower emphasis on security and stability, potentially prioritizing novelty, change, or growth opportunities over predictable environments."
  }

  if (value === "conformity") {
    if (score >= 5.5)
      return "Highly values adherence to social norms, expectations, and established rules. Prioritizes smooth social functioning and avoidance of actions that might disrupt collective harmony."
    if (score >= 4)
      return "Moderately values conformity, balancing respect for social norms with personal expression. Considers established rules while maintaining some independence of thought."
    return "Places lower emphasis on conformity to social expectations, potentially prioritizing personal authenticity or innovation over adherence to established norms."
  }

  return "No description available."
}

// Everyday descriptions for values
function getEverydayValueDescription(value: string, score: number) {
  if (value === "autonomy") {
    if (score >= 5.5)
      return "Making your own decisions is very important to you. You strongly prefer to choose your own path rather than having others decide for you."
    if (score >= 4)
      return "You value making your own decisions, but you're also open to guidance from others. You appreciate independence while recognizing when others' input is helpful."
    return "You're comfortable letting others take the lead in decision-making. You may prefer shared responsibility or following established guidelines rather than having to make all choices yourself."
  }

  if (value === "benevolence") {
    if (score >= 5.5)
      return "Helping others and contributing to your community is very important to you. You find fulfillment in supporting people and making a positive difference."
    if (score >= 4)
      return "You care about helping others while also balancing your own needs. You're generally considerate of others' welfare without sacrificing your own priorities."
    return "You tend to focus more on your immediate concerns than broader community issues. You may help others selectively rather than making it a central priority."
  }

  if (value === "achievement") {
    if (score >= 5.5)
      return "Success and accomplishment are very important to you. You're driven to achieve your goals and gain recognition for your competence and abilities."
    if (score >= 4)
      return "You appreciate success and recognition while balancing these with other priorities in life. Achievement matters to you but isn't your only measure of fulfillment."
    return "Traditional markers of success and achievement aren't your main priorities. You may value other aspects of life more, such as relationships, experiences, or personal satisfaction."
  }

  if (value === "security") {
    if (score >= 5.5)
      return "Safety and stability are very important to you. You prefer predictable situations and take steps to ensure security in your life and surroundings."
    if (score >= 4)
      return "You value security while still being open to some change and new experiences. You appreciate stability but can adapt when necessary."
    return "You're comfortable with uncertainty and changing situations. You may even prefer variety and new experiences over predictable routines and environments."
  }

  if (value === "conformity") {
    if (score >= 5.5)
      return "Following social norms and meeting expectations is very important to you. You value fitting in and maintaining harmony by adhering to established rules."
    if (score >= 4)
      return "You respect social norms while maintaining some personal independence. You consider established rules but also value your own perspective."
    return "You place less emphasis on following conventional expectations. You prefer to do what feels right to you personally, even if it goes against typical social norms."
  }

  return "No description available."
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

    // Add IDs, status, and timestamps to each card
    const now = new Date().toISOString()
    const cards = parsed.cards.map((card: any, index: number) => ({
      ...card,
      id: `card-${Date.now()}-${index}`,
      status: "new" as const,
      created_at: now,
      updated_at: now
    }))

    return { cards }
  } catch (error) {
    console.error("Error parsing response:", error)
    throw new Error("Failed to parse AI response")
  }
}

