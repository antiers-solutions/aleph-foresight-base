// //import dbConnectionHandler from '../../pgconnection/connection';

// import dbConnectionHandler from "../../../mongoDB/connection";
// import * as config from "../../../config";
// describe("ModelHelper", () => {

//   beforeAll(() => {
//   config.loadEnvs();
//     dbConnectionHandler.createDBConnection();
//   });

//   beforeEach(() => {
//    jest.clearAllMocks();
//     jest.spyOn(process, "exit").mockImplementation(() => {
//       throw new Error("process.exit() called.");
//     });
//   });

//   afterEach(() => {
//     jest.restoreAllMocks();
//   });

//   it("should complete migration successfully", async () => {
//     jest.mock("../../../models/Currency", () => ({
//         currencySchema: {
//         sync: jest.fn().mockResolvedValue(true)
//       },
//     }));
//     jest.mock("../../../models/Dispute", () => ({
//       User: {
//         sync: jest.fn().mockResolvedValue(true),
//       },
//     }));
//     jest.mock("../../../models/Events", () => ({
//       Rewards_Details: {
//         sync: jest.fn().mockResolvedValue(true),
//         belongsTo: jest.fn(),
//       },
//     }));
//     jest.mock("../../../models/Order", () => ({
//       social_profiles: {
//         sync: jest.fn().mockResolvedValue(true),
//         belongsTo: jest.fn(),
//       },
//     }));
//     jest.mock("../../../models/Users", () => ({
//       Account_Details: {
//         sync: jest.fn().mockResolvedValue(true),
//         belongsTo: jest.fn(),
//       },
//     }));
//     jest.mock("../../../models/Transaction", () => ({
//       hydro_posts: {
//         sync: jest.fn().mockResolvedValue(true),
//         belongsTo: jest.fn(),
//       },
//     }));
//   });
// });
