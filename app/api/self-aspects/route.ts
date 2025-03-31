// 이 파일은 자기 측면을 생성하는 API 엔드포인트를 정의합니다.
// 클라이언트로부터 요청을 받아 OpenAI API를 호출하고,
// 생성된 자기 측면 카드를 JSON 형식으로 반환합니다.
import { type NextRequest, NextResponse } from "next/server"
import { getOpenAIClient } from "@/src/lib/openai"
import { SYSTEM_PROMPT, constructSelfAspectPrompt } from "@/src/lib/prompts"
import { mockCards } from "./mock"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { content, data, mock = false } = await req.json()

    // Mock 모드 처리
    if (mock) {
      return NextResponse.json({ cards: mockCards })
    }

    const prompt = constructSelfAspectPrompt(
      data, 
      content ? 'journal' : 'onboarding',
      content
    )

    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    return NextResponse.json({
      cards: parseResponse(completion.choices[0].message.content || "")
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to generate self-aspects" },
      { status: 500 }
    )
  }
}

function parseResponse(responseText: string) {
  try {
    const jsonMatch = responseText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) || 
                     responseText.match(/({[\s\S]*})/)
    
    if (!jsonMatch) {
      throw new Error('Invalid response format')
    }

    const jsonContent = jsonMatch[1].trim()
    const response = JSON.parse(jsonContent)

    if (!response.cards || !Array.isArray(response.cards)) {
      throw new Error('Invalid response structure')
    }

    return response.cards.map((card: any) => ({
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: card.title?.trim() || 'Untitled Aspect',
      description: card.description?.trim() || 'No description available',
      traits: Array.isArray(card.traits) ? card.traits.map((t: string) => t.trim()) : ['Unknown'],
      status: "new" as const
    }))
  } catch (error) {
    console.error('Error parsing response:', error)
    return []
  }
} 