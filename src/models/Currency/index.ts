import mongoose, { Document, Schema } from "mongoose";

export interface ICurrency extends Document {
  name: string;
  precision: number;
  symbol:string;
  iconUrl: string;
  explorerTxnIdUrl: string;
  price: number;
  positions: number;
  explorerAddressUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const currencySchema: Schema<ICurrency> = new Schema(
  {
    name: { type: String },
    precision: { type: Number },
    symbol:{type: String},
    iconUrl: { type: String },
    explorerTxnIdUrl: { type: String },
    price: { type: Number },
    positions: { type: Number },
    explorerAddressUrl: { type: String },
  },

  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

const Currency = mongoose.model<ICurrency>("Currency", currencySchema);

export default Currency;
