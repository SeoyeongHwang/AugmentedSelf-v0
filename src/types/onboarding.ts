export interface OnboardingData {
  social: SocialIdentity
  personal: PersonalIdentity
  context: ContextData
}

export interface SocialIdentity {
  age?: string
  biologicalSex?: string
  genderIdentity?: string
  sexualOrientation?: string
  relationshipStatus?: string
  occupation?: string
  educationLevel?: string
  culturalBackground?: string
  religiousBeliefs?: string
  primaryLanguage?: string
  location?: string
}

export interface PersonalIdentity {
  personalityItems: PersonalityItem[]
  valueItems: ValueItem[]
}

export interface ContextData {
  contexts: PersonalContext[]
}

export interface PersonalContext {
  id: string
  type: 'text' | 'file'
  content: string
  fileUrl?: string | undefined
}

export interface PersonalityItem {
  id: string
  text: string
  score: number
  isReverseCoded?: boolean
}

export interface ValueItem {
  id: string
  text: string
  score: number
}

export interface SelfAspectCard {
  id: string
  title: string
  description: string
  traits: string[]
  status?: 'new' | 'accepted' | 'rejected'
  created_at?: string
  updated_at?: string
}

export type OnboardingStep = 'social' | 'personality' | 'values' | 'context' | 'results'

export type PersonalContextUpdate = Partial<{
  type: 'text' | 'file'
  content: string
  fileUrl: string | undefined
}>
