import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { CognitoUserSession, CognitoUser } from 'amazon-cognito-identity-js'
import { getCurrentSession, signIn, signOut, completeNewPassword, verifyTotp, confirmTotpSetup } from '../lib/auth'

type AuthStatus = 
  | 'loading'
  | 'unauthenticated'
  | 'authenticated'
  | 'newPasswordRequired'
  | 'totpRequired'
  | 'totpSetup'

interface AuthContextType {
  status: AuthStatus
  session: CognitoUserSession | null
  error: string | null
  totpSecretCode: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  submitNewPassword: (newPassword: string) => Promise<void>
  submitTotpCode: (code: string) => Promise<void>
  confirmTotp: (code: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [session, setSession] = useState<CognitoUserSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingUser, setPendingUser] = useState<CognitoUser | null>(null)
  const [userAttributes, setUserAttributes] = useState<Record<string, string>>({})
  const [totpSecretCode, setTotpSecretCode] = useState<string | null>(null)

  useEffect(() => {
    getCurrentSession().then((sess) => {
      if (sess) {
        setSession(sess)
        setStatus('authenticated')
      } else {
        setStatus('unauthenticated')
      }
    })
  }, [])

  const login = async (email: string, password: string) => {
    setError(null)
    const result = await signIn(email, password)

    switch (result.status) {
      case 'success':
        setSession(result.session)
        setStatus('authenticated')
        break
      case 'newPasswordRequired':
        setPendingUser(result.user)
        setUserAttributes(result.userAttributes)
        setStatus('newPasswordRequired')
        break
      case 'totpRequired':
        setPendingUser(result.user)
        setStatus('totpRequired')
        break
      case 'totpSetup':
        setPendingUser(result.user)
        setTotpSecretCode(result.secretCode)
        setStatus('totpSetup')
        break
      case 'error':
        setError(result.message)
        break
    }
  }

  const submitNewPassword = async (newPassword: string) => {
    if (!pendingUser) return
    setError(null)

    const result = await completeNewPassword(pendingUser, newPassword, userAttributes)

    switch (result.status) {
      case 'success':
        setSession(result.session)
        setStatus('authenticated')
        setPendingUser(null)
        break
      case 'totpRequired':
        setPendingUser(result.user)
        setStatus('totpRequired')
        break
      case 'totpSetup':
        setPendingUser(result.user)
        setTotpSecretCode(result.secretCode)
        setStatus('totpSetup')
        break
      case 'error':
        setError(result.message)
        break
    }
  }

  const submitTotpCode = async (code: string) => {
    if (!pendingUser) return
    setError(null)

    const result = await verifyTotp(pendingUser, code)

    if (result.status === 'success') {
      setSession(result.session)
      setStatus('authenticated')
      setPendingUser(null)
    } else {
      setError(result.message)
    }
  }

  const confirmTotp = async (code: string) => {
    if (!pendingUser) return
    setError(null)

    const result = await confirmTotpSetup(pendingUser, code)

    if (result.status === 'success') {
      setSession(result.session)
      setStatus('authenticated')
      setPendingUser(null)
      setTotpSecretCode(null)
    } else {
      setError(result.message)
    }
  }

  const logout = () => {
    signOut()
    setSession(null)
    setStatus('unauthenticated')
    setPendingUser(null)
    setError(null)
  }

  return (
    <AuthContext.Provider
      value={{
        status,
        session,
        error,
        totpSecretCode,
        login,
        logout,
        submitNewPassword,
        submitTotpCode,
        confirmTotp,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
