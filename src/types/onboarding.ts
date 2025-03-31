export interface OnboardingData {
  social: {
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
  personal: {
    personalityItems: PersonalityItem[]
    valueItems: ValueItem[]
  }
  context?: {
    diary?: string
  }
}

export interface PersonalityItem {
  id: string
  score: number
  isReverseCoded?: boolean
}

export interface ValueItem {
  id: string
  score: number
}

export interface SelfAspectCard {
  id: string
  title: string
  description: string
  traits: string[]
  status?: 'new' | 'accepted' | 'rejected'
}
