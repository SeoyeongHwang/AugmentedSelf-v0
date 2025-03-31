// 이 파일은 대시보드 페이지를 정의합니다.
// 사용자가 개인 항목을 작성하거나 문서를 업로드할 수 있는 UI를 제공합니다.

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ThumbsUp, ThumbsDown, Upload, PenLine, LogOut, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import type { SelfAspectCard } from "@/types/onboarding"
import { supabase, type SelfAspectCardDB, checkSupabaseConnection } from "@/lib/supabase"

// Mock new self-aspect cards data for content analysis
const mockNewCards: SelfAspectCard[] = [
  {
    id: "card-4",
    title: "Empathetic Listener",
    description:
      "You have a natural ability to understand others' emotions and perspectives. People often come to you for advice and support because you truly listen and care about their experiences.",
    traits: ["Agreeableness", "Low Neuroticism"],
    status: "new",
  },
  {
    id: "card-5",
    title: "Practical Problem-Solver",
    description:
      "You excel at finding practical solutions to everyday challenges. You're resourceful and adaptable when facing obstacles, focusing on what works rather than getting caught up in theoretical possibilities.",
    traits: ["Conscientiousness", "Low Neuroticism"],
    status: "new",
  },
]

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("write")
  const [newEntry, setNewEntry] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [newCards, setNewCards] = useState<SelfAspectCard[]>([])
  const [collectedCards, setCollectedCards] = useState<SelfAspectCard[]>([])
  const [rejectedCards, setRejectedCards] = useState<SelfAspectCard[]>([])
  const [userData, setUserData] = useState<any>(null)

  // Now it's safe to use the auth context
  const { user, logout } = useAuth()

  // Load cards and user data from Supabase on initial render
  useEffect(() => {
    async function loadUserData() {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        console.log('Loading user data for:', user.id)
        console.log('User ID type:', typeof user.id)
        console.log('Full user object:', user)

        // Check Supabase connection first
        const isConnected = await checkSupabaseConnection()
        if (!isConnected) {
          throw new Error('Unable to connect to the database. Please check your connection.')
        }

        // Fetch user's cards using UUID
        const { data: cards, error: cardsError } = await supabase
          .from('self_aspect_cards')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (cardsError) {
          console.error('Error fetching cards:', cardsError)
          throw new Error(`Failed to fetch cards: ${cardsError.message || 'Unknown error'}`)
        }

        console.log('Fetched cards:', cards?.length || 0)

        if (cards) {
          const collected = cards.filter((card: SelfAspectCardDB) => card.status === "collected")
          const rejected = cards.filter((card: SelfAspectCardDB) => card.status === "rejected")
          setCollectedCards(collected)
          setRejectedCards(rejected)
        }

        // Fetch user's onboarding data using UUID
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding_data')
          .select('*')
          .eq('user_id', user?.id)
          .single()

        if (onboardingError) {
          if (onboardingError.code === 'PGRST116') {
            console.log('No onboarding data found, creating new entry')
            const { data: newOnboardingData, error: createError } = await supabase
              .from('onboarding_data')
              .insert([
                {
                  user_id: user?.id,
                  social_data: {},
                  personal_data: {}
                }
              ])
              .select()
              .single()

            if (createError) {
              console.error('Error creating onboarding data:', createError)
              throw new Error(`Failed to create onboarding data: ${createError.message || 'Unknown error'}`)
            }

            setUserData(newOnboardingData)
          } else {
            console.error('Error fetching onboarding data:', onboardingError)
            throw new Error(`Failed to fetch onboarding data: ${onboardingError.message || 'Unknown error'}`)
          }
        } else if (onboardingData) {
          console.log('Fetched onboarding data')
          setUserData(onboardingData)
        }
      } catch (error: any) {
        console.error('Error loading user data:', error)
        setError(error.message || 'Failed to load user data. Please check your connection and try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [user])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmitEntry = async () => {
    if (!user?.id) return

    setIsAnalyzing(true)
    setShowResults(false)

    try {
      // Limit content length to 3000 characters
      const maxContentLength = 3000;
      const truncatedContent = newEntry.length > maxContentLength 
        ? newEntry.substring(0, maxContentLength)
        : newEntry;

      // Get user's onboarding data from Supabase
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('onboarding_data')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (onboardingError) {
        console.error("Error fetching onboarding data:", onboardingError)
        throw new Error("Failed to fetch user data")
      }

      // Call the analyze-content API
      const response = await fetch("/api/analyze-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: truncatedContent,
          userData: onboardingData
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API error response:", errorData)
        throw new Error(errorData.error || `Failed to analyze content: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("API response:", data)
      
      if (!data.cards || !Array.isArray(data.cards)) {
        console.error("Invalid response format:", data)
        throw new Error("Invalid response format from API")
      }

      // Save new cards to Supabase
      const cardsToInsert = data.cards.map((card: SelfAspectCard, index: number) => ({
        ...card,
        id: crypto.randomUUID(),
        user_id: user.id,
        status: "new",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      console.log("Attempting to insert cards:", cardsToInsert)

      const { data: insertedCards, error: insertError } = await supabase
        .from('self_aspect_cards')
        .insert(cardsToInsert)
        .select()

      if (insertError) {
        console.error("Error inserting cards:", insertError)
        console.error("Error details:", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        })
        throw new Error(`Failed to save cards: ${insertError.message || 'Unknown error'}`)
      }

      console.log("Successfully inserted cards:", insertedCards)
      setNewCards(cardsToInsert)
    } catch (error: any) {
      console.error("Error analyzing content:", error)
      setNewCards(mockNewCards)
    } finally {
      setIsAnalyzing(false)
      setShowResults(true)
      setNewEntry("")
    }
  }

  const handleUpload = async () => {
    setIsAnalyzing(true)
    setShowResults(false)

    try {
      if (!file) {
        throw new Error("No file selected")
      }

      // Check file type
      if (file.type === 'application/pdf') {
        throw new Error("PDF files are not supported yet. Please use text files (.txt) for now.")
      }

      // Read file content
      const content = await file.text()
      
      // Limit content length to 3000 characters
      const maxContentLength = 3000;
      const truncatedContent = content.length > maxContentLength 
        ? content.substring(0, maxContentLength)
        : content;

      // Get user data from Supabase
      const { data: userData, error: userDataError } = await supabase
        .from('onboarding_data')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (userDataError) throw userDataError

      // Call the analyze-content API
      const response = await fetch("/api/analyze-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: truncatedContent,
          userData: userData
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze content: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.cards || !Array.isArray(data.cards)) {
        throw new Error("Invalid response format from API")
      }

      // Save new cards to Supabase
      const cardsToInsert = data.cards.map((card: SelfAspectCard, index: number) => ({
        ...card,
        id: crypto.randomUUID(),
        user_id: user?.id || '',
        status: "new",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      console.log("Attempting to insert cards:", cardsToInsert)

      const { data: insertedCards, error: insertError } = await supabase
        .from('self_aspect_cards')
        .insert(cardsToInsert)
        .select()

      if (insertError) {
        console.error("Error inserting cards:", insertError)
        console.error("Error details:", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        })
        throw new Error(`Failed to save cards: ${insertError.message || 'Unknown error'}`)
      }

      console.log("Successfully inserted cards:", insertedCards)
      setNewCards(cardsToInsert)
    } catch (error: any) {
      console.error("Error analyzing content:", error)
      setNewCards(mockNewCards)
    } finally {
      setIsAnalyzing(false)
      setShowResults(true)
      setFile(null)
    }
  }

  const handleCardReaction = async (card: SelfAspectCard, status: "collected" | "rejected") => {
    if (!user?.id) return

    try {
      // Update the card status in Supabase using UUID
      const { error } = await supabase
        .from('self_aspect_cards')
        .upsert({
          id: card.id,
          user_id: user.id,
          title: card.title,
          description: card.description,
          traits: card.traits,
          status: status,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Update local state
      if (status === "collected") {
        setCollectedCards((prev) => [...prev, { ...card, status }])
        setRejectedCards((prev) => prev.filter((c) => c.id !== card.id))
      } else {
        setRejectedCards((prev) => [...prev, { ...card, status }])
        setCollectedCards((prev) => prev.filter((c) => c.id !== card.id))
      }

      // Remove from new cards if it's a new card
      if (newCards.some((c) => c.id === card.id)) {
        setNewCards((prev) => prev.filter((c) => c.id !== card.id))
      }
    } catch (error) {
      console.error('Error updating card:', error)
    }
  }

  const renderCard = (card: SelfAspectCard) => (
    <motion.div
      key={card.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>{card.title}</CardTitle>
          <div className="flex flex-wrap gap-1 mt-2">
            {card.traits.map((trait) => (
              <span
                key={trait}
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
              >
                {trait}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground">{card.description}</p>
        </CardContent>
        <CardFooter className="flex justify-end">
          {card.status === "collected" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCardReaction(card, "rejected")}
            >
              <ThumbsDown className="mr-2 h-4 w-4" />
              Reject
            </Button>
          ) : card.status === "rejected" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCardReaction(card, "collected")}
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              Collect
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCardReaction(card, "collected")}
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                Collect
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCardReaction(card, "rejected")}
                className="ml-2"
              >
                <ThumbsDown className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between">
          <h1 className="text-xl font-bold">Augmented Self</h1>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl py-6 space-y-6">
        <Tabs defaultValue="write" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="write">작성/업로드</TabsTrigger>
            <TabsTrigger value="collected">수집된 카드</TabsTrigger>
          </TabsList>

          <TabsContent value="write" className="space-y-6">
            {isAnalyzing ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <h3 className="text-xl font-semibold">Analyzing your content...</h3>
                  <p className="text-muted-foreground mt-2">We're identifying self-aspects based on your input.</p>
                </CardContent>
              </Card>
            ) : showResults ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                    <CardDescription>We've identified these new self-aspects based on your content.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {newCards.length > 0 ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        {newCards.map((card) => (
                          <div key={card.id}>
                            {renderCard(card)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-6 text-muted-foreground">
                        No new self-aspects were identified from this content.
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => setShowResults(false)} className="w-full">
                      Create New Entry
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Entry</CardTitle>
                  <CardDescription>Write a new personal entry or upload a document</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="entry">Personal Entry</Label>
                    <Textarea
                      id="entry"
                      placeholder="Write about your thoughts, experiences, or reflections..."
                      className="min-h-[200px]"
                      value={newEntry}
                      onChange={(e) => setNewEntry(e.target.value)}
                    />
                    {newEntry.length > 3000 && (
                      <p className="text-sm text-muted-foreground">
                        긴 글을 작성해 주셨네요! 분석을 위해 앞부분 3000자만 사용할게요.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">Or Upload a Document</Label>
                    <Input id="file" type="file" onChange={handleFileChange} accept=".txt" />
                    {file && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">선택된 파일: {file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          파일 내용이 길 경우 앞부분 3000자만 분석에 사용됩니다.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  {file ? (
                    <Button onClick={handleUpload}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  ) : (
                    <Button onClick={handleSubmitEntry} disabled={!newEntry.trim()}>
                      <PenLine className="mr-2 h-4 w-4" />
                      Submit Entry
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="collected" className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Collected Self-Aspects</h2>
              {collectedCards.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-3">
                  {collectedCards.map((card) => (
                    <div key={card.id}>
                      {renderCard(card)}
                    </div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">You haven't collected any self-aspects yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Rejected Self-Aspects</h2>
              {rejectedCards.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-3">
                  {rejectedCards.map((card) => (
                    <div key={card.id}>
                      {renderCard(card)}
                    </div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">You haven't rejected any self-aspects yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

