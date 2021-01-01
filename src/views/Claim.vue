<template>
  <v-card
    class="d-flex justify-center align-center"
    color="grey lighten-2"
    flat
    height="100%"
  >
    <v-card
      v-if="state.connected"
      elevation="24"
      width="80%"
      color="grey lighten-2"
    >
      <v-card class="d-flex flex-column">
        <v-card-title>
          <v-avatar size="24" class="mr-2">
            <img :src="require('@/assets/logo.png')" alt="DOI" />
          </v-avatar>
          <span class="title font-weight-light">DOI Balance</span>
        </v-card-title>
        <v-card-text>
          <v-row align="center">
            <v-col class="display-3" cols="12">
              {{ state.assets.rewardsBalance }}
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="justify-center">
          <v-btn
            large
            color="primary"
            dark
            width="80%"
            @click="openClaimDialog"
            :disabled="state.assets.rewardsBalance <= 0"
          >
            Claim
          </v-btn>
          <v-dialog v-model="dialog" persistent max-width="80%">
            <v-card>
              <form>
                <v-card-title>
                  <span class="headline">Claim</span>
                </v-card-title>
                <v-card-text>
                  <v-text-field
                    v-model="claimAmount"
                    :error-messages="claimAmountErrors"
                    label="Claim Amount"
                    required
                    @input="$v.claimAmount.$touch()"
                    @blur="$v.claimAmount.$touch()"
                    :autofocus="claimAmountFocus"
                  ></v-text-field>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn @click="close">
                    Close
                  </v-btn>
                  <v-btn
                    color="blue darken-1"
                    class="white--text"
                    @click="submit"
                  >
                    Submit
                  </v-btn>
                </v-card-actions>
              </form>
            </v-card>
          </v-dialog>
        </v-card-actions>
      </v-card>
      <v-card class="d-flex flex-column mt-10 pa-3">
        <v-menu rounded="rounded" offset-y>
          <template v-slot:activator="{ attrs, on }">
            <v-btn
              color="deep-purple darken-4"
              class="white--text"
              v-bind="attrs"
              v-on="on"
              width="100%"
            >
              <span class="d-inline-block text-truncate" style="width: 200px;">
                {{ state.address }}
              </span>
            </v-btn>
          </template>

          <v-list>
            <v-list-item link>
              <v-list-item-title @click="resetApp">
                Disconnect Wallet
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-card>
    </v-card>
    <v-btn v-if="!state.connected" @click="onConnect">Connect Wallet</v-btn>
    <v-overlay z-index="9999" opacity="0.7" :value="state.fetching">
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>
  </v-card>
</template>

<script>
import { validationMixin } from "vuelidate";
import { required, decimal } from "vuelidate/lib/validators";

import Web3 from "web3";
import Web3Modal from "web3modal";
import contract from "truffle-contract";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { getChainData, getContract, formatBalance } from "@/utils/utilities";
import {
  ERC20ContractAddress,
  ClaimContractAddress,
  CHAIN_ID,
  NETWORK_ID
} from "@/constants";

// 引入合约 ABI 文件
import CommunityRewards from "@/constants/contracts/CommunityRewards.json";
// 定义合约变量
const CommunityRewardsContract = contract(CommunityRewards);

const initStats = {
  fetching: false,
  address: "",
  web3: null,
  provider: null,
  connected: false,
  chainId: Number(CHAIN_ID),
  networkId: Number(NETWORK_ID),
  assets: []
};

