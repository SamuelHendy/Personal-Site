import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from 'amazon-cognito-identity-js'

const poolData = {
  UserPoolId: 'eu-west-2_xCtIVWk5n',
  ClientId: 'gthoep4qi9hoe27o1vam0b46k',
}

const userPool = new CognitoUserPool(poolData)

export type AuthState = 
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; session: CognitoUserSession }
  | { status: 'newPasswordRequired'; user: CognitoUser; userAttributes: Record<string, string> }
  | { status: 'totpRequired'; user: CognitoUser }
  | { status: 'totpSetup'; user: CognitoUser; secretCode: string }

export function getCurrentSession(): Promise<CognitoUserSession | null> {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser()
    if (!user) {
      resolve(null)
      return
    }

    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) {
        resolve(null)
        return
      }
      resolve(session)
    })
  })
}

export function signIn(
  email: string,
  password: string
): Promise<
  | { status: 'success'; session: CognitoUserSession }
  | { status: 'newPasswordRequired'; user: CognitoUser; userAttributes: Record<string, string> }
  | { status: 'totpRequired'; user: CognitoUser }
  | { status: 'totpSetup'; user: CognitoUser; secretCode: string }
  | { status: 'error'; message: string }
> {
  return new Promise((resolve) => {
    const user = new CognitoUser({
      Username: email,
      Pool: userPool,
    })

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    })

    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        resolve({ status: 'success', session })
      },
      onFailure: (err) => {
        resolve({ status: 'error', message: err.message || 'Authentication failed' })
      },
      newPasswordRequired: (userAttributes) => {
        delete userAttributes.email_verified
        delete userAttributes.email
        resolve({ status: 'newPasswordRequired', user, userAttributes })
      },
      totpRequired: () => {
        resolve({ status: 'totpRequired', user })
      },
      mfaSetup: () => {
        user.associateSoftwareToken({
          associateSecretCode: (secretCode) => {
            resolve({ status: 'totpSetup', user, secretCode })
          },
          onFailure: (err) => {
            resolve({ status: 'error', message: err.message || 'MFA setup failed' })
          },
        })
      },
    })
  })
}

export function completeNewPassword(
  user: CognitoUser,
  newPassword: string,
  userAttributes: Record<string, string>
): Promise<
  | { status: 'success'; session: CognitoUserSession }
  | { status: 'totpRequired'; user: CognitoUser }
  | { status: 'totpSetup'; user: CognitoUser; secretCode: string }
  | { status: 'error'; message: string }
> {
  return new Promise((resolve) => {
    user.completeNewPasswordChallenge(newPassword, userAttributes, {
      onSuccess: (session) => {
        resolve({ status: 'success', session })
      },
      onFailure: (err) => {
        resolve({ status: 'error', message: err.message || 'Password change failed' })
      },
      totpRequired: () => {
        resolve({ status: 'totpRequired', user })
      },
      mfaSetup: () => {
        user.associateSoftwareToken({
          associateSecretCode: (secretCode) => {
            resolve({ status: 'totpSetup', user, secretCode })
          },
          onFailure: (err) => {
            resolve({ status: 'error', message: err.message || 'MFA setup failed' })
          },
        })
      },
    })
  })
}

export function verifyTotp(
  user: CognitoUser,
  code: string
): Promise<
  | { status: 'success'; session: CognitoUserSession }
  | { status: 'error'; message: string }
> {
  return new Promise((resolve) => {
    user.sendMFACode(code, {
      onSuccess: (session) => {
        resolve({ status: 'success', session })
      },
      onFailure: (err) => {
        resolve({ status: 'error', message: err.message || 'Invalid code' })
      },
    }, 'SOFTWARE_TOKEN_MFA')
  })
}

export function confirmTotpSetup(
  user: CognitoUser,
  code: string
): Promise<
  | { status: 'success'; session: CognitoUserSession }
  | { status: 'error'; message: string }
> {
  return new Promise((resolve) => {
    user.verifySoftwareToken(code, 'TOTP', {
      onSuccess: (session) => {
        resolve({ status: 'success', session })
      },
      onFailure: (err) => {
        resolve({ status: 'error', message: err.message || 'TOTP verification failed' })
      },
    })
  })
}

export function signOut(): void {
  const user = userPool.getCurrentUser()
  if (user) {
    user.signOut()
  }
}

export function getIdToken(): string | null {
  const user = userPool.getCurrentUser()
  if (!user) return null

  let token: string | null = null
  user.getSession((err: Error | null, session: CognitoUserSession | null) => {
    if (!err && session && session.isValid()) {
      token = session.getIdToken().getJwtToken()
    }
  })
  return token
}
