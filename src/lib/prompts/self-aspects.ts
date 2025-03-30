// 프롬프트 관련 상수와 타입을 중앙화된 위치에서 관리
export const SYSTEM_PROMPT = `You are an introspective identity analyst for this person.
Based on the provided diary entries, personal context, and values (S, P, C), derive key self-aspects that this person might use to understand or describe themselves.

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
      "title": "A short phrase that captures the self-aspect without any markdown or special characters",
      "description": "1-2 sentences explaining how this appears in the person's behavior, thinking, or emotional patterns",
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
    
    Values:
    ${formatValues(data.personal)}
  `

  if (type === 'onboarding') {
    return `
      Based on the following information about a person, generate exactly 3 self-aspect cards that capture their multidimensional self-concept.
      
      ${basePrompt}
      
      Personal Context (C):
      ${data.context?.diary || "No personal context provided"}
    `
  }

  return `
    Based on the following information and new journal entry, generate self-aspect cards that reflect new insights or developments in the user's self-concept.
    
    ${basePrompt}
    
    Journal Entry Content (C):
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
  return `
    Personality Traits:
    - Extraversion: ${getPersonalityDescription("extraversion", personal.extraversionScore || 4)}
    - Conscientiousness: ${getPersonalityDescription("conscientiousness", personal.conscientiousnessScore || 4)}
    - Emotional Stability: ${getPersonalityDescription("emotional-stability", personal.neuroticismScore ? 8 - personal.neuroticismScore : 4)}
    - Openness: ${getPersonalityDescription("openness", personal.opennessScore || 4)}
  `
}

function formatValues(personal: any) {
  return `
    - Autonomy: ${getValueDescription("autonomy", personal.autonomyScore || 4)}
    - Benevolence: ${getValueDescription("benevolence", personal.benevolenceScore || 4)}
    - Achievement: ${getValueDescription("achievement", personal.achievementScore || 4)}
    - Security: ${getValueDescription("security", personal.securityScore || 4)}
    - Conformity: ${getValueDescription("conformity", personal.conformityScore || 4)}
  `
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

// 나머지 포맷팅 함수들... 