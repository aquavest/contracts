import { USDC_CONTRACT_ADDRESS } from "../helpers/constants";
import { TOKEN_NAME, TOKEN_SYMBOL } from "./constants";

const EXCHANGE_RATE = BigInt(10 ** 12);

module.exports = [
  TOKEN_NAME,
  TOKEN_SYMBOL,
  USDC_CONTRACT_ADDRESS,
  EXCHANGE_RATE,
];
