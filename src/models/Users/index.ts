import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  ensId: string;
  fullUserName: string;
  userName: string;
  walletAddress: string;
  email: string;
  role: string;
  status: string;
  password: string;
  profilePicture: object;
}

const userSchema: Schema<IUser> = new Schema(
  {
    ensId: { type: String },
    fullUserName: { type: String },
    userName: { type: String},
    walletAddress: { type: String,unique: true, required: true, dropDups: true },
    email: { type: String },
    role: { type: String },
    status: { type: String },
    profilePicture: { type: Object },
    password: { type: String },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
