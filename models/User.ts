import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences?: {
    favoriteDestinations?: string[];
    defaultTravelStyle?: string[];
    defaultBudgetTier?: string;
    foodPreferences?: string[];
  };
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
    photoURL: { type: String, default: '' },
    preferences: {
      favoriteDestinations: [{ type: String }],
      defaultTravelStyle: [{ type: String }],
      defaultBudgetTier: { type: String },
      foodPreferences: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
