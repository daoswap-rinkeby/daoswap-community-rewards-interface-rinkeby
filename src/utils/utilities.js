import { ethers } from "ethers";
import supportedChains from "./chain";
import { ERC20_CONTRACT as ERC20, CLAIM_CONTRACT as Claim } from "../constants";

const CONTRACTS = {
  ERC20,
  Claim
};

export function getChainData(chainId) {
  const chainData = supportedChains.filter(
    chain => chain.chain_id === chainId
  )[0];

  if (!chainData) {
    throw new Error("ChainId missing or not supported");
  }

  const API_KEY = process.env.VUE_APP_INFURA_ID;

  if (
    chainData.rpc_url.includes("infura.io") &&
    chainData.rpc_url.includes("%API_KEY%") &&
    API_KEY
  ) {
    const rpcUrl = chainData.rpc_url.replace("%API_KEY%", API_KEY);

    return {
      ...chainData,
      rpc_url: rpcUrl
    };
  }

  return chainData;
}

export function ellipseAddress(address, width = 10) {
  return `${address.slice(0, width)}...${address.slice(-width)}`;
}

export const formatBalance = (value, decimals = 18, maxFraction = 0) => {
  const formatted = ethers.utils.formatUnits(value, decimals);
  if (maxFraction > 0) {
    const split = formatted.split(".");
    if (split.length > 1) {
      return split[0] + "." + split[1].substr(0, maxFraction);
    }
  }
  return formatted;
};

export const parseBalance = (value, decimals = 18) => {
  return ethers.utils.parseUnits(value || "0", decimals);
};

// 数字转金额格式
export const formatNumber = s => {
  s = s.toString();
  if (/[^0-9\\.]/.test(s)) return "invalid value";
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const getContract = (name, address, web3) => {
  const provider = new ethers.providers.Web3Provider(web3.currentProvider);
  const signer = provider.getSigner();
  const contract = CONTRACTS[name];
  return new ethers.Contract(address, contract.abi, signer);
};
