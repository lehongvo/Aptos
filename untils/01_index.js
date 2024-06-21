const dotenv = require('dotenv');
dotenv.config();

const {
    Account,
    Aptos,
    AptosConfig,
    Network,
    SigningSchemeInput,
} = require("@aptos-labs/ts-sdk");

const getAccount = () => {
    try {
        const wallet = {
            address: "0x8549fd85ef6509f212b306ae3d265049f6ddb2ac8b016e02b8c1882615f38a5a",
            mnemonic: "post smile shy bubble history broccoli relief clump sketch brisk uphold coast",
            path: "m/44'/637'/0'/0'/0'",
            privateKey: "0x7051661af86713f98a9acdec8376540706036f3d300344845e055b2687a5e2a0",
            publicKey: "0xea526ba1710343d953461ff68641f1b7df5f23b9042ffa2d2a798d3adb3f3d6c",
        };
        const { mnemonic, path } = wallet;
        const account = Account.fromDerivationPath({
            path,
            mnemonic,
            scheme: SigningSchemeInput.Ed25519,
        });
        return account;
    } catch (error) {
        console.log(error);
    }
};

const initializeCoin = async () => {
    try {
        const account = getAccount();
        const APTOS_NETWORK = Network.DEVNET;
        const aptosConfig = new AptosConfig({ network: APTOS_NETWORK });
        const aptos = new Aptos(aptosConfig);

        const rawTx = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${account.accountAddress}::token_erc20::initialize`,
                functionArguments: [],
            }
        });

        const pendingTxn = await aptos.signAndSubmitTransaction({
            signer: account,
            transaction: rawTx,
        });

        const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
        console.log("Transaction hash: ", response.hash);
    } catch (error) {
        console.log(error);
    }
};

initializeCoin();