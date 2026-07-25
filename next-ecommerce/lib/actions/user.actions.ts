'use server'
import { signIn, signOut } from '@/auth'
import { IUserSignIn, IUserSignUp } from '@/types'
import { UserSignUpSchema } from '../validator'
import bcrypt from 'bcryptjs'
import { formatError, sanitizeInput, sanitizeEmail } from '../utils'
import { createUser } from '../db/users'

export async function signInWithCredentials(user: IUserSignIn) {
  return await signIn('credentials', { ...user, redirect: false })
}

export async function SignOut() {
  return await signOut()
}

export async function registerUser(UserSignUp: IUserSignUp) {
  try {
    const sanitizedData = {
      name: sanitizeInput(UserSignUp.name),
      email: sanitizeEmail(UserSignUp.email),
      password: UserSignUp.password,
      confirmPassword: UserSignUp.confirmPassword,
      role: UserSignUp.role === 'SELLER' ? 'SELLER' : 'BUYER',
    }

    const user = await UserSignUpSchema.parseAsync(sanitizedData)

    await createUser({
      name: user.name,
      email: user.email,
      passwordHash: await bcrypt.hash(user.password, 5),
      role: user.role,
      emailVerified: false,
    })

    return { success: true, message: 'User registered successfully' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
