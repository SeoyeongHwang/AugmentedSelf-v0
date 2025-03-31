// 이 파일은 AI SDK를 사용하여 자기 측면을 생성하는 API 엔드포인트를 정의합니다.
// 클라이언트로부터 요청을 받아 OpenAI API를 호출하고,
// 생성된 자기 측면 카드를 JSON 형식으로 반환합니다.

import { type NextRequest, NextResponse } from "next/server"
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
    console.log("Starting generate-self-aspects-ai-sdk API call")
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

