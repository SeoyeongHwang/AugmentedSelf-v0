// 이 파일은 사회적 정체성과 개인적 정체성에 대한 TypeScript 인터페이스를 정의합니다.
// 온보딩 과정에서 사용되는 데이터 구조를 명확히 하기 위해 사용됩니다.
export interface PromptData {
  social: SocialIdentity
  personal: PersonalIdentity
  context?: {
    diary?: string
  }
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
  ethnicity?: string
  race?: string
  disabilities?: {
    has: boolean
    details?: string
  }
  nationality?: string
  dualNationality?: {
    has: boolean
    details?: string
  }
  residence?: string
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