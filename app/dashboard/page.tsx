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
import { ThumbsUp, ThumbsDown, NotebookPen, Upload, Shapes, LogOut, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import type { SelfAspectCard } from "@/types/onboarding"
import { supabase, type SelfAspectCardDB, checkSupabaseConnection } from "@/lib/supabase"
import { SelfAspectCardComponent } from "@/components/self-aspect-card"
import { useRouter } from "next/navigation"

// Mock new self-aspect cards data for content analysis
const mockNewCards: SelfAspectCard[] = [
  {
    id: "card-4",
    title: "Empathetic Listener",
    description:
      "You have a natural ability to understand others' emotions and perspectives. People often come to you for advice and support because you truly listen and care about their experiences.",
    traits: ["Agreeableness", "Low Neuroticism"],
    status: "new",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "card-5",
    title: "Practical Problem-Solver",
    description:
      "You excel at finding practical solutions to everyday challenges. You're resourceful and adaptable when facing obstacles, focusing on what works rather than getting caught up in theoretical possibilities.",
    traits: ["Conscientiousness", "Low Neuroticism"],
    status: "new",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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

  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      router.push('/onboarding')  // 온보딩이 완료되지 않았으면 온보딩 페이지로
    }
  }, [user, router])

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

        // 온보딩 데이터 로드
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding_data')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (onboardingError) {
          throw new Error(`Failed to fetch onboarding data: ${onboardingError.message}`)
        }

        // userData 설정 시 구조 맞추기
        setUserData({
          social: onboardingData.social_data,      // social_data를 social로 매핑
          personal: onboardingData.personal_data    // personal_data를 personal로 매핑
        })

        // 카드 로드
        const { data: cards, error: cardsError } = await supabase
          .from('self_aspect_cards')
          .select('*')
          .eq('user_id', user.id)

        if (cardsError) {
          throw new Error(`Failed to fetch cards: ${cardsError.message}`)
        }

        // 카드 상태별로 분류
        const collected = cards?.filter(card => card.status === 'collected') || []
        const rejected = cards?.filter(card => card.status === 'rejected') || []

        setCollectedCards(collected)
        setRejectedCards(rejected)

      } catch (error) {
        console.error('Error loading user data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load user data')
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
    if (!user?.id || !userData) {
      console.error("Missing user data:", { userId: user?.id, userData })
      return
    }

    try {
      setIsAnalyzing(true)
      setShowResults(false)
      
      const truncatedContent = newEntry.length > 3000 
        ? newEntry.substring(0, 3000) 
        : newEntry

      // userData에는 이미 social, personal 정보가 모두 들어있음
      console.log("Submitting entry with onboarding data:", userData)

      const response = await fetch("/api/analyze-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: truncatedContent,
          userData: {
            social: userData.social,      // 온보딩에서 저장한 social
            personal: userData.personal,  // 온보딩에서 저장한 personal
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Analysis response:", data);

      if (!data.cards || !Array.isArray(data.cards)) {
        throw new Error("Invalid response format from API");
      }

      // 새로운 카드에 ID와 상태 추가
      const cardsWithIds = data.cards.map((card: any) => ({
        ...card,
        id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: "new",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id
      }));

      setNewCards(cardsWithIds);
      setShowResults(true);
      
      // 분석 완료 후 Supabase에 카드 저장
      const { error: saveError } = await supabase
        .from('self_aspect_cards')
        .insert(cardsWithIds);

      if (saveError) {
        console.error("Error saving cards to database:", saveError);
      }

    } catch (error) {
      console.error("Error analyzing entry:", error);
      setError(error instanceof Error ? error.message : "Failed to analyze entry");
    } finally {
      setIsAnalyzing(false);
    }
  };

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
        setCollectedCards((prev) => [...prev, { ...card, status, updated_at: new Date().toISOString() }])
        setRejectedCards((prev) => prev.filter((c) => c.id !== card.id))
      } else {
        setRejectedCards((prev) => [...prev, { ...card, status, updated_at: new Date().toISOString() }])
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
                      <div className="grid grid-cols-[repeat(auto-fit,_minmax(338px,_1fr))] gap-4">
                        {newCards.map((card) => (
                          <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <SelfAspectCardComponent
                              card={card}
                              onCollect={() => handleCardReaction(card, "collected")}
                              onReject={() => handleCardReaction(card, "rejected")}
                            />
                          </motion.div>
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
                  <CardTitle>✒️ Create New Entry</CardTitle>
                  <CardDescription>Write a new personal entry or upload a document</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="entry">
                      Personal Entry
                    </Label>
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
                  {isAnalyzing ? (
                    <Button disabled>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </Button>
                  ) : file ? (
                    <Button onClick={handleUpload}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmitEntry} 
                      disabled={!newEntry.trim() || isAnalyzing}
                    >
                      <NotebookPen className="mr-2 h-4 w-4" />
                      Submit Entry
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="collected" className="space-y-16">
            <div className="space-y-8 mt-8">
              <h2 className="text-xl font-semibold">🧩 Collected Self-Aspects</h2>
              {collectedCards.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-3">
                  {collectedCards.map((card) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SelfAspectCardComponent
                        card={card}
                        onCollect={() => handleCardReaction(card, "collected")}
                        onReject={() => handleCardReaction(card, "rejected")}
                      />
                    </motion.div>
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

            <div className="space-y-8">
              <h2 className="text-xl font-semibold">🗑️ Rejected Self-Aspects</h2>
              {rejectedCards.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-3">
                  {rejectedCards.map((card) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SelfAspectCardComponent
                        card={card}
                        onCollect={() => handleCardReaction(card, "collected")}
                        onReject={() => handleCardReaction(card, "rejected")}
                      />
                    </motion.div>
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

