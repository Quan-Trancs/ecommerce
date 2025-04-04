import { IUserInput } from '@/types'
import { Model, model, models, Schema } from 'mongoose'

export interface IUser extends Document, IUserInput {
  _id: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String },
    emailVerified: { type: Boolean, default: false },
    password: { type: String },
    role: { type: String, required: true, default: 'User' },
  },
  {
    timestamps: true,
  }
)

const User = (models.User as Model<IUser>) || model<IUser>('User', UserSchema)

export default User
