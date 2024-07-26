
const chai1 = require("chai");
const chaiHttp = require("chai-http");
const expect = chai1.expect;
const should = chai1.should();

chai1.use(chaiHttp);
describe("GET /api/currency/getTopMarket", () => {
  it("should fetch top currency in the market", (done) => {
    chai1
      .request("http://localhost:8000")
      .get("/api/currency/getTopMarket")
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an("object");
          expect(res.body)
            .to.have.property("message")
            .that.equals("Fetch data successfully");
          expect(res.body).to.have.property("data").that.is.an("object");
          expect(res.body.data)
            .to.have.property("Currency")
            .that.is.an("array");
          if (res.body.data.Currency.length > 0) {
            const currency = res.body.data.Currency[0]
            expect(currency).to.have.property("_id");
            expect(currency).to.have.property("name");
            expect(currency).to.have.property("iconUrl");
            expect(currency).to.have.property("symbol");
            expect(currency).to.have.property("precision");
            expect(currency).to.have.property("price");
            expect(currency).to.have.property("positions");
            expect(currency).to.have.property("explorerAddressUrl");
            expect(currency).to.have.property("explorerTxnIdUrl");

        }
          done();
        }
      });
  });
});

describe("GET /api/currency/getCurrentPrice", () => {
    it("should fetch current prize of the currency", (done) => {
      chai1
        .request("http://localhost:8000")
        .get("/api/currency/getCurrentPrice")
        .query({
            coin:'BTC'
        })
        .end((err, res) => {
          if (err) {
            done(err);
          } else {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.an("object");
            expect(res.body)
              .to.have.property("message")
              .that.equals("Fetch data successfully");
            expect(res.body).to.have.property("data").that.is.an("object");
            expect(res.body.data)
              .to.have.property("Currency")
              .that.is.an("object");
            if (res.body.data.Currency) {
              const currency = res.body.data.Currency;
              expect(currency).to.have.property("_id");
              expect(currency).to.have.property("name");
              expect(currency).to.have.property("symbol");
              expect(currency).to.have.property("precision");
              expect(currency).to.have.property("price");
          }
            done();
          }
        });
    });
  });