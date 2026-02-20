import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../contexts/AuthContext'
import { KeyRound, Mail, Lock, Shield, Loader2, Eye, EyeOff, Check, X } from 'lucide-react'

// Debug: 'login' | 'newPassword' | 'totpSetup' | 'totpRequired' | null (normal)
const DEBUG_PAGE: 'login' | 'newPassword' | 'totpSetup' | 'totpRequired' | null = null

export default function Login() {
  const { status: realStatus, error, totpSecretCode: realTotpSecretCode, login, submitNewPassword, submitTotpCode, confirmTotp } = useAuth()
  
  // Debug mode to preview different auth pages
  const debugStatusMap = {
    login: 'unauthenticated',
    newPassword: 'newPasswordRequired',
    totpSetup: 'totpSetup',
    totpRequired: 'totpRequired',
  } as const
  const status = DEBUG_PAGE ? debugStatusMap[DEBUG_PAGE] : realStatus
  const totpSecretCode = DEBUG_PAGE === 'totpSetup' ? 'JBSWY3DPEHPK3PXPEXAMPLEKEY' : realTotpSecretCode
  
  const [email, setEmail] = useState(DEBUG_PAGE ? 'test@example.com' : '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
            <form onSubmit={handleLogin} className="space-y-4 flex flex-col items-center">
              <div className="form-control w-full max-w-xs">
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
              <div className="form-control w-full max-w-xs">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <Lock className="w-4 h-4 opacity-70" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="grow text-left"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="btn btn-ghost btn-xs btn-circle">
                    {showPassword ? <EyeOff className="w-4 h-4 opacity-70" /> : <Eye className="w-4 h-4 opacity-70" />}
                  </button>
                </label>
              </div>
              <button type="submit" className="btn btn-primary w-full max-w-xs" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
              </button>
            </form>
          )}

          {status === 'newPasswordRequired' && (() => {
            const hasMinLength = newPassword.length >= 8
            const hasUpper = /[A-Z]/.test(newPassword)
            const hasLower = /[a-z]/.test(newPassword)
            const hasNumber = /[0-9]/.test(newPassword)
            const isValidPassword = hasMinLength && hasUpper && hasLower && hasNumber
            const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0

            return (
            <form onSubmit={handleNewPassword} className="space-y-4 flex flex-col items-center">
              <p className="text-base-content/70 text-center">
                Please set a new password to continue.
              </p>
              <div className="form-control w-full max-w-xs">
                <label className="label">
                  <span className="label-text">New Password</span>
                  {isValidPassword && <Check className="w-4 h-4 text-success" />}
                </label>
                <label className={`input input-bordered flex items-center gap-2 ${isValidPassword ? 'input-success' : newPassword.length > 0 ? 'input-error' : ''}`}>
                  <Lock className="w-4 h-4 opacity-70" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="grow"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="btn btn-ghost btn-xs btn-circle">
                    {showNewPassword ? <EyeOff className="w-4 h-4 opacity-70" /> : <Eye className="w-4 h-4 opacity-70" />}
                  </button>
                </label>
                <div className="text-xs mt-2 space-y-1">
                  <div className={`flex items-center gap-2 ${hasMinLength ? 'text-success' : 'text-error'}`}>
                    {hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasUpper && hasLower ? 'text-success' : 'text-error'}`}>
                    {hasUpper && hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Upper & lowercase letters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasNumber ? 'text-success' : 'text-error'}`}>
                    {hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>At least one number</span>
                  </div>
                </div>
              </div>
              <div className="form-control w-full max-w-xs">
                <label className="label">
                  <span className="label-text">Confirm Password</span>
                  {passwordsMatch && <Check className="w-4 h-4 text-success" />}
                </label>
                <label className={`input input-bordered flex items-center gap-2 ${passwordsMatch ? 'input-success' : confirmPassword.length > 0 ? 'input-error' : ''}`}>
                  <Lock className="w-4 h-4 opacity-70" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="grow"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="btn btn-ghost btn-xs btn-circle">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 opacity-70" /> : <Eye className="w-4 h-4 opacity-70" />}
                  </button>
                </label>
                {confirmPassword && newPassword !== confirmPassword && (
                  <label className="label">
                    <span className="label-text-alt text-error text-center w-full">Passwords do not match</span>
                  </label>
                )}
              </div>
              <button type="submit" className="btn btn-primary w-full max-w-xs" disabled={isSubmitting || !isValidPassword || !passwordsMatch}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set Password'}
              </button>
            </form>
          )})()}

          {status === 'totpSetup' && totpSecretCode && (
            <form onSubmit={handleTotp} className="space-y-6 flex flex-col items-center">
              <p className="text-base-content/70 text-center">
                Scan this QR code with your authenticator app:
              </p>
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG 
                  value={`otpauth://totp/Admin:${email}?secret=${totpSecretCode}&issuer=SamuelHendy`}
                  size={180}
                />
              </div>
              <div className="collapse collapse-arrow bg-base-200 w-full max-w-xs">
                <input type="checkbox" />
                <div className="collapse-title text-sm">Can't scan? Enter manually</div>
                <div className="collapse-content">
                  <code className="text-xs break-all">{totpSecretCode}</code>
                </div>
              </div>
              <div className="form-control items-center text-center">
                <span className="label-text mb-2">Verification Code</span>
                <label className="input input-bordered flex items-center gap-2 w-40">
                  <Shield className="w-4 h-4 opacity-70" />
                  <input
                    type="text"
                    placeholder="123456"
                    className="grow tracking-widest text-lg"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoFocus
                    maxLength={6}
                    pattern="\d{6}"
                  />
                </label>
              </div>
              <button type="submit" className="btn btn-primary w-full max-w-xs" disabled={isSubmitting || totpCode.length !== 6}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Complete Setup'}
              </button>
            </form>
          )}

          {status === 'totpRequired' && (
            <form onSubmit={handleTotp} className="space-y-6 flex flex-col items-center">
              <p className="text-base-content/70 text-center">
                Enter the code from your authenticator app.
              </p>
              <div className="form-control items-center text-center">
                <span className="label-text mb-2">Verification Code</span>
                <label className="input input-bordered flex items-center gap-2 w-40">
                  <Shield className="w-4 h-4 opacity-70" />
                  <input
                    type="text"
                    placeholder="123456"
                    className="grow tracking-widest text-lg"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoFocus
                    maxLength={6}
                    pattern="\d{6}"
                  />
                </label>
              </div>
              <button type="submit" className="btn btn-primary w-full max-w-xs" disabled={isSubmitting || totpCode.length !== 6}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
