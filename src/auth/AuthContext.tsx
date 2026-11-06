import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, refreshSession, setAccessToken, setSessionLostHandler } from '../api/client'
import type { AuthResponse, User } from '../api/types'

interface AuthState {
  status: 'loading' | 'signedIn' | 'signedOut'
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthState['status']>('loading')
  const [user, setUserState] = useState<User | null>(null)

  const signOutLocally = useCallback(() => {
    setAccessToken(null)
    setUserState(null)
    setStatus('signedOut')
    queryClient.clear()
  }, [queryClient])

  const accept = useCallback((response: AuthResponse) => {
    setAccessToken(response.accessToken)
    setUserState(response.user)
    setStatus('signedIn')
  }, [])

  useEffect(() => {
    setSessionLostHandler(signOutLocally)
    refreshSession<AuthResponse>().then(accept, signOutLocally)
    return () => setSessionLostHandler(null)
  }, [accept, signOutLocally])

  const value = useMemo<AuthState>(
    () => ({
      status,
      user,
      login: async (email, password) =>
        accept(await api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } })),
      register: async (email, password, displayName) =>
        accept(await api<AuthResponse>('/auth/register', { method: 'POST', body: { email, password, displayName } })),
      logout: async () => {
        try {
          await api<void>('/auth/logout', { method: 'POST' })
        } finally {
          signOutLocally()
        }
      },
      setUser: setUserState,
    }),
    [status, user, accept, signOutLocally],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

/** For screens behind the sign-in guard, where a user is guaranteed. */
export function useUser(): User {
  const { user } = useAuth()
  if (!user) throw new Error('useUser requires a signed-in user')
  return user
}