export default {
  name: "Claim",
  mixins: [validationMixin],
  validations: {
    claimAmount: { required, decimal }
  },
  data: () => ({
    // 定义变量
    dialog: false,
    claimAmountFocus: false,
    claimAmount: undefined,
    // 奖励参数
    state: initStats,
    web3Modal: undefined
  }),
  computed: {
    claimAmountErrors() {
      const errors = [];
      if (!this.$v.claimAmount.$dirty) return errors;
      !this.$v.claimAmount.decimal && errors.push("Invalid amount.");
      !this.$v.claimAmount.required && errors.push("The amount is required.");

      const claimAmountValue = parseFloat(this.$v.claimAmount.$model);
      if (claimAmountValue <= 0) {
        errors.push("The amount is be gt zero.");
      }
      if (claimAmountValue > this.state.assets.rewardsBalance) {
        errors.push("The amount exceeds the balance.");
      }
      return errors;
    }
  },
  methods: {
    openClaimDialog() {
      this.dialog = true;
      this.claimAmountFocus = true;
      this.claimAmount = this.state.assets.rewardsBalance;
    },
    close() {
      this.$v.$reset();
      this.claimAmount = undefined;
      this.dialog = false;
    },
    // 监听钱包事件 OK
    async subscribeProvider(provider) {
      if (!provider.on) {
        return;
      }
      provider.on("close", () => this.resetApp());
      provider.on("accountsChanged", async accounts => {
        const addressState = {
          address: Web3.utils.toChecksumAddress(accounts[0])
        };
        this.state = Object.assign(this.state, addressState);
        await this.getAccountAssets();
      });
      provider.on("chainChanged", async chainId => {
        const { web3 } = this.state;
        const networkId = await web3.eth.net.getId();
        const chainState = { chainId: chainId, networkId: networkId };
        this.state = Object.assign(this.state, chainState);
        await this.getAccountAssets();
      });

      provider.on("networkChanged", async networkId => {
        const { web3 } = this.state;
        const chainId = await web3.eth.chainId();
        const networkState = { chainId: chainId, networkId: networkId };
        this.state = Object.assign(this.state, networkState);
        await this.getAccountAssets();
      });
    },
    // 获取网络配置 OK
    getNetwork() {
      getChainData(this.state.chainId).network;
    },
    // 获取Provider配置 OK
    getProviderOptions() {
      const providerOptions = {
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            infuraId: process.env.VUE_APP_INFURA_ID
          }
        }
      };
      return providerOptions;
    },
    // 获取账号信息
    async getAccountAssets() {
      const { web3, address } = this.state;
      this.state.fetching = true;
      try {
        const ERC20Contract = getContract("ERC20", ERC20ContractAddress, web3);
        const ERC20Balance = await ERC20Contract.balanceOf(address);
        const ClaimContract = getContract("Claim", ClaimContractAddress, web3);
        const rewardsData = await ClaimContract.rewardsInfoByToken(address);

        const assets = {
          ERC20Balance: formatBalance(ERC20Balance),
          rewardsBalance: formatBalance(rewardsData.rewardsAmount)
        };

        const assetsState = {
          fetching: false,
          assets: assets
        };
        this.state = Object.assign(this.state, assetsState);
      } catch (error) {
        const errorState = {
          fetching: false,
          connected: false
        };
        this.state = Object.assign(this.state, errorState);
      }
    },
    // 初始化web3 OK
    initWeb3(provider) {
      const web3 = new Web3(provider);

      web3.eth.extend({
        methods: [
          {
            name: "chainId",
            call: "eth_chainId",
            outputFormatter: web3.utils.hexToNumber
          }
        ]
      });

      return web3;
    },
    // 连接钱包 OK
    async onConnect() {
      const provider = await this.web3Modal.connect();
      await this.subscribeProvider(provider);
      const web3 = this.initWeb3(provider);
      const accounts = await web3.eth.getAccounts();
      const address = Web3.utils.toChecksumAddress(accounts[0]);
      const networkId = await web3.eth.net.getId();
      const chainId = await web3.eth.chainId();

      const connectedState = {
        web3,
        provider,
        connected: true,
        address,
        chainId,
        networkId
      };
      this.state = Object.assign(this.state, connectedState);
      await this.getAccountAssets();
    },
    // 重置钱包连接 OK
    async resetApp() {
      const { web3 } = this.state;
      if (web3 && web3.currentProvider && web3.currentProvider.close) {
        await web3.currentProvider.close();
      }
      this.web3Modal.clearCachedProvider();
      const nullStats = {
        fetching: false,
        address: "",
        web3: null,
        provider: null,
        connected: false,
        chainId: 1,
        networkId: 1,
        assets: []
      };
      this.state = nullStats;
    },
    // 提币 TODO OK
    submit() {
      this.$v.$touch();
      if (this.$v.$invalid) {
        // error info
      } else {
        // do your submit logic here
        const { web3, address } = this.state;
        this.state.fetching = true;
        this.dialog = false;
        // 处理额度
        const claimAmount = Web3.utils.toWei(
          this.claimAmount.toString(),
          "ether"
        );
        // 执行合约
        CommunityRewardsContract.setProvider(web3.currentProvider);
        CommunityRewardsContract.at(
          Web3.utils.toChecksumAddress(ClaimContractAddress)
        )
          .then(instance => {
            instance
              .claim(claimAmount, { from: address })
              .then(() => {
                this.getAccountAssets();
              })
              .catch(e => {
                console.info(e);
              });
          })
          .catch(e => {
            console.info(e);
          })
          .then(() => {
            this.state.fetching = false;
          });
      }
    }
  },
  mounted() {
    this.web3Modal = new Web3Modal({
      network: this.getNetwork(),
      cacheProvider: true,
      providerOptions: this.getProviderOptions()
    });
    if (!this.web3Modal.cachedProvider) {
      this.onConnect();
    }
  },
  watch: {
    web3Modal: function(web3) {
      if (web3 && web3.currentProvider && web3.currentProvider.close) {
        this.state.connected = false;
      } else {
        this.onConnect();
      }
    }
  }
};
</script>
