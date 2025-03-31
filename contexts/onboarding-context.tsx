// 이 파일은 온보딩 과정에서 사용되는 상태 관리 컨텍스트를 정의합니다.
// 사용자 입력을 관리하고, 자기 측면 생성을 위한 API 호출을 처리합니다.

"use client"
import type React from "react"

import { createContext, useContext, useState } from "react"
import { useRouter } from "next/navigation"
import type {
  OnboardingStep,
  SocialIdentity,
  PersonalIdentity,
  PersonalContext,
  SelfAspectCard,
  OnboardingData,
} from "@/types/onboarding"
import { db } from "@/lib/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

type OnboardingContextType = {
  currentStep: OnboardingStep
  data: OnboardingData
  generatedCards: SelfAspectCard[]
  isGenerating: boolean
  updateSocialIdentity: (data: Partial<SocialIdentity>) => void
  updatePersonalIdentity: (data: Partial<PersonalIdentity>) => void
  updatePersonalContext: (data: Partial<PersonalContext>) => void
  updatePersonalityItem: (id: string, score: number) => void
  updateValueItem: (id: string, score: number) => void
  nextStep: () => void
  prevStep: () => void
  generateSelfAspectCards: () => Promise<void>
  updateCardStatus: (id: string, status: "collected" | "rejected") => void
  completeOnboarding: () => void
}

const defaultSocialIdentity: SocialIdentity = {
  age: "",
  biologicalSex: "",
  genderIdentity: "",
  sexualOrientation: "",
  ethnicity: "",
  race: "",
  disabilities: {
    has: false,
    details: "",
  },
  nationality: "",
  dualNationality: {
    has: false,
    details: "",
  },
  residence: "",
  education: "",
  occupation: "",
  fieldOfStudy: "",
  jobTitle: "",
  perceivedIncome: "",
  subjectiveIncome: "",
  incomeSatisfaction: "",
  socialClass: "",
  livingArrangement: "",
  politicalAffiliation: "",
  religiousAffiliation: "",
}

const defaultPersonalityItems = [
  {
    id: "extraversion1",
    text: "I see myself as someone who is outgoing and sociable.",
    score: 4,
  },
  {
    id: "extraversion2",
    text: "I see myself as someone who is reserved and quiet.",
    score: 4,
    isReverseCoded: true,
  },
  {
    id: "conscientiousness1",
    text: "I see myself as someone who is dependable and self-disciplined.",
    score: 4,
  },
  {
    id: "conscientiousness2",
    text: "I see myself as someone who is disorganized.",
    score: 4,
    isReverseCoded: true,
  },
  {
    id: "neuroticism1",
    text: "I see myself as someone who is anxious and easily upset.",
    score: 4,
    isReverseCoded: true,
  },
  {
    id: "neuroticism2",
    text: "I see myself as someone who is calm and emotionally stable.",
    score: 4,
  },
  {
    id: "openness1",
    text: "I see myself as someone who is curious about many different things.",
    score: 4,
  },
  {
    id: "openness2",
    text: "I see myself as someone with a vivid imagination.",
    score: 4,
  },
]

const defaultValueItems = [
  {
    id: "autonomy",
    text: "How important is it for you to make your own decisions?",
    score: 4,
  },
  {
    id: "benevolence",
    text: "How important is it for you to help others and promote the welfare of your community?",
    score: 4,
  },
  {
    id: "achievement",
    text: "How important is achievement and success in your life?",
    score: 4,
  },
  {
    id: "security",
    text: "How important is security and stability in your life?",
    score: 4,
  },
  {
    id: "conformity",
    text: "How important is it for you to conform to social norms?",
    score: 4,
  },
]

