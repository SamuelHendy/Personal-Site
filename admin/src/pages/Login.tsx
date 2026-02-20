import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { KeyRound, Mail, Lock, Shield, Loader2 } from 'lucide-react'

export default function Login() {
  const { status, error, totpSecretCode, login, submitNewPassword, submitTotpCode, confirmTotp } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await login(email, password)
    setIsSubmitting(false)
  }

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await submitNewPassword(newPassword)
    setIsSubmitting(false)
  }

  const handleTotp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    if (status === 'totpSetup') {
      await confirmTotp(totpCode)
    } else {
      await submitTotpCode(totpCode)
    }
    setIsSubmitting(false)
    setTotpCode('')
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Admin Login</h1>
          
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {status === 'unauthenticated' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <Mail className="w-4 h-4 opacity-70" />
                  <input
                    type="email"
                    placeholder="admin@example.com"
                    className="grow"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </label>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <Lock className="w-4 h-4 opacity-70" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="grow"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
              </button>
            </form>
          )}

          {status === 'newPasswordRequired' && (
            <form onSubmit={handleNewPassword} className="space-y-4">
              <p className="text-base-content/70 text-center">
                Please set a new password to continue.
              </p>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">New Password</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <Lock className="w-4 h-4 opacity-70" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="grow"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                    minLength={8}
                  />
                </label>
                <label className="label">
                  <span className="label-text-alt">Minimum 8 characters with uppercase, lowercase, and numbers</span>
                </label>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set Password'}
              </button>
            </form>
          )}

          {status === 'totpSetup' && totpSecretCode && (
            <form onSubmit={handleTotp} className="space-y-4">
              <p className="text-base-content/70 text-center">
                Scan this code with your authenticator app (e.g., Duo Mobile):
              </p>
              <div className="bg-base-200 p-4 rounded-lg text-center">
                <code className="text-sm break-all">{totpSecretCode}</code>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Verification Code</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <Shield className="w-4 h-4 opacity-70" />
                  <input
                    type="text"
                    placeholder="123456"
                    className="grow"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoFocus
                    maxLength={6}
                    pattern="\d{6}"
                  />
                </label>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting || totpCode.length !== 6}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Complete Setup'}
              </button>
            </form>
          )}

          {status === 'totpRequired' && (
            <form onSubmit={handleTotp} className="space-y-4">
              <p className="text-base-content/70 text-center">
                Enter the code from your authenticator app.
              </p>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Verification Code</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <Shield className="w-4 h-4 opacity-70" />
                  <input
                    type="text"
                    placeholder="123456"
                    className="grow"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoFocus
                    maxLength={6}
                    pattern="\d{6}"
                  />
                </label>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting || totpCode.length !== 6}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
