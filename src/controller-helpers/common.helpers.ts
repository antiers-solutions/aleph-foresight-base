import Web3 from "web3";
import contractAbi from "../contract/contractabi";
import redisHelper from "../helpers/redis.helper";
import { RESPONSE_MESSAGES, STATUS_CODES } from "../constants";
const wsProvider = new Web3.providers.WebsocketProvider(
  process.env.SOCKET_HOST
);
const web3 = new Web3(wsProvider);
const contractAddress = process.env.CONTRACTADDRESS;
const contract = new web3.eth.Contract(contractAbi, contractAddress);

/**
 * Validates and calculates pagination parameters.
 * @param {number} page - The requested page number.
 * @param {number} limit - The requested limit per page.
 * @param {number} defaultLimit - The default limit if the provided limit is invalid.
 * @returns {{ validatedPage: number, validatedLimit: number, skip: number, limitValue: number }}
 */
const getPaginationParams = (
  page: number,
  limit: number,
  defaultLimit = 10
) => {
  const validatedPage = Math.max(1, page); // Ensure page is at least 1
  const validatedLimit = limit > 0 ? limit : defaultLimit; // Ensure limit is at least defaultLimit
  const skip = ((page || 1) - 1) * limit;
  const limitValue = validatedLimit;
  return {
    validatedPage,
    validatedLimit,
    skip,
    limitValue,
  };
};
/**
 * get admin address from the contract
 * @returns admin address
 */
const getAdminAddress = async () => {
  try {
    const adminAddress = await contract.methods.read_admin_address().call();
    return adminAddress;
  } catch (error) {
    throw new Error(RESPONSE_MESSAGES.ADMINNOTFOUND);
  }
};
/**
 * Check if token is expired
 * @param {string} token - The token to check.
 * @returns {boolean}
 */
async function isTokenExpired(token) {
  const value = JSON.parse(await redisHelper.client.get(token));

  return value ? false : true;
}
/**
 * Calculates gross payout and net payout
 * @param amount
 * @param odds
 * @param platformFees
 * @returns {grossPayout, netPayout}
 */
const calculatePayout = (
  amount: number,
  odds: number,
  platformFees: number
) => {
  const grossPayout = (amount * (odds / 100)) / 10 ** 18;
  const reward = grossPayout - amount / 10 ** 18;
  const deductionFees = reward * (platformFees / 100);
  const netPayout = grossPayout - deductionFees;
  return { grossPayout, netPayout };
};

const RESPONSE = {
  USER_NOT_FOUND: {
    error: false,
    data: null,
    status: STATUS_CODES.SUCCESS,
    message: RESPONSE_MESSAGES.DATA_NOT_FOUND,
  },
  INTERNAL_SERVER_ERROR: {
    error: true,
    status: STATUS_CODES.INTERNALSERVER,
    message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR,
  },
  DATA_NOT_FOUND: {
    error: false,
    data: null,
    status: STATUS_CODES.NOTFOUND,
    message: RESPONSE_MESSAGES.DATA_NOT_FOUND,
  },
};

module.exports = {
  getPaginationParams,
  getAdminAddress,
  RESPONSE,
  isTokenExpired,
  calculatePayout,
};
