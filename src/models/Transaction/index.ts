import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  txnId: string;
  orderId: string;
  eventId: string;
  userId: string;
  amount: number;
  address: string;
  fees: number;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema: Schema<ITransaction> = new Schema(
  {
    txnId: { type: String },
    orderId: { type: String },
    eventId: { type: String },
    userId: { type: String },
    amount: { type: Number },
    address: { type: String },
    fees: { type: Number },
  },

  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema
);

export default Transaction;
