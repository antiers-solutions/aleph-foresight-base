import mongoose, { Document, Schema } from "mongoose";

export interface IDispute extends Document {
  userId: string;
  eventId: string;
  category: string;
  email: string;
  status: string;
  description: string;
  evidenceUrl: string[];
}

const disputeSchema: Schema<IDispute> = new Schema(
  {
    userId: { type: String },
    eventId: { type: String },
    category: { type: String },
    email: { type: String },
    status:{type: String},
    description: { type: String },
    evidenceUrl: { type: [String] },
  },

  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

const Dispute = mongoose.model<IDispute>("Dispute", disputeSchema);

export default Dispute;
