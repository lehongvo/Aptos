const dotenv = require('dotenv');
dotenv.config()

const {
    Account,
    Aptos,
    AptosConfig,
    parseTypeTag,
    NetworkToNetworkName,
    Network,
    AccountAddress,
    U64,
    Ed25519PrivateKey,
    SigningSchemeInput
} = require("@aptos-labs/ts-sdk");

const { AptosAccount } = require("aptos");

const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const COIN_STORE = `0x1::coin::CoinStore<${APTOS_COIN}>`;
const INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 100;
const TRANSFER_AMOUNT = 100;

const balanceOfAddress = async (sdk, address) => {
    let balance = await sdk.getAccountResource({ accountAddress: address, resourceType: COIN_STORE });
    let amount = Number(balance.coin.value);
    return amount;
};

const getAptosSkd = () => {
    try {
        const network = process.env.DEVNET;
        const config = new AptosConfig(network);
        const sdk = new Aptos(config);
        return sdk;
    } catch (error) {
        console.log(error)
    }
}

const fundAccountAct = async (skd, account) => {
    try {
        const fundTx = await skd.fundAccount({
            accountAddress: account,
            amount: INITIAL_BALANCE,
        })
        return fundTx;
    } catch (error) {
        console.log(error)
    }
}

const main = async (wallet, toAddress, amountTransfer) => {
    try {
        while (true) {
            console.log("---------------------------------")
            const sdk = getAptosSkd();
            const { mnemonic, address, path } = wallet;
            const account = Account.fromDerivationPath({
                path,
                mnemonic,
                scheme: SigningSchemeInput.Ed25519,
            });
            amountTransfer = amountTransfer * 1e8;

            const balanceFrom = await balanceOfAddress(sdk, account.accountAddress);
            console.log(`Balance is: ${balanceFrom / 1e8}\n`);

            const balanceTo = await balanceOfAddress(sdk, toAddress);
            console.log(`Balance is: ${balanceTo / 1e8}\n`);

            if (balanceFrom > amountTransfer) {
                throw new Error("Balance not enough")
            }

            const txn = await sdk.transaction.build.simple({
                sender: account.accountAddress,
                data: {
                    function: "0x1::coin::transfer",
                    typeArguments: [parseTypeTag(APTOS_COIN)],
                    functionArguments: [AccountAddress.from(toAddress), new U64(TRANSFER_AMOUNT)],
                },
            });

            let committedTxn = await sdk.signAndSubmitTransaction({ signer: account, transaction: txn });
            console.log(`Committed transaction: ${committedTxn.hash}`);
            await sdk.waitForTransaction({ transactionHash: committedTxn.hash });


            const balanceFromAfter = await balanceOfAddress(sdk, account.accountAddress);
            console.log(`Balance is: ${balanceFromAfter / 1e8}\n`);

            const balanceToAfter = await balanceOfAddress(sdk, toAddress);
            console.log(`Balance is: ${balanceToAfter / 1e8}\n`);
        }
    } catch (error) {
        console.log(error)
    }
}

// const wallet = {
//     address: "0x8549fd85ef6509f212b306ae3d265049f6ddb2ac8b016e02b8c1882615f38a5a",
//     mnemonic: "post smile shy bubble history broccoli relief clump sketch brisk uphold coast",
//     path: "m/44'/637'/0'/0'/0'",
//     privateKey: "0x7051661af86713f98a9acdec8376540706036f3d300344845e055b2687a5e2a0",
//     publicKey: "0xea526ba1710343d953461ff68641f1b7df5f23b9042ffa2d2a798d3adb3f3d6c",
// };

// main(
//     wallet,
//     "0xd88e3752572b2356e3caf944ae3e627c03e1f8a451b2868c2f71e3be69773600",
//     "0x344222e045c7ac184f6ff54f6449a79f7ebae5f3a882bd1e31315a2dc916deb7",
//     1
// )