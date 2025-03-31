import type { PersonalityItem, ValueItem } from './types'

// 이 파일은 자기 측면 생성에 필요한 프롬프트 관련 상수와 헬퍼 함수를 정의합니다.
// OpenAI API에 전달할 시스템 프롬프트와 사회적 정체성을 포맷하는 함수를 포함합니다.
export const SYSTEM_PROMPT = `You are an introspective identity analyst for this person.
Based on the provided social identity (S), personal identity (P), and personal context (C), derive key self-aspects that this person might use to understand or describe themselves.

Each self-aspect should reflect a meaningful part of the person's identity, such as:
- Core values or traits (e.g., "Driven by growth", "Values solitude")
- Life orientations (e.g., "Seeks harmony over competition")
- Identity anchors (e.g., "Feels most alive when creating")

Rules:
1. Do not copy input phrases. Interpret them.
2. Capture both clarity and complexity—self-aspects can have contradiction.
3. Avoid generic labels like "introvert" unless they are elaborated meaningfully.

The response must be in this exact JSON format:
{
  "cards": [
    {
      "title": "A noun phrase that starts with 1-2 trait adjectives and ends with a role that captures this person's self-aspect",
      "description": "1-2 sentences explaining how this appears in the person's behavior, thinking, or emotional patterns",
      "traits": ["Trait1", "Trait2", ..., "TraitN"]
    }
  ]
}

Important:
1. Do not use any markdown formatting in the titles or descriptions
2. Keep titles concise and clear
3. Make descriptions natural and flowing
4. Include exactly 1-3 traits per card
5. Return ONLY the JSON object, no additional text`

export function constructSelfAspectPrompt(
  data: any,
  type: 'onboarding' | 'journal',
  content?: string
) {
  const basePrompt = `
    Social Identity (S):
    ${formatSocialIdentity(data.social)}
    
    Personal Identity (P):
    ${formatPersonalIdentity(data.personal)}
    
    Personal Context (C):
    ${formatValues(data.personal)}
  `

  if (type === 'onboarding') {
    return `
      Based on the following information about a person, generate exactly 3 self-aspect cards that capture their multidimensional self-concept.
      
      ${basePrompt}
      
      Personal Context (C):
      ${formatPersonalContexts(data.context)}
    `
  }

  return `
    Based on the following information and new journal entry, generate exactly 3 self-aspect cards that reflect new insights or developments in the user's self-concept.
    
    ${basePrompt}
    
    Personal Context (C):
    ${content}
  `
}

// 헬퍼 함수들...
function formatSocialIdentity(social: any) {
  return `
    - Age: ${social.age || "Not specified"}
    - Biological Sex: ${social.biologicalSex || "Not specified"}
    - Gender Identity: ${social.genderIdentity || "Not specified"}
    - Sexual Orientation: ${social.sexualOrientation || "Not specified"}
    - Relationship Status: ${social.relationshipStatus || "Not specified"}
    - Occupation: ${social.occupation || "Not specified"}
    - Education Level: ${social.educationLevel || "Not specified"}
    - Cultural Background: ${social.culturalBackground || "Not specified"}
    - Religious/Spiritual Beliefs: ${social.religiousBeliefs || "Not specified"}
    - Primary Language: ${social.primaryLanguage || "Not specified"}
    - Geographic Location: ${social.location || "Not specified"}
  `
}

function formatPersonalIdentity(personal: any) {
  const personalityItems = personal.personalityItems || []
  
  // Calculate average scores for each trait
  const extraversionItems = personalityItems.filter((item: any) => item.id.startsWith('extraversion'))
  const conscientiousnessItems = personalityItems.filter((item: any) => item.id.startsWith('conscientiousness'))
  const neuroticismItems = personalityItems.filter((item: any) => item.id.startsWith('neuroticism'))
  const opennessItems = personalityItems.filter((item: any) => item.id.startsWith('openness'))

  const calculateAverage = (items: any[]) => {
    if (items.length === 0) return 4
    const sum = items.reduce((acc, item) => {
      const score = item.isReverseCoded ? 8 - item.score : item.score
      return acc + score
    }, 0)
    return sum / items.length
  }

  return `
    Personality Traits:
    - Extraversion: ${getPersonalityDescription("extraversion", calculateAverage(extraversionItems))}
    - Conscientiousness: ${getPersonalityDescription("conscientiousness", calculateAverage(conscientiousnessItems))}
    - Emotional Stability: ${getPersonalityDescription("emotional-stability", calculateAverage(neuroticismItems))}
    - Openness: ${getPersonalityDescription("openness", calculateAverage(opennessItems))}
  `
}

function formatValues(personal: any) {
  const valueItems = personal.valueItems || []
  
  return valueItems.map((item: any) => {
    const description = getValueDescription(item.id, item.score)
    return `- ${item.id.charAt(0).toUpperCase() + item.id.slice(1)}: ${description}`
  }).join('\n')
}

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

function getValueDescription(value: string, score: number): string {
  if (score >= 5.5) return "Very important"
  if (score >= 4) return "Moderately important"
  return "Less important"
}

function formatPersonalContexts(context: any) {
  if (!context?.contexts || !Array.isArray(context.contexts)) {
    return "No personal contexts provided"
  }

  return context.contexts.map((ctx: any, index: number) => {
    if (ctx.type === 'text') {
      return `Context ${index + 1} (Text):\n${ctx.content || "No content provided"}`
    } else {
      return `Context ${index + 1} (File):\nFile uploaded: ${ctx.fileUrl || "No file provided"}`
    }
  }).join('\n\n')
}

// 나머지 포맷팅 함수들... 