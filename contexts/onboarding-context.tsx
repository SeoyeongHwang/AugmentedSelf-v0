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
  PersonalContextUpdate,
  ContextData,
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
  updatePersonalContext: (contextId: string, data: PersonalContextUpdate) => void
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
  relationshipStatus: "",
  occupation: "",
  educationLevel: "",
  culturalBackground: "",
  religiousBeliefs: "",
  primaryLanguage: "",
  location: "",
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
    contexts: [
      { id: '1', type: 'text', content: '' },
      { id: '2', type: 'text', content: '' },
      { id: '3', type: 'text', content: '' }
    ]
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

  const updatePersonalContext = (contextId: string, contextData: PersonalContextUpdate) => {
    setData((prev) => ({
      ...prev,
      context: {
        contexts: prev.context.contexts.map((context) =>
          context.id === contextId ? { ...context, ...contextData } : context
        ),
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
          const now = new Date().toISOString()
          setGeneratedCards(
            result.cards.map((card: any) => ({
              ...card,
              status: "new",
              created_at: now,
              updated_at: now
            }))
          )
        }
      } catch (error) {
        console.error("Error with AI SDK route:", error)
      }
    } catch (error) {
      console.error("Error generating self aspect cards:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const updateCardStatus = async (id: string, status: "collected" | "rejected") => {
    setGeneratedCards((prev) =>
      prev.map((card) =>
        card.id === id
          ? {
              ...card,
              status,
              updated_at: new Date().toISOString(),
            }
          : card
      )
    )
  }

  const completeOnboarding = async () => {
    if (!user?.id) return

    try {
      // Save to Firebase
      if (db) {
        const userRef = doc(db, "users", user.id)
        await setDoc(userRef, {
          onboarding: {
            completed: true,
            data,
            generatedCards,
            completedAt: new Date().toISOString(),
          },
        })
      }

      // Save to Supabase
      const { error } = await supabase.from("user_profiles").upsert({
        user_id: user.id,
        onboarding_completed: true,
        onboarding_data: data,
        generated_cards: generatedCards,
        completed_at: new Date().toISOString(),
      })

      if (error) throw error

      router.push("/dashboard")
    } catch (error) {
      console.error("Error completing onboarding:", error)
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
        updatePersonalContext,
        updatePersonalityItem,
        updateValueItem,
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

