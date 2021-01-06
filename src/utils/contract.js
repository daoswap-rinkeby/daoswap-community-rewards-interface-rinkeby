import Web3 from "web3";
import contract from "truffle-contract";
import { ERC20_CONTRACT as ERC20, CLAIM_CONTRACT as Claim } from "../constants";

const CONTRACTS = {
  ERC20,
  Claim
};

export const getContract = (name, address, web3) => {
  const contractJson = CONTRACTS[name];
  // 定义合约变量
  const readContract = contract(contractJson);
  readContract.setProvider(web3.currentProvider);
  return readContract.at(address);
};

/**
 * format amount
 * @param {(string|number)} amount
 * @param {number} decimals
 * @returns {number | null}
 */
export const formatAmount = (amount, decimals) => {
  const decimalsValue = decimals || 18;
  return Web3.utils.BN(amount).toString() / Math.pow(10, decimalsValue);
};
