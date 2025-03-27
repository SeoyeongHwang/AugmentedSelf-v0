"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import type { SelfAspectCard } from "@/types/onboarding"
import { supabase } from "@/lib/supabase"

type User = {
  id: string
  email: string
  name?: string
  onboardingCompleted: boolean
  cards?: SelfAspectCard[]
}

type AuthContextType = {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  setError: (error: string | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const initRef = useRef(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  useEffect(() => {
    console.log('AuthProvider: useEffect started')
    let mounted = true

    const initialize = async () => {
      console.log('AuthProvider: initialize started')
      
      if (initRef.current) {
        console.log('AuthProvider: already initialized')
        return
      }
      
      try {
        console.log('AuthProvider: checking Supabase session')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }

        console.log('AuthProvider: session check complete', session)
        
        if (mounted) {
          if (session?.user) {
            // Fetch user data from users table
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (userError) {
              console.error('Error fetching user data:', userError)
            }

            setUser({
              id: session.user.id,
              email: session.user.email || '',
              onboardingCompleted: userData?.onboarding_completed || false,
              cards: []
            })
          } else {
            setUser(null)
          }
          setLoading(false)
          setInitialized(true)
          initRef.current = true
          console.log('AuthProvider: initialization complete')
        }
      } catch (error) {
        console.error('AuthProvider: initialization error:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
          setInitialized(true)
          initRef.current = true
        }
      }
    }

    initialize().catch(error => {
      console.error('AuthProvider: unhandled initialization error:', error)
      if (mounted) {
        setUser(null)
        setLoading(false)
        setInitialized(true)
        initRef.current = true
      }
    })

    return () => {
      console.log('AuthProvider: cleanup')
      mounted = false
    }
  }, [])

  const login = async (email: string, password: string) => {
    console.log('AuthProvider: Login attempt for:', email)
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('AuthProvider: Login error:', error)
        if (error.message === "Invalid login credentials") {
          setError("등록되지 않은 이메일이거나 비밀번호가 일치하지 않습니다")
        } else if (error.message === "Email not confirmed") {
          setError("이메일 인증이 필요합니다. 이메일을 확인해주세요")
        } else {
          setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요")
        }
        return
      }
      
      console.log('AuthProvider: Login successful:', data)
      
      if (data.user) {
        // Fetch user data from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (userError) {
          console.error('Error fetching user data:', userError)
        }

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          onboardingCompleted: userData?.onboarding_completed || false,
          cards: []
        })
      }
    } catch (error: any) {
      console.error('AuthProvider: Login error:', error)
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요")
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    console.log('AuthProvider: Logout attempt')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      console.log('AuthProvider: Logout successful')
    } catch (error) {
      console.error('AuthProvider: Logout error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  console.log('AuthProvider: render', { user, loading, initialized, initRef: initRef.current })

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <AuthContext.Provider value={{ user, loading, error, login, logout, clearError, setError }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

