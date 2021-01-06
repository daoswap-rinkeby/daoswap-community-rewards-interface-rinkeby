import ERC20_CONTRACT from "./contracts/ERC20FixedSupply.json";
import CLAIM_CONTRACT from "./contracts/CommunityRewards.json";

export { ERC20_CONTRACT, CLAIM_CONTRACT };

// export const ERC20ContractAddress =
//   "0x29Ac4ed3Ad8457B6Fb75B336D688C9094AD08B4b";

export const ERC20ContractAddress =
  "0xdb5D970F03bfD19c1E51D57BcEd114BC35A0808f";

export const ClaimContractAddress =
  "0x45124D309d8d5D47B5A3E77dBaf28f05f9d98192";

// export const ClaimContractAddress =
//   "0xd2f169c79553654452a3889b210AEeF494eB2374";

export const CHAIN_ID = process.env.VUE_APP_CHAIN_ID || 1;

export const NETWORK_ID = process.env.VUE_APP_NETWORK_ID || 1;