const defaultData: OnboardingData = {
  social: defaultSocialIdentity,
  personal: {
    personalityItems: defaultPersonalityItems,
    valueItems: defaultValueItems,
  },
  context: {
    diary: "",
  },
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("social")
  const [data, setData] = useState<OnboardingData>(defaultData)
  const [generatedCards, setGeneratedCards] = useState<SelfAspectCard[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const updateSocialIdentity = (socialData: Partial<SocialIdentity>) => {
    setData((prev) => ({
      ...prev,
      social: {
        ...prev.social,
        ...socialData,
      },
    }))
  }

  const updatePersonalIdentity = (personalData: Partial<PersonalIdentity>) => {
    setData((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        ...personalData,
      },
    }))
  }

  const updatePersonalityItem = (id: string, score: number) => {
    setData((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        personalityItems: prev.personal.personalityItems.map((item) => (item.id === id ? { ...item, score } : item)),
      },
    }))
  }

  const updateValueItem = (id: string, score: number) => {
    setData((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        valueItems: prev.personal.valueItems.map((item) => (item.id === id ? { ...item, score } : item)),
      },
    }))
  }

  const updatePersonalContext = (contextData: Partial<PersonalContext>) => {
    setData((prev) => ({
      ...prev,
      context: {
        ...prev.context,
        ...contextData,
      },
    }))
  }

  const nextStep = () => {
    if (currentStep === "social") setCurrentStep("personality")
    else if (currentStep === "personality") setCurrentStep("values")
    else if (currentStep === "values") setCurrentStep("context")
    else if (currentStep === "context") {
      generateSelfAspectCards()
      setCurrentStep("results")
    }
  }

  const prevStep = () => {
    if (currentStep === "results") setCurrentStep("context")
    else if (currentStep === "context") setCurrentStep("values")
    else if (currentStep === "values") setCurrentStep("personality")
    else if (currentStep === "personality") setCurrentStep("social")
  }

  const generateSelfAspectCards = async () => {
    setIsGenerating(true)

    try {
      console.log("Calling generate-self-aspects API...")

      // Try the AI SDK route first
      try {
        const response = await fetch("/api/generate-self-aspects-ai-sdk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        console.log("AI SDK API response status:", response.status)

        if (response.ok) {
          const result = await response.json()
          if (result.cards) {
            console.log("AI SDK API returned cards:", result.cards.length)
            // Convert card IDs to UUIDs
            const cardsWithUUIDs = result.cards.map((card: SelfAspectCard) => ({
              ...card,
              id: crypto.randomUUID()
            }))
            setGeneratedCards(cardsWithUUIDs)
            setIsGenerating(false)
            return
          }
        }

        console.log("AI SDK API failed, falling back to mock API")
      } catch (error) {
        console.error("Error with AI SDK API:", error)
        console.log("Falling back to mock API")
      }

      // If AI SDK route fails, use the mock API
      const mockResponse = await fetch("/api/generate-self-aspects-mock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const mockResult = await mockResponse.json()

      if (mockResult.cards) {
        console.log("Mock API returned cards:", mockResult.cards.length)
        // Convert card IDs to UUIDs
        const cardsWithUUIDs = mockResult.cards.map((card: SelfAspectCard) => ({
          ...card,
          id: crypto.randomUUID()
        }))
        setGeneratedCards(cardsWithUUIDs)
      } else {
        throw new Error("Mock API failed to return cards")
      }
    } catch (error: any) {
      console.error("Error generating self-aspect cards:", error)

      // Fallback to hardcoded mock data in case all APIs fail
      const fallbackCards: SelfAspectCard[] = [
        {
          id: crypto.randomUUID(),
          title: "Analytical Thinker",
          description:
            "You approach problems methodically and enjoy finding logical solutions. You value understanding the details and underlying principles of situations before making decisions.",
          traits: ["Conscientiousness", "Openness"],
          status: "new",
        },
        {
          id: crypto.randomUUID(),
          title: "Empathetic Listener",
          description:
            "You have a natural ability to understand others' emotions and perspectives. People often come to you for advice because you truly listen and care about their experiences.",
          traits: ["Benevolence", "Emotional Stability"],
          status: "new",
        },
        {
          id: crypto.randomUUID(),
          title: "Independent Explorer",
          description:
            "You value your autonomy and enjoy discovering new ideas and experiences. You prefer setting your own path rather than following conventional expectations.",
          traits: ["Autonomy", "Openness"],
          status: "new",
        },
      ]

      setGeneratedCards(fallbackCards)
    } finally {
      setIsGenerating(false)
    }
  }

  const updateCardStatus = async (id: string, status: "collected" | "rejected") => {
    if (!user?.id) {
      console.error('No user ID available')
      return
    }

    setGeneratedCards((prev) => prev.map((card) => (card.id === id ? { ...card, status } : card)))

    try {
      // Find the card to update
      const cardToUpdate = generatedCards.find(card => card.id === id)
      if (!cardToUpdate) {
        console.error('Card not found:', id)
        return
      }

      console.log('Updating card in Supabase:', {
        id,
        user_id: user.id,
        status,
        title: cardToUpdate.title,
        description: cardToUpdate.description,
        traits: cardToUpdate.traits
      })

      // Update the card status in Supabase
      const { error } = await supabase
        .from('self_aspect_cards')
        .upsert({
          id,
          user_id: user.id,
          title: cardToUpdate.title,
          description: cardToUpdate.description,
          traits: cardToUpdate.traits,
          status,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Supabase error details:', error)
        throw new Error(`Failed to update card: ${error.message}`)
      }
    } catch (error) {
      console.error('Error updating card status:', error)
      throw error
    }
  }

  const completeOnboarding = async () => {
    if (!user?.id) {
      console.error('No user ID available')
      return
    }

    try {
      console.log('Completing onboarding for user:', user.id)

      // First, check if onboarding data exists
      const { data: existingData, error: fetchError } = await supabase
        .from('onboarding_data')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing onboarding data:', fetchError)
      }

      // Store onboarding data in Supabase
      const { error: onboardingError } = await supabase
        .from('onboarding_data')
        .upsert({
          id: existingData?.id,
          user_id: user.id,
          social_data: data.social,
          personal_data: data.personal,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (onboardingError) {
        console.error('Onboarding data error details:', onboardingError)
      }

      // Store cards in Supabase
      const cardsToInsert = generatedCards.map(card => ({
        ...card,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      console.log('Inserting cards:', cardsToInsert.length)

      const { error: cardsError } = await supabase
        .from('self_aspect_cards')
        .upsert(cardsToInsert)

      if (cardsError) {
        console.error('Cards error details:', cardsError)
      }

      // Update user's onboarding completion status
      const { error: updateError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })

      if (updateError) {
        console.error('Error updating user status:', updateError)
      }

      // Force a hard navigation to dashboard
      console.log('Navigating to dashboard...')
      window.location.href = '/dashboard'
    } catch (error) {
      console.error("Error completing onboarding:", error)
      // Force a hard navigation to dashboard even if there's an error
      console.log('Navigating to dashboard despite error...')
      window.location.href = '/dashboard'
    }
  }

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        data,
        generatedCards,
        isGenerating,
        updateSocialIdentity,
        updatePersonalIdentity,
        updatePersonalityItem,
        updateValueItem,
        updatePersonalContext,
        nextStep,
        prevStep,
        generateSelfAspectCards,
        updateCardStatus,
        completeOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}

