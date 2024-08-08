import Web3, { Contract } from "web3";
import contrcatAbi from "../contract/contractabi";


class RpcHandler {
  static instance = null;
  web3: Web3 = null;

  // need to implement the contract abi
  contract: Contract<any>;
  constructor() {
    if (!RpcHandler.instance) {
      this.web3 = null;
      RpcHandler.instance = this;
    }
    return RpcHandler.instance;
  }

  createRpcConnection = async () => {
    try {
      const wsProvider = new Web3.providers.WebsocketProvider(
        process.env.SOCKET_HOST
      );
      this.web3 = new Web3(wsProvider);
      console.log("RPC connection created successfully");
      return true;
    } catch (err) {
      console.error("Error creating RPC connection:", err);
      return false;
    }
  };

  releaseRpcConnection = () => {
    if (this.web3 && this.web3.currentProvider) {
      this.web3.currentProvider.disconnect();
      console.log("RPC connection released successfully");
    }
  };

  getContractInstance = () => {
    if (!this.web3) {
      throw new Error("Websocket connection to node not established.");
    }

    const contractAddress = process.env.CONTRACTADDRESS;    
    if(!this.contract) this.contract = new this.web3.eth.Contract(contrcatAbi, contractAddress);
    return this.contract;
  };
}

const rpcHandlerInstance = new RpcHandler();
export default rpcHandlerInstance;
