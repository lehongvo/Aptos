const {
    Account,
    Aptos,
    AptosConfig,
    Network,
    SigningSchemeInput,
    U64,
    AccountAddress,
    Ed25519PrivateKey,
    APTOS_COIN
} = require("@aptos-labs/ts-sdk");
const dotenv = require('dotenv');
dotenv.config();


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

        let whileList = [
            process.env.PRIVATE_KEY_DEPLOY,
            process.env.PUBLIC_KEY_DEPLOY
        ];

        const rawTx = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${account.accountAddress}::titan_power_erc20::initialize`,
                functionArguments: [whileList],
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
            function: `${contractAddress}::titan_power_erc20::is_account_registered`,
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
        const account = getAccount();

        const contractAddress = AccountAddress.from(process.env.PUBLIC_KEY_DEPLOY);

        const aptos = getAptos();

        const result = await isAccountRegistered(contractAddress, (account.accountAddress).toString(), aptos);

        if (!result[0]) {
            const rawTx = await aptos.transaction.build.simple({
                sender: account.accountAddress,
                data: {
                    function: `${(contractAddress).toString()}::titan_power_erc20::register`,
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

        const payload = {
            function: `${account.accountAddress}::titan_power_erc20::is_in_whitelist`,
            functionArguments: [AccountAddress.from(process.env.PUBLIC_KEY_DEPLOY)]
        }

        const result = await aptos.view({ payload });
        if (!result[0]) {
            await update_while_list(AccountAddress.from(process.env.PUBLIC_KEY_DEPLOY));
        }

        const rawTx = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${account.accountAddress}::titan_power_erc20::mint`,
                functionArguments: [
                    AccountAddress.from(process.env.PUBLIC_KEY_DEPLOY),
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

const update_while_list = async (accountPuc) => {
    try {
        const account = getAccount();
        const aptos = getAptos();

        const rawTx = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${account.accountAddress}::titan_power_erc20::update_whitelist`,
                functionArguments: [accountPuc, true],
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

const balanceOfAddress = async (aptos, contractAddressPublic, balanceToAddress) => {
    try {
        const accountResources = await aptos.getAccountResources({
            accountAddress: balanceToAddress,
        });

        const tokenType = `${contractAddressPublic}::titan_power_erc20::UserCoin`;
        const resourceType = `0x1::coin::CoinStore<${tokenType}>`;
        const coinStoreResource = accountResources.find(
            resource => resource.type === resourceType
        );
        if (!coinStoreResource) {
            throw new Error("Resource not found");
        }
        return coinStoreResource.data.coin;
    } catch (error) {
        console.error("Error fetching balance:", error);
    }
}

const getTokenInfo = async (aptos, contractAddress) => {
    try {
        const account = contractAddress;
        if (!account || !account.accountAddress) {
            throw new Error("Invalid account or account address");
        }

        const resourceType = `${account.accountAddress}::titan_power_erc20::UserCoin`;

        const resource = await aptos.getAccountResource({
            accountAddress: account.accountAddress,
            resourceType: "0x1::coin::CoinInfo<" + resourceType + ">"
        });

        return resource
    } catch (error) {
        console.error("Error fetching token info:", error);
        if (error.message.includes("Invalid account or account address")) {
            console.log("Please check your account configuration in the .env file");
        }
    }
}

const transferToken = async (fromPrivateAddress, fromPublicAddress, toPublicAddress, amount) => {
    try {
        const aptos = getAptos();
        const contractPublic = getAccount();
        const signer = Account.fromPrivateKey({
            privateKey: new Ed25519PrivateKey(fromPrivateAddress),
            address: AccountAddress.from(fromPublicAddress)
        });

        while (true) {

            const isAccountRegisteredFrom = await isAccountRegistered(contractPublic.accountAddress, signer.accountAddress.toString(), aptos);
            if (!isAccountRegisteredFrom[0]) {
                throw new Error("Sender not registered");
            }

            const isAccountRegisteredTo = await isAccountRegistered(contractPublic.accountAddress, AccountAddress.from(toPublicAddress).toString(), aptos);

            if (!isAccountRegisteredTo[0]) {
                throw new Error("Receiver not registered");
            }

            const resource = await getTokenInfo(aptos, contractPublic);
            const amountInSmallestUnit = Math.round(Number(amount) * (10 ** resource.decimals));
            const currentAmount = BigInt(amountInSmallestUnit);
            let fromBalance = await balanceOfAddress(aptos, contractPublic.accountAddress, fromPublicAddress);
            fromBalance = BigInt(fromBalance.value);

            if (fromBalance < currentAmount) {
                throw new Error(`Insufficient balance. Required: ${currentAmount}, Available: ${fromBalance}`);
            }

            const payload = {
                function: "0x1::aptos_account::transfer_coins",
                typeArguments: [`${contractPublic.accountAddress}::titan_power_erc20::UserCoin`],
                functionArguments: [AccountAddress.from(toPublicAddress).toString(), currentAmount.toString()],
            };

            const rawTx = await aptos.transaction.build.simple({
                sender: signer.accountAddress,
                data: payload
            });

            const pendingTxn = await aptos.signAndSubmitTransaction({
                signer: signer,
                transaction: rawTx,
            });

            const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
            if (!response.success) {
                console.error("Transaction failed. Details:", JSON.stringify(response, null, 2));
                throw new Error(`Transaction ${response.hash} failed: ${response.vm_status}`);
            }
            console.log("Transaction successful. Hash:", response.hash);
        }
    } catch (error) {
        console.error("Transfer failed:", error.message);
        if (error.response && error.response.data) {
            console.error("API error details:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

const approveToken = async (fromPrivateAddress, fromPublicAddress, toPublicAddress, amount) => {
    try {
        const aptos = getAptos();
        const contractPublic = getAccount();
        const signer = Account.fromPrivateKey({
            privateKey: new Ed25519PrivateKey(fromPrivateAddress),
            address: AccountAddress.from(fromPublicAddress)
        });

        // Check if the contract account is initialized
        const isContractInitialized = await isAccountRegistered(contractPublic.accountAddress, contractPublic.accountAddress.toString(), aptos);
        if (!isContractInitialized[0]) {
            throw new Error("Contract not initialized");
        }

        const isAccountRegisteredFrom = await isAccountRegistered(contractPublic.accountAddress, signer.accountAddress.toString(), aptos);
        if (!isAccountRegisteredFrom[0]) {
            throw new Error("Sender not registered");
        }

        const isAccountRegisteredTo = await isAccountRegistered(contractPublic.accountAddress, AccountAddress.from(toPublicAddress).toString(), aptos);
        if (!isAccountRegisteredTo[0]) {
            throw new Error("Receiver not registered");
        }

        const resource = await getTokenInfo(aptos, contractPublic);
        const amountInSmallestUnit = Math.round(Number(amount) * (10 ** resource.decimals));
        const currentAmount = BigInt(amountInSmallestUnit);

        const rawTx = await aptos.transaction.build.simple({
            sender: signer.accountAddress,
            data: {
                function: `${contractPublic.accountAddress}::titan_power_erc20::approve`,
                functionArguments: [
                    AccountAddress.from(toPublicAddress).toString(),
                    new U64(currentAmount)
                ],
                typeArguments: [],
            }
        });

        const pendingTxn = await aptos.signAndSubmitTransaction({
            signer: signer,
            transaction: rawTx,
        });

        const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
        if (!response.success) {
            console.error("Transaction failed. Details:", JSON.stringify(response, null, 2));
            throw new Error(`Transaction ${response.hash} failed: ${response.vm_status}`);
        }
        console.log("Transaction successful. Hash:", response.hash);
    } catch (error) {
        console.error("Error in approveToken:", error.message);
        if (error.message.includes("Invalid account or account address")) {
            console.log("Please check your account configuration in the .env file");
        }
    }
}

approveToken(
    process.env.PRIVATE_KEY_DEPLOY,
    process.env.PUBLIC_KEY_DEPLOY,
    process.env.PUBLIC_KEY_DEPLOY_USER3,
    "0.01"
)

// transferToken(
//     "0x873f52eaa344ce6d5737ae5da42a441e8543de916c3f4842e6116505d4a558c6",
//     "0x344222e045c7ac184f6ff54f6449a79f7ebae5f3a882bd1e31315a2dc916deb7",
//     "0x07968dab936c1bad187c60ce4082f307d030d780e91e694ae03aef16aba73f30",
//     "0.01"
// )
// initializeCoin();
// register();
// mint();
// update_while_list()