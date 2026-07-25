'use server'
import { signIn, signOut } from '@/auth'
import { IUserSignIn, IUserSignUp } from '@/types'
import { redirect } from 'next/navigation'
import { UserSignUpSchema } from '../validator'
import { connectToDatabase } from '../db'
import User from '../db/models/user.model'
import bcrypt from 'bcryptjs'
import { formatError, sanitizeInput, sanitizeEmail } from '../utils'

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

    await connectToDatabase()
    await User.create({
      name: user.name,
      email: user.email,
      password: await bcrypt.hash(user.password, 5),
      role: user.role,
      emailVerified: false,
    })

    return { success: true, message: 'User registered successfully' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
