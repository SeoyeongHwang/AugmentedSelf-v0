export type OnboardingStep = "social" | "personality" | "values" | "context" | "results"

export type SocialIdentity = {
  age: string
  biologicalSex: string
  genderIdentity: string
  sexualOrientation: string
  ethnicity: string
  race: string
  disabilities: {
    has: boolean
    details: string
  }
  nationality: string
  dualNationality: {
    has: boolean
    details: string
  }
  residence: string
  education: string
  occupation: string
  fieldOfStudy: string
  jobTitle: string
  perceivedIncome: string
  subjectiveIncome: string
  incomeSatisfaction: string
  socialClass: string
  livingArrangement: string
  politicalAffiliation: string
  religiousAffiliation: string
}

export type PersonalityItem = {
  id: string
  text: string
  score: number
  isReverseCoded?: boolean
}

export type ValueItem = {
  id: string
  text: string
  score: number
}

export type PersonalIdentity = {
  personalityItems: PersonalityItem[]
  valueItems: ValueItem[]
}

export type PersonalContext = {
  diary: string
}

export type SelfAspectCard = {
  id: string
  title: string
  description: string
  traits: string[]
  status: "new" | "collected" | "rejected"
}

export type OnboardingData = {
  social: SocialIdentity
  personal: PersonalIdentity
  context: PersonalContext
}

