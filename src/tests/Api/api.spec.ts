import request from "supertest";
import dbConnectionHandler from "../../mongoDB/connection";
import redisHelper from "../../helpers/redis.helper";
import * as config from "../../config/index";
import App from "../../app"; // Corrected import path
import ContractController from "../../controllers/contract.controller";
import CurrencyController from "../../controllers/currency.controller";
import UserController from "../../controllers/user.controller";
import AdminController from "../../controllers/admin.controller";
import DisputeController from "../../controllers/dispute.controller";
import rpcHandlerInstance from "../../helpers/rpc.helper";

let app;

beforeAll(async () => {
  config.loadEnvs();
  app = new App([
    new ContractController(),
    new CurrencyController(),
    new UserController(),
    new DisputeController(),
    new AdminController(),
    // Add other controllers if needed
  ]).app;

  await redisHelper.connectRedis();
  await dbConnectionHandler.createDBConnection();
  rpcHandlerInstance.createRpcConnection();
});

afterAll(async () => {
  await redisHelper.releaseRedisConnection();
  await dbConnectionHandler.releaseDBConnection();
  rpcHandlerInstance.releaseRpcConnection();
});
describe("Post /api/user/connect-wallet", () => {
  it("should connect wallet address", async () => {
    const headers = { "user-agent": "js-client" };
    const body = {
      wallet_address: "0x1bacaecc83ed515b77a8d39f24e46e05c8bbc920",
      signature_key:
        "0x908d578e0c130e48ac4f1d6c31a4a6c466a7ec8758f0361070184508d1bf60c2515f15acc032ff21f708f3413b23303dd6a9198ec37c7776833d806f7b15c1031c",
    };

    const response = await request(app)
      .post("/api/user/connect-wallet")
      .set(headers)
      .send(body);
    const token =
      response.headers["set-cookie"]?.length &&
      response.headers["set-cookie"][0];
    process.env.COOKIE = token;

    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Post /api/contract/createIpfsUrl", () => {
  it("should create an IPFS URL", async () => {
    const headers = { "user-agent": "js-client" };
    const body = {
      eventName: "BTC",
      timestamp: 657612,
      price: 10000000,
    };
    const response = await request(app)
      .post("/api/contract/createIpfsUrl")
      .set(headers)
      .send(body);

    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});

describe("Get /api/contract/getEvents", () => {
  it("should get events data", async () => {
    const headers = { "user-agent": "js-client" };
    const response = await request(app)
      .get("/api/contract/getEvents?page=1&limit=10")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});

describe("Get /api/contract/getOrder", () => {
  it("should get orders data", async () => {
    const headers = { "user-agent": "js-client" };
    const response = await request(app)
      .get(
        "/api/contract/getOrder?page=1&userAddress=0x1bacaecc83ed515b77a8d39f24e46e05c8bbc920&limit=10"
      )
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/contract/volumeTraded", () => {
  it("should get volume tarded data", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get("/api/contract/volumeTraded")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/contract/totalTraded", () => {
  it("should get total tarded", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get("/api/contract/totalTraded")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/contract/netPosition", () => {
  it("should get net position", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get("/api/contract/netPosition")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/contract/getEventDetails", () => {
  it("should get net position", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get(
        "/api/contract/getEventDetails?eventId=QmXh2thKPoydfGJ6AM8ir2mUJVGVMrcer2MRcMa21i9QmL"
      )
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/contract/getClosedPosition", () => {
  it("should get closed position", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get("/api/contract/getClosedPosition?page=1&limit=10&statusType=1")
      .set(headers);
    expect(response.status).toBe(204); // Adjust the expected status code as needed
    //expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/contract/getOnEventsBet", () => {
  it("should get On Events Bet", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get(
        "/api/contract/getOnEventsBet?eventId=QmX8fp1bjeogSL3H4qk1FtiER7tfF6emUGeUn4c2tqd9zn"
      )
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/contract/getUserEvent", () => {
  it("should get user events ", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get("/api/contract/getUserEvent?page=1&limit=10")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/contract/totalBetOnEvent", () => {
  it("should get total events on bet ", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get(
        "/api/contract/totalBetOnEvent?eventId=QmX8fp1bjeogSL3H4qk1FtiER7tfF6emUGeUn4c2tqd9zn"
      )
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/contract/payout", () => {
  it("should get payout ", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get(
        "/api/contract/payout?eventId=QmX8fp1bjeogSL3H4qk1FtiER7tfF6emUGeUn4c2tqd9zn"
      )
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});

describe("Get /api/currency/getTopMarket", () => {
  it("should get top market data", async () => {
    const headers = { "user-agent": "js-client" };
    const response = await request(app)
      .get("/api/currency/getTopMarket")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/currency/getCurrentPrice", () => {
  it("should get current price data", async () => {
    const headers = { "user-agent": "js-client" };
    const response = await request(app)
      .get("/api/currency/getCurrentPrice?coin=BTC")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});

describe("Get /api/user/getTotalEventCreators", () => {
  it("should get orders data", async () => {
    const headers = { "user-agent": "js-client" };
    const response = await request(app)
      .get("/api/user/getTotalEventCreators")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/user/getTotalUser", () => {
  it("should get orders data", async () => {
    const headers = { "user-agent": "js-client" };
    const response = await request(app)
      .get("/api/user/getTotalUser")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/user/get-profile", () => {
  it("should get profile data", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get("/api/user/get-profile")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/user/upload-profile", () => {
  it("should get profile data", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const body = {
      userName: "shivam",
      alephId: "0x908d3dd6a919",
    };
    const response = await request(app)
      .put("/api/user/upload-profile")
      .set(headers)
      .send(body);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    //expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/user/me", () => {
  it("should get profile data", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app).get("/api/user/me").set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/user/getTotalVolume", () => {
  it("should get orders data", async () => {
    const headers = { "user-agent": "js-client" };
    const response = await request(app)
      .get("/api/user/getTotalVolume")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/dispute/getDispute", () => {
  it("should get dispute data", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get("/api/dispute/getDispute?filter=open&page=1&limit=5")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    //expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
    expect(response.body.data).toHaveProperty("dispute");
  });
});
describe("Get /api/dispute/getDisputeEvent", () => {
  it("should get dispute events data", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get("/api/dispute/getDisputeEvent")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Post /api/dispute/raiseDispute", () => {
  it("should dispute raised", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const body = {
      eventId: "QmNwCvHiZ1RtiJWRtq68c493aWArgWQH2LTPt5HfHDNhwS",
      category: "Other",
      email: "ra@antiersolutions.com",
      description:
        "Numquam blanditiis harum quisquam eius sed odit fugiat iusto fuga praesentium",
      evidence: [
        "QmUKFM46Yc4Fz12ZaoaGQAKEziF4GQa9DEy6Vq2XGpZwkx",
        "QmNwCvHiZ1RtiJWRtq68c493aWArgWQH2LTPt5HfHDNhwS",
      ],
    };
    const response = await request(app)
      .post("/api/dispute/raiseDispute")
      .set(headers)
      .send(body);

    expect(response.status).toBe(403); // Adjust the expected status code as needed
   // expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Post /api/admin/adminLogin", () => {
  it("should admin login ", async () => {
    const headers = { "user-agent": "js-client" };
    const body = {
      wallet_address: "0x1bacaecc83ed515b77a8d39f24e46e05c8bbc920",
      signature_key:
        "0x908d578e0c130e48ac4f1d6c31a4a6c466a7ec8758f0361070184508d1bf60c2515f15acc032ff21f708f3413b23303dd6a9198ec37c7776833d806f7b15c1031c",
    };

    const response = await request(app)
      .post("/api/admin/adminLogin")
      .set(headers)
      .send(body);
    const token =
      response.headers["set-cookie"]?.length &&
      response.headers["set-cookie"][0];
    process.env.COOKIE = token;

    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/admin/getUser", () => {
  it("should get user data", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get("/api/admin/getUser?page=1&limit=10")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/admin/getEventsCreators", () => {
  it("should get event creaters data", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get("/api/admin/getEventsCreators?page=1&limit=10")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/admin/getClosedPosition", () => {
  it("should get closed positions data", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get("/api/admin/getClosedPosition?page=1&limit=1")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/admin/getDisputeRaise", () => {
  it("should get dispute raised data", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get("/api/admin/getDisputeRaise?page=1&limit=5")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/admin/getTotalDispute", () => {
  it("should get total dispute", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get("/api/admin/getTotalDispute")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/admin/getTotalTransaction", () => {
  it("should get total transaction", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get("/api/admin/getTotalTransaction")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/admin/getTotalEvents", () => {
  it("should get total events", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app)
      .get("/api/admin/getTotalEvents")
      .set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
    expect(response.body).toHaveProperty("data"); // Adjust based on your actual response structure
  });
});
describe("Get /api/user/logout", () => {
  it("should logout", async () => {
    const headers = { "user-agent": "js-client", cookie: process.env.COOKIE };
    const response = await request(app).get("/api/user/logout").set(headers);
    expect(response.status).toBe(200); // Adjust the expected status code as needed
  });
});