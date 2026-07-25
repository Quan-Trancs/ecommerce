import { loadEnvConfig } from '@next/env'
import { cwd } from 'process'
import data from '@/lib/data'
import { connectToDatabase } from '.'
import User from './models/user.model'

loadEnvConfig(cwd())

const main = async () => {
  try {
    const { users } = data
    await connectToDatabase(process.env.MONGODB_URI)

    await User.deleteMany()
    const createdUsers = await User.insertMany(users)

    console.log({
      createdUsers,
      message: 'Seeded users successfully (catalog is seeded by store-backend)',
    })
    process.exit(0)
  } catch (error) {
    console.log(error)
    throw new Error('Failed to seed database')
  }
}

main()
