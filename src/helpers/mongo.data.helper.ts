import mongoose, { Model, PipelineStage } from 'mongoose';
import { DATA_MODELS, UNDEFINED } from '../constants';
import modelsObejct from '../models/index';
import { log } from '../utils/helper.utils';
import { ERROR_MESSAGE } from '../constants/mongo.data.constant';
//mongodb curd helper
class MongoDataHelper {
   static instance: MongoDataHelper = null;

   static getInstance = () => {
      if (!MongoDataHelper.instance) {
         MongoDataHelper.instance = new MongoDataHelper();
         delete MongoDataHelper.constructor;
      }
      return MongoDataHelper.instance;
   };
   // Helper function to filter and count details

   /**
    * get the total document count stored in choosen collection
    * @param name
    * @param query
    * @returns
    */
   public getCount = async (name: string, query?: any) => {
      try {
         this._checkModel(name);

         if (query) {
            // gets count of the number present in the db based on the query
            const result = await this._getModel(name).find(query).count();
            return result;
         } else {
            // gets count of all the data present in the db collection
            const result = await this._getModel(name)?.count();
            return result;
         }
      } catch (err) {
         log.red(ERROR_MESSAGE.GET_COUNT_ERR, err);
         return 0;
      }
   };

   /**
    * save the single data object
    * @param name
    * @param data
    * @returns
    */
   public saveData = async (name: string, data: object) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         const DataObject = new Model(data);
         const result = await DataObject.save();
         return result;
      } catch (error) {
         log.red(ERROR_MESSAGE.SAVE_DATA, error.message);
         return null;
      }
   };
   /**
    * save the data into bulk
    * @param name
    * @param data
    * @returns
    */
   public findOne = async (name: string, query: any) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         // inserts multiple data in the db collection at a specific time
         const result = await Model.findOne(query);
         return result;
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ONE_ERR, err.message);
         return null;
      }
   };
   /**
    * Fetches all documents from a specified MongoDB collection.
    * @param name The name of the collection.
    * @param query The query object to filter documents.
    * @param sort The sort object to sort the documents.
    * @param skip The number of documents to skip.
    * @param limit The maximum number of documents to return.
    * @returns A promise that resolves to an array of documents, or null in case of an error.
    */
   public findAll = async (
      name: string,
      query: object,
      sort: any = {},
      skip?: number,
      limit?: number
   ) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         const results = await Model.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .exec();
         return results;
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };
   /**
    * find all the events whose result has been announced
    * @param name 
    * @param query 
    * @param sort 
    * @returns 
    */
   public findAllResultEvents = async (
      name: string,
      query: any,
      sort: any = {}
   ) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         const pipeline = [
            {
               $match: {
                  userId: query.userId,
                  status: 2, // Match status 0 in the event collection
               },
            },
            {
               $lookup: {
                  from: 'orders', // Collection name to join
                  localField: 'eventId', // Field from the current collection
                  foreignField: 'eventId', // Field from the "order" collection
                  as: 'ordersDetails', // Alias for joined data
               },
            },
            {
               $match: {
                  'ordersDetails.userId': { $exists: true, $ne: null },
               },
            },
            {
               $lookup: {
                  from: 'disputes', // Collection name to join
                  let: { eventId: '$eventId', userId: '$userId' }, // Variables to join on
                  pipeline: [
                     {
                        $match: {
                           $expr: {
                              $and: [
                                 { $eq: ['$eventId', '$$eventId'] },
                                 { $eq: ['$userId', '$$userId'] },
                              ],
                           },
                        },
                     },
                  ],
                  as: 'disputeDetails', // Alias for joined data
               },
            },
            {
               $match: {
                  disputeDetails: { $eq: [] }, // Ensure no disputes match
               },
            },
            {
               $project: {
                  eventId: 1,
                  userId: 1,
                  targetDateTime: 1,
                  betClouserTime: 1,
                  eventDuration: 1,
                  eventExpireTime: 1,
                  eventResultTime: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  'ordersDetails.amount': 1,
                  'ordersDetails.updatedAt': 1,
               },
            },
         ];
         const results = await Model.aggregate(pipeline).sort(sort).exec();
         return results;
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };
   /**
    * find the price of the currency
    * @param name 
    * @param query 
    * @param sort 
    * @returns 
    */
   public findPrice = async (name: string, query: object) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         const results = await Model.findOne(query).select(
            'name symbol precision price'
         );
         return results;
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };
   
   /**
    * Finds all events based on the provided parameters.
    * 
    * @param name - The name of the model to search in.
    * @param query - The query object to filter the events.
    * @param sort - The sorting criteria for the events.
    * @param skip - The number of events to skip.
    * @param limit - The maximum number of events to return.
    * @param search - The search string to filter the events by currency name or symbol.
    * @returns An object containing the events data and the total count of events.
    */
   public findAllEvent = async (
      name: string,
      query: object,
      sort: any = {},
      skip?: number,
      limit?: number,
      search?: string
   ) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         const matchQuery = { status: 1, ...query };
         const pipeline: PipelineStage[] = [
            { $match: matchQuery },
            {
               $lookup: {
                  from: 'currencies', // Collection name to join
                  localField: 'currencyType', // Field from Orders collection
                  foreignField: 'symbol', // Field from userDetails collection
                  as: 'currencyDetails', // Alias for joined data
               },
            },
            {
               $lookup: {
                  from: 'orders',
                  localField: 'eventId',
                  foreignField: 'eventId',
                  as: 'orderDetails',
               },
            },
            { // total volume of each event 
               $addFields: {
                  totalVolume: {
                     $sum:{
                        $map:{
                           input: '$orderDetails',
                           as: 'order',
                           in: {
                              $cond:{
                                 if:{
                                    $eq:['$$order.bidType','withdraw'] // if the bet is withdrawn 
                                 }, 
                                 then:0, // do not count the bet amount of that order
                                 else:'$$order.currentBet'
                              }
                           }
                        }
                     }
                  }                
              }
            },
            {
               $unwind: '$currencyDetails',
            },
            ...(search !== undefined &&
            search.trim() !== '' &&
            search !== UNDEFINED
               ? [
                    {
                       $match: {
                          $or: [
                             {
                                'currencyDetails.name': {
                                   $regex: `${search}`,
                                   $options: 'i',
                                },
                             },
                             {
                                'currencyDetails.symbol': {
                                   $regex: `${search}`,
                                   $options: 'i',
                                },
                             },
                          ],
                       },
                    },
                 ]
               : []),
            {
               $addFields: {
                  convertedDate: {
                     $toDate: '$eventExpireTime',
                  },
                  currentPrice: {
                     $toDouble: '$currencyDetails.price',
                  },
               },
            },
            { $sort: sort },
            {
               $project: {
                  _id: 0,
                  currencyDetails: 0,
                  orderDetails: 0,
               },
            },
         ];
         const total = await Model.aggregate(pipeline).count(name).exec();
         const results = await Model.aggregate(pipeline)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .exec();
         const formattedResults = {
            eventsData: results,
            total: total[0].Events, // Total count of events
         };
         return formattedResults;
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };
   /**
    * Finds number of bets for users
    * @param name 
    * @param query 
    * @param sort 
    * @param skip 
    * @param limit
    * @returns An object containing the user created events and the total count of events.
    */
   public findAllNoBet =  async (
      name: string,
      query: object,
      sort: any = {},
      skip?: number,
      limit?: number
   ) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         //Aggregation pipeline
         const pipeline = [
            { $match: query },
            {
               $lookup: {
                  from: 'orders', // Collection name to join
                  localField: 'eventId', // Field from Orders collection
                  foreignField: 'eventId', // Field from userDetails collection
                  as: 'userDetails', // Alias for joined data
               },
            },
         ];
         const total = await Model.aggregate(pipeline).count(name).exec();
         const results = await Model.aggregate(pipeline)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .exec();
         results.map((item) => {
            item.userDetails = item.userDetails.filter((order) => {
               return order.eventId.toLowerCase() == item.eventId.toLowerCase();
            });
            let volume: number = 0;
            item.userDetails.forEach((item) => {
               volume += Number(item.amount);
            });
            item.noOfBets = item.userDetails.length;
            item.volume = volume;
            return item;
         });
         const formattedResults = {
            eventsData: results,
            total: total[0].Events, // Total count of events
         };
         return formattedResults;
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };
   /**
    * Finds all orders of users
    * @param name 
    * @param query 
    * @param sort 
    * @param skip 
    * @param limit 
    * @returns 
    */
   public findAllOrdersUser = async (
      name: string,
      query: object,
      sort: any = {},
      skip?: number,
      limit?: number
   ) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         //Aggregation pipeline
         const pipeline = [
            { $match: query },
            {
               $lookup: {
                  from: 'users', // Collection name to join
                  localField: 'walletAddress', // Field from Orders collection
                  foreignField: 'userId', // Field from userDetails collection
                  as: 'userDetails', // Alias for joined data
               },
            },
            {
               $lookup: {
                  from: 'events', // Collection name to join
                  localField: 'eventId', // Field from Orders collection
                  foreignField: 'eventId', // Field from userDetails collection
                  as: 'targetDateTime', // Alias for joined data
               },
            },
            {
            $addFields:{
               userDetails: {
                  $filter: {
                     input: '$userDetails',
                     as: 'userDetails',
                     cond: {
                        $eq: [
                           { $toLower: '$$userDetails.walletAddress' },
                           { $toLower: '$userId' },
                        ],
                     },
                  },
               },
            }
            },
            {
              $addFields:{
               userDetails:{
                  $first:'$userDetails'
               },
               targetDateTime:{
                  $first:"$targetDateTime.targetDateTime"
               },
               priceLevel:{
                  $first:"$targetDateTime.priceLevel",
               },
               currencyType:{
                  $first:"$targetDateTime.currencyType"
               }
              } 
            }
         ];

         const total = await Model.aggregate(pipeline).count(name).exec();
         const results = await Model.aggregate(pipeline)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .exec();
         // results.map((item) => {
         //    const userDetails = item.userDetails.filter(
         //       (user) => {
         //          return (
         //             user.walletAddress.toLowerCase() ==
         //             item.userId.toLowerCase()
         //          );
         //       }
         //    )[0];
         //    item.userDetails = userDetails;
         // });
         // results.map((item) => {
            // item.targetDateTime = item.targetDateTime.filter((event) => {
            //    return event.userId.toLowerCase() == item.userId.toLowerCase();
            // })[0]?.targetDateTime;
         // });
         const formattedResults = {
            ordersData: results,
            total: total[0].Order,
         };
         return formattedResults;
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };
   /**
    * finds all the event creators on the platform for admin
    * @param name 
    * @param query 
    * @param sort 
    * @param skip 
    * @param limit 
    * @returns 
    */
   public eventOdds = async (
      name: string,
      query: object,
      //sort: any = {},
   ) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         //Aggregation pipeline
         const statuses = [0, 2, 4]; // Define the statuses you want to match
         const pipeline = [
           { $match: query },
            {
               $lookup: {
                  from: 'events', // Collection name to join
                  localField: 'eventId', // Field from the current collection
                  foreignField: 'eventId', // Field from the events collection
                  as: 'eventDetails', // Alias for joined data
               },
            },
            {
               $project: {
                  eventId: 1,
                  amount:1,
                  settlement:1,
                  odds: {
                     $first:'$eventDetails.odds'
                  }, // Include only the odds array from eventDetails
                  platformFees:{
                     $first: '$eventDetails.platformFees'
                  }
               },
            },
         ];
         const results = await Model.aggregate(pipeline).exec();
         return results;
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };
   /**
    * Finds all closed  and open position (events) 
    * @param name 
    * @param query 
    * @param skip 
    * @param limit 
    * @param statusType 
    * @returns 
    */
   public findAllClosedPosition = async (
      name: string,
      query: any,
      skip?: number,
      limit?: number,
      statusType?: number
   ) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         //Aggregation pipeline
         let matchData:object = {};
         if (statusType === 1) {
            matchData = { $in: [1, 3] }; // 1 - active , 3 - bid close
         } else {
            matchData = { $in: [0, 2, 4] }; // 0 - close, 2 - result declare, 4 - dispute period end
         }
         const pipeline: PipelineStage[] = [
            {
               $facet: {
                  eventTrue: [
                     {
                        $lookup: {
                           from: 'events',
                           localField: 'eventId',
                           foreignField: 'eventId',
                           as: 'eventDetail',
                        },
                     },
                     {
                        $match: {
                           bidType: 'true',
                           'eventDetail.status': matchData,
                           userId: query.userId,
                           result:statusType==1 ? null:{$in:[null,1]}
                        },
                     },
                     {
                        $set: {
                           'eventStatus': {
                              $first: '$eventDetail.status',
                           },
                           'targetDateTime': {
                              $first: '$eventDetail.targetDateTime',
                              },
                           'priceLevel': {
                              $first: '$eventDetail.priceLevel',
                              },   
                           'currencyType': {
                              $first: '$eventDetail.currencyType',
                              },   
                        },
                        
                     },
                     { $unset: 'eventDetail' },
                     {
                        $group: {
                           _id: '$eventId',
                           latestOrder: { $last: '$$ROOT' },
                        },
                     },
                     {
                        $replaceRoot: {
                           newRoot: '$latestOrder',
                        },
                     },
                  ],
                  eventFalse: [
                     {
                        $lookup: {
                           from: 'events',
                           localField: 'eventId',
                           foreignField: 'eventId',
                           as: 'eventDetail',
                        },
                     },
                     {
                        $match: {
                           bidType: 'false',
                           'eventDetail.status': matchData,
                           userId: query.userId,
                           result:statusType==1 ? null:{$in:[null,1]}
                        },
                     },
                     {
                        $set: {
                           'eventStatus': {
                              $first: '$eventDetail.status',
                           },
                           'targetDateTime': {
                              $first: '$eventDetail.targetDateTime',
                              },
                           'priceLevel': {
                              $first: '$eventDetail.priceLevel',
                              },   
                           'currencyType': {
                              $first: '$eventDetail.currencyType',
                              },   
                        },
                        
                     },
                     { $unset: 'eventDetail' },
                     {
                        $group: {
                           _id: '$eventId',
                           latestOrder: { $last: '$$ROOT' },
                        },
                     },
                     {
                        $replaceRoot: {
                           newRoot: '$latestOrder',
                        },
                     },
                  ],
               },
            },
            {
               $project: {
                  data: {
                     $concatArrays: ['$eventTrue', '$eventFalse'],
                  },
               },
            },
            { $unwind: '$data' },
            { $sort: { 'data.createdAt': -1 } },
            {
               $group: {
                  _id: null,
                  data: { $push: '$data' },
               },
            },
            {
               $project: {
                  _id: 0,
                  data: 1,
               },
            },
            { $unwind: '$data' },
         ];
         const total = await Model.aggregate(pipeline).count(name).exec();
         const results = await Model.aggregate(pipeline)
            .skip(skip)
            .limit(limit)
            .exec();
         const formattedResults = {
            ordersData: results,
            total: total[0].Order, // Total count of events
         };
         return formattedResults;
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };
   /**
    * find event details and currency price
    * @param name 
    * @param query 
    * @returns 
    */
   public findEventPrice = async (name: string, query: object) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         //Aggregation pipeline
         const pipeline = [
            { $match: query },
            {
               $lookup: {
                  from: 'currencies', // Collection name to join
                  localField: 'currencyType', // Field from Orders collection
                  foreignField: 'symbol', // Field from userDetails collection
                  as: 'currencyDetails', // Alias for joined data
               },
            },
            {
               $lookup: {
                  from: 'orders',
                  localField: 'eventId',
                  foreignField: 'eventId',
                  as: 'matchingOrders',
               },
            },
            {
               $unwind: '$currencyDetails', // Flatten the array of joined documents
            },
            {
               $addFields: { // difference between current price and price level
                  priceDifference: {
                     $cond: {
                        if: { $gte: ['$currencyDetails.price', '$priceLevel'] },
                        then: {
                           $subtract: ['$currencyDetails.price', '$priceLevel'],
                        },
                        else: {
                           $subtract: ['$priceLevel', '$currencyDetails.price'],
                        },
                     },
                  },
                  sign: { 
                     $cond: {
                        if: { $gte: ['$currencyDetails.price', '$priceLevel'] },
                        then: 'positive',
                        else: 'negative',
                     },
                  },
                  totalNoOfBet: { $size: '$matchingOrders' },
                  
               },
            },
            {
               $addFields: { // price difference percent 
                  percentageDifference: {
                     $multiply: [
                        {
                           $divide: ['$priceDifference', '$priceLevel'],
                        },
                        100,
                     ],
                  },
                  noBetYet:{ 
                     $cond: { 
                        if: { 
                           $eq:['$totalNoOfBet',0] 
                        }, 
                        then: true,
                        else: false
                     }
                  } 
               },
            },
            {
               $project: {
                  eventId: 1,
                  txnId: 1,
                  userId: 1,
                  currencyType: 1,
                  priceLevel: 1,
                  targetDateTime: 1,
                  bettingClosureTime: 1,
                  eventDuration: 1,
                  resolutionSource: 1,
                  resolver: 1,
                  status: 1,
                  eventExpireTime: 1,
                  eventResultTime: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  'currencyDetails.price': 1, // Include the price from the Currency collection
                  'currencyDetails.precision': 1,
                  'currencyDetails.symbol': 1,
                  'currencyDetails.name': 1,
                  percentage: 1,
                  sign: 1,
                  totalNoOfBet: 1,
                  noBetYet: 1,
                  percentageDifference: 1,
               },
            },
         ];
         const results = await Model.aggregate(pipeline).exec();
         return results;
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };
   /**
    * finds all the closed and open position (Events) 
    * @param name 
    * @param query 
    * @param status 
    * @param sort 
    * @param skip 
    * @param limit 
    * @returns 
    */
   public findAllClosedPositionAdmin = async (
      name: string,
      query?: any,
      status?: number,
      sort: any = {},
      skip?: number,
      limit?: number
   ) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         //Aggregation pipeline
         let matchData:object = {};
         if (!isNaN(status)) {
            if (status === 1) { // open position
               matchData = {
                  $or: [{ status: 1 }, { status: 3 }],
               };
            } else { // close position
               matchData = {
                  $or: [{ status: 0 }, { status: 2 }],
               };
            }
         }
         const pipeline = [
            { $match: query },
            {
               $match: matchData,
            },
            {
               $lookup: {
                  from: 'orders', // Collection name to join
                  localField: 'eventId', // Field from Orders collection
                  foreignField: 'eventId', // Field from userDetails collection
                  as: 'closedPosition', // Alias for joined data
               },
            },
            {
               $addFields:{
                  noBetYet:{
                     $cond:{
                        if: {
                           $eq:[{$size:'$closedPosition'},0]
                        },
                        then: true,
                        else: false
                     } 
                  }
               }
            },
            {
               $project: {
                  eventId: '$eventId',
                  txnId: '$txnId',
                  userId:'$userId',
                  status: '$status',
                  priceLevel:'$priceLevel',
                  targetDateTime: '$targetDateTime',
                  createdAt: '$createdAt',
                  updatedAt: '$updatedAt',
                  totalAmount: { $sum: '$closedPosition.amount' },
                  transactionCount: { $size: '$closedPosition' },
                  noBetYet:1
               },
            },
         ];
         const total = await Model.aggregate(pipeline).count(name).exec();
         const results = await Model.aggregate(pipeline)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .exec();
         // Format results to match the specified structure
         const formattedResults = {
            ordersData: results,
            total: total[0].Events, // Total count of events
         };
         return formattedResults;
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };
   /**
    * finds all the disputes 
    * @param name 
    * @param sort 
    * @param skip 
    * @param limit 
    * @returns 
    */
   public findAllDispute = async (
      name: string,
      sort: any = {},
      skip?: number,
      limit?: number
   ) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         //Aggregation pipeline
         const pipeline = [
            {
               $lookup: {
                  from: 'events', // Collection name to join
                  localField: 'eventId', // Field from Orders collection
                  foreignField: 'eventId', // Field from userDetails collection
                  as: 'disputeRaise', // Alias for joined data
               },
            },
            {
               $project: {
                  eventId: '$eventId',
                  userId: '$userId',
                  category: '$category',
                  description: '$description',
                  evidenceUrl: '$evidenceUrl',
                  createdAt: '$createdAt',
                  status: '$status',
                  updatedAt: '$updatedAt',
                  targetDateTime: '$disputeRaise.targetDateTime',
               },
            },
         ];
         const total = await Model.aggregate(pipeline).count(name).exec();
         const results = await Model.aggregate(pipeline)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .exec();
         const formattedResults = {
            disputeData: results,
            total: total[0].Dispute, // Total count of events
         };
         // Format results to match the specified structure
         return formattedResults;
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };
   /**
    * finds the net position ( PROFIT and LOSS ) of the user on platform
    * @param name 
    * @param query 
    * @param result 
    * @returns 
    */
   public findSumNetPosition = async (
      name: string,
      query: object,
      result: number
   ) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
   
         if (result === 1) {
            // Calculate totalAmountClaimed and totalAmount1 for result = 1 where amountClaimed exists
            const totalResults = await Model.aggregate([
               { $match: { ...query, amountClaimed: { $exists: true }} },
               { 
                  $group: { 
                     _id: null, 
                     totalAmountClaimed: { $sum: "$amountClaimed" },
                     totalAmount1: { $sum: "$amount" }
                  } 
               }
            ]);
   
            const totalAmountClaimed = totalResults.length > 0 ? totalResults[0].totalAmountClaimed : 0;
            const totalAmount1 = totalResults.length > 0 ? totalResults[0].totalAmount1 : 0;
   
            return { totalAmountClaimed, totalAmount1 };
   
         } else if (result === 0) {
            // Sum amount2 for result = 0 and exclude bidType = "withdraw"
            const amount2Results = await Model.aggregate([
               { $match: { ...query, result: 0, bidType: { $ne: "withdraw" } } },
               { 
                  $group: { 
                     _id: null, 
                     totalAmount2: { $sum: "$amount" } 
                  } 
               }
            ]);
   
            const totalAmount2 = amount2Results.length > 0 ? amount2Results[0].totalAmount2 : 0;
            return { totalAmount2 };
         }
   
         return null;
   
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };
   /**
    * finds all the users and their details on platform for the admin
    * @param name 
    * @param query 
    * @param sort 
    * @param skip 
    * @param limit 
    * @returns 
    */
   public findAllUserAdmin = async (
      name: string,
      query: object,
      sort: any = {},
      skip?: number,
      limit?: number
   ) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         //Aggregation pipeline
         const pipeline = [
            { $match: query },
            {
               $lookup: {
                  from: 'orders', // Collection name to join
                  localField: 'userId', // Field from current collection
                  foreignField: 'walletAddress', // Field from orders collection
                  as: 'userDetails', // Alias for joined data
               },
            },
            {
               $lookup: {
                  from: 'disputes', // Collection name to join
                  localField: 'userId', // Field from current collection
                  foreignField: 'walletAddress', // Field from disputes collection
                  as: 'disputeDetails', // Alias for joined data
               },
            },
            {
               $addFields: {
                  userDetails: {
                     $filter: {
                        input: '$userDetails',
                        as: 'detail',
                        cond: {
                           $eq: [
                              { $toLower: '$$detail.userId' },
                              { $toLower: '$walletAddress' },
                           ],
                        },
                     },
                  },
                  disputeDetails: {
                     $filter: {
                        input: '$disputeDetails',
                        as: 'detail',
                        cond: {
                           $eq: [
                              { $toLower: '$$detail.userId' },
                              { $toLower: '$walletAddress' },
                           ],
                        },
                     },
                  },
               },
            },
            {
               $addFields: {
                  noOfBets: { $size: '$userDetails' },
                  noOfDisputes: { $size: '$disputeDetails' },
               },
            },
            {
               $project: {
                  userDetails: 0,
                  disputeDetails: 0,
               },
            },
         ];
         const total = await Model.count({});
         const results = await Model.aggregate(pipeline)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .exec();
         const formattedResults = {
            users: results,
            total: total, // Total count of events
         };
         return formattedResults;
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };
   /**
    * finds all the event creators on the platform for admin
    * @param name 
    * @param query 
    * @param sort 
    * @param skip 
    * @param limit 
    * @returns 
    */
   public findAllAdminEventCreators = async (
      name: string,
      query: object,
      sort: any = {},
      skip?: number,
      limit?: number
   ) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         //Aggregation pipeline
         const pipeline = [
            { $match: query },
            {
               $lookup: {
                  from: 'events', // Collection name to join
                  localField: 'userId', // Field from the current collection
                  foreignField: 'walletAddress', // Field from the events collection
                  as: 'userDetails', // Alias for joined data
               },
            },
            {
               $addFields: {
                  userDetails: {
                     $filter: {
                        input: '$userDetails',
                        as: 'user',
                        cond: {
                           $eq: [
                              { $toLower: '$$user.userId' },
                              { $toLower: '$walletAddress' },
                           ],
                        },
                     },
                  },
               },
            },
            {
               $addFields: {
                  noOfEvents: { $size: '$userDetails' },
                  rewards: { $sum : '$userDetails.reward'}
               },
            },
            {
               $match: { 'userDetails.0': { $exists: true } }, // Filters out documents where userDetails is empty
            },
         ];
         const total = await Model.aggregate(pipeline).count(name).exec();
         const results = await Model.aggregate(pipeline)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .exec();
         const formattedResults = {
            users: results,
            total: total[0].User, // Total count of event creator
         };
         return formattedResults;
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };
   /**
    * finds total number of event creators
    * @param name 
    * @param query 
    * @returns 
    */
   public findTotalEventCreators = async (name: string) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         const pipeline = [
            {
               $group:{
                  _id: "$userId",
                  count: { $sum:1 },
               }
            }
         ];
         const results = await Model.aggregate(pipeline).count(name).exec();
         return results[0].Events;
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };
   /**
    * finds all the events traded on the platform
    * @param name 
    * @param query 
    * @returns 
    */
   public findAllEventTraded = async (name: string, query: any) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         const results = await Model.aggregate([
            { $match: query },
            {
               $group: {
                  _id: '$eventId', // Group by eventId
               },
            },
            {
               $count: 'uniqueEventCount', // Count the unique eventIds
            },
         ]);
         return results[0].uniqueEventCount;
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };
   /**
    * finds the total volume traded (amount spent) on the platform
    * @param name 
    * @param query 
    * @returns 
    */
   public findAllSum = async (name: string, query: any) => {
      try {
         this._checkModel(name);
         const Model = this._getModel(name);
         const results = await Model.aggregate([
            { $match: query },
            { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
         ]);
         const volumeTraded = results.length > 0 ? results[0].totalAmount : 0;
         return { volumeTraded };
      } catch (err) {
         log.red(ERROR_MESSAGE.FIND_ALL_ERR, err.message);
         return null;
      }
   };

   /**
    * if data found then this function will update that data otherwise insert that data
    * @param name
    * @param filter
    * @param data
    * @returns
    */
   public findOneAndUpdate = async (
      name: string,
      filter: unknown,
      data: unknown
   ) => {
      try {
         this._checkModel(name);

         // updated the data in the db collection based on the query provided
         const result = await this._getModel(name).findOneAndUpdate(
            filter,
            data,
            {
               new: true,
               upsert: true,
            }
         );
         return result;
      } catch (error) {
         log.red(ERROR_MESSAGE.UPDATE_DATA, error.message);
         return null;
      }
   };


   //---------------------------------internal methods -----------------------------------/
   // check if the model exist or not if not then throw error
   _checkModel = (model: string) => {
      if (!Object.keys(DATA_MODELS).includes(model))
         throw new Error('Model is not defined.');
   };

   // get the selected moongose model
   _getModel = (model: string): Model<any> => {
      switch (model) {
         case DATA_MODELS.User:
            return modelsObejct.User;
         case DATA_MODELS.Events:
            return modelsObejct.Events;
         case DATA_MODELS.Currency:
            return modelsObejct.Currency;
         case DATA_MODELS.Dispute:
            return modelsObejct.Dispute;
         case DATA_MODELS.Order:
            return modelsObejct.Order;
         case DATA_MODELS.Transaction:
            return modelsObejct.Transaction;
         default:
            return null;
      }
   };
}

export default MongoDataHelper.getInstance();
