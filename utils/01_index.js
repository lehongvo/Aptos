const dotenv = require('dotenv');
dotenv.config();

const {
    Account,
    Aptos,
    AptosConfig,
    Network,
    SigningSchemeInput,
    U64,
    AccountAddress,
    Ed25519PrivateKey
} = require("@aptos-labs/ts-sdk");

const getAccount = () => {
    try {
        return Account.fromPrivateKey({
            privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEY_DEPLOY),
            address: AccountAddress.from(process.env.PUBLIC_KEY_DEPLOY)
        });;
    } catch (error) {
        console.log(error);
    }
};

const getAptos = () => {
    try {
        const APTOS_NETWORK = Network.DEVNET;
        const aptosConfig = new AptosConfig({ network: APTOS_NETWORK });
        const aptos = new Aptos(aptosConfig);
        return aptos;
    } catch (error) {
        console.log(error);
    }
}

const initializeCoin = async () => {
    try {
        const account = getAccount();

        const aptos = getAptos();

        const rawTx = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${account.accountAddress}::token::initialize`,
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

const isAccountRegistered = async (contractAddress, checkAtAccount, aptos) => {
    try {
        const payload = {
            function: `${contractAddress}::token::is_account_registered`,
            functionArguments: [checkAtAccount]
        };
        const result = await aptos.view({ payload });
        return result;
    } catch (error) {
        console.log(error);
    }
}

const register = async () => {
    try {
        const account = Account.fromPrivateKey({
            privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEY_DEPLOY_USER),
            address: AccountAddress.from(process.env.PUBLIC_KEY_DEPLOY_USER)
        });;

        const contractAddress = AccountAddress.from(process.env.PUBLIC_KEY_DEPLOY);

        const aptos = getAptos();

        const result = await isAccountRegistered(contractAddress, (account.accountAddress).toString(), aptos);

        if (!result[0]) {
            const rawTx = await aptos.transaction.build.simple({
                sender: account.accountAddress,
                data: {
                    function: `${(contractAddress).toString()}::token::register`,
                    functionArguments: [],
                }
            });
            const pendingTxn = await aptos.signAndSubmitTransaction({
                signer: account,
                transaction: rawTx,
            });
            const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
            console.log("---------------Transaction hash:", response.hash);
        } else {
            console.log("Account already registered");
        }
    } catch (error) {
        console.log(error);
    }
}

const mint = async () => {
    try {
        const account = getAccount();

        const aptos = getAptos();

        const rawTx = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${account.accountAddress}::token::mint`,
                functionArguments: [
                    AccountAddress.from(process.env.PUBLIC_KEY_DEPLOY_USER),
                    new U64(process.env.AMOUNT_TO_MINT)
                ],
            }
        });

        const pendingTxn = await aptos.signAndSubmitTransaction({
            signer: account,
            transaction: rawTx,
        });
        const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
        console.log("---------------Transaction hash:", response.hash);
    } catch (error) {
        console.log(error);
    }
}

// initializeCoin();
// register();
// mint();