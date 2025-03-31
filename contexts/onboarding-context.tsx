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
} from "../src/types/onboarding"
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
  completeOnboarding: () => Promise<boolean>
}

const defaultSocialIdentity: SocialIdentity = {
  age: "",
  biologicalSex: "",
  genderIdentity: "",
  sexualOrientation: "",
  ethnicity: "",
  race: "",
  nationality: "",
  dualNationality: {
    has: false,
    details: ""
  },
  residence: "",
  disabilities: {
    has: false,
    details: ""
  },
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
  religiousAffiliation: ""
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
  const [data, setData] = useState<OnboardingData>(() => ({
    social: {
      ...defaultSocialIdentity,
      disabilities: {  // 명시적으로 disabilities 객체 초기화
        has: false,
        details: ""
      }
    },
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
    }
  }))
  const [generatedCards, setGeneratedCards] = useState<SelfAspectCard[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()
  const { user, updateOnboardingStatus } = useAuth()

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

      const response = await fetch("/api/self-aspects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      })

      console.log("API response status:", response.status)

      if (response.ok) {
        const result = await response.json()
        const now = new Date().toISOString()
        setGeneratedCards(
          result.cards.map((card: any) => ({
            ...card,
            id: card.id,
            status: "new",
            created_at: now,
            updated_at: now
          }))
        )
      } else {
        throw new Error(`API returned status: ${response.status}`)
      }
    } catch (error) {
      console.error("Error generating self aspect cards:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const updateCardStatus = async (id: string, status: "collected" | "rejected") => {
    console.log(`Updating card ${id} status to ${status}`)
    setGeneratedCards((prev) => {
      const updated = prev.map((card) =>
        card.id === id
          ? {
              ...card,
              status,
              updated_at: new Date().toISOString(),
            }
          : card
      )
      console.log("Updated cards:", updated.map(card => ({
        id: card.id,
        status: card.status
      })))
      return updated
    })
  }

  const completeOnboarding = async () => {
    console.log("completeOnboarding started")
    try {
      if (!user) {
        console.log("No user found")
        throw new Error("No user found")
      }

      // 수집된 카드와 거절된 카드 모두 필터링
      const cardsToSave = generatedCards.filter(card => 
        card.status === "collected" || card.status === "rejected"
      )
      console.log("Cards to save:", cardsToSave.length)
      
      if (cardsToSave.length === 0) {
        throw new Error("No cards processed")
      }

      // 컨텍스트 데이터 저장
      const { error: contextsError } = await supabase
        .from('personal_contexts')
        .insert(
          data.context.contexts.map(context => ({
            user_id: user.id,
            content: context.content,
            type: context.type,
            source: 'onboarding'
          }))
        )

      if (contextsError) {
        console.error("Error saving contexts:", contextsError)
        throw new Error(`Failed to save contexts: ${contextsError.message}`)
      }

      // 모든 카드 저장 (collected와 rejected 모두)
      const { error: cardsError } = await supabase
        .from('self_aspect_cards')
        .insert(
          cardsToSave.map(card => ({
            user_id: user.id,
            title: card.title,
            description: card.description,
            traits: card.traits,
            status: card.status,
            created_at: card.created_at,
            updated_at: card.updated_at
          }))
        )

      if (cardsError) {
        console.error("Error saving cards:", cardsError)
        throw new Error(`Failed to save cards: ${cardsError.message}`)
      }

      // 기존 onboarding 데이터 확인
      const { data: existingData, error: checkError } = await supabase
        .from('onboarding_data')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing data:", checkError)
        throw new Error(`Failed to check existing data: ${checkError.message}`)
      }

      // onboarding_data 업데이트 또는 생성
      const { error: onboardingError } = existingData
        ? await supabase
            .from('onboarding_data')
            .update({ 
              social_data: data.social,
              personal_data: data.personal,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
        : await supabase
            .from('onboarding_data')
            .insert([{ 
              user_id: user.id,
              social_data: data.social,
              personal_data: data.personal,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])

      if (onboardingError) {
        console.error("Error saving onboarding data:", onboardingError)
        throw new Error(`Failed to save onboarding data: ${onboardingError.message}`)
      }

      // Supabase에 온보딩 완료 상태 업데이트
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (userError) {
        console.error("Error updating user:", userError)
        throw new Error(`Failed to update user status: ${userError.message}`)
      }

      // auth context의 user 상태 업데이트
      await updateOnboardingStatus(true)
      
      console.log("All operations completed successfully")
      return true // 성공 여부를 반환
    } catch (error) {
      console.error("Error in completeOnboarding:", error)
      throw error
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

