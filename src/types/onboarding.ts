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
  ethnicity?: string
  race?: string
  nationality?: string
  dualNationality: {
    has: boolean
    details: string
  }
  residence?: string
  disabilities: {
    has: boolean
    details: string
  }
  education?: string
  occupation?: string
  fieldOfStudy?: string
  jobTitle?: string
  perceivedIncome?: string
  subjectiveIncome?: string
  incomeSatisfaction?: string
  socialClass?: string
  livingArrangement?: string
  politicalAffiliation?: string
  religiousAffiliation?: string
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
  status?: 'new' | 'collected' | 'rejected'
  created_at?: string
  updated_at?: string
}

export type OnboardingStep = 'social' | 'personality' | 'values' | 'context' | 'results'

export type PersonalContextUpdate = Partial<Omit<PersonalContext, 'id'>>
