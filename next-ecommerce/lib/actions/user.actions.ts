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
    // Sanitize user input before validation
    const sanitizedData = {
      name: sanitizeInput(UserSignUp.name),
      email: sanitizeEmail(UserSignUp.email),
      password: UserSignUp.password, // Don't sanitize password
      confirmPassword: UserSignUp.confirmPassword, // Don't sanitize password
    }

    const user = await UserSignUpSchema.parseAsync(sanitizedData)

    await connectToDatabase()
    await User.create({
      ...user,
      password: await bcrypt.hash(user.password, 5),
    })

    return { success: true, message: 'User registered successfully' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
