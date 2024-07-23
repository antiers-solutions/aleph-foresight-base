import mongoose, { Document, Schema } from 'mongoose';

export interface IEvents extends Document {
   eventId: string;
   txnId: string;
   userId: string;
   currencyType: string;
   priceLevel: number;
   targetDateTime: string;
   bettingClosureTime: string;
   eventDuration: string;
   description: string;
   platformFees: number;
   minimumBetFees: number;
   maximumBetFees: number;
   resolutionSource: string;
   resolver: string;
   status: number;
   createdAt: Date;
   updatedAt: Date;
   eventExpireTime: string;
   betExpireTime: string;
   eventResultTime: string;
   disputeCloserTime: string;
   reward: number;
   settlement: string;
}

const eventsSchema: Schema<IEvents> = new Schema(
   {
      eventId: { type: String },
      txnId: { type: String, unique: true },
      userId: { type: String },
      currencyType: { type: String },
      priceLevel: { type: Number },
      targetDateTime: { type: String },
      bettingClosureTime: { type: String },
      eventDuration: { type: String },
      description: { type: String },
      platformFees: { type: Number },
      minimumBetFees: { type: Number },
      maximumBetFees: { type: Number },
      resolutionSource: { type: String },
      resolver: { type: String },
      status: { type: Number },
      eventExpireTime: { type: String },
      betExpireTime: { type: String },
      eventResultTime: { type: String },
      disputeCloserTime: { type: String },
      reward: { type: Number, default: 0 },
      settlement: { type: String },
   },

   {
      timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
   }
);

const Events = mongoose.model<IEvents>('Events', eventsSchema);

export default Events;