const {
    Account,
    AccountAddress,
    Aptos,
    AptosConfig,
    Network,
    NetworkToNetworkName,
    Ed25519PrivateKey,
    U64
} = require("@aptos-labs/ts-sdk");
const { execSync } = require("child_process");
const dotenv = require('dotenv');
dotenv.config();
const path = require('path');
const fs = require('fs');

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

const compilePackage = async (
    packageDir,
    outputFile,
    namedAddresses
) => {
    try {
        execSync("aptos --version");

        const addressArg = namedAddresses.map(({ name, address }) => `${name}=${address}`).join(" ");
        const compileCommand = `aptos move build-publish-payload --json-output-file ${outputFile} --package-dir ${packageDir} --named-addresses ${addressArg} --assume-yes`;
        console.log(compileCommand);
        execSync(compileCommand);
    } catch (error) {
        console.log(error);
    }
}

const getPackageBytesToPublish = (filePath) => {
    const cwd = process.cwd();
    const modulePath = path.join(cwd, filePath);

    const jsonData = JSON.parse(fs.readFileSync(modulePath, "utf8"));

    const metadataBytes = jsonData.args[0].value;
    const byteCode = jsonData.args[1].value;

    return { metadataBytes, byteCode };
}

const getFaBalance = async (owner, assetType, aptos) => {
    const data = await aptos.getCurrentFungibleAssetBalances({
        options: {
            where: {
                owner_address: { _eq: owner.accountAddress.toStringLong() },
                asset_type: { _eq: assetType },
            },
        },
    });

    return data[0]?.amount ?? 0;
};

const getMetadata = async (aptos, admin) => {
    const payload = {
        function: `${admin.accountAddress}::titan_power_nft_v1::get_metadata`,
        functionArguments: [],
    };
    const res = await aptos.view({ payload });
    return res[0].inner;
    // return res.inner;
}

const freezeTransaction = async (admin, targetAddress) => {
    try {
        const aptos = getAptos();
        const rawTx = await aptos.transaction.build.simple({
            sender: admin.accountAddress,
            data: {
                function: `${admin.accountAddress}::titan_power_nft_v1::freeze_account`,
                functionArguments: [
                    targetAddress.accountAddress
                ],
            }
        });
        const pendingTxn = await aptos.signAndSubmitTransaction({
            signer: admin,
            transaction: rawTx,
        });
        await aptos.waitForTransaction({
            transactionHash: pendingTxn.hash,
        });
        return pendingTxn.hash;
    } catch (error) {
        console.log(error)
    }
}

const mintCoin = async (admin, receiver, amount) => {
    try {
        const aptos = getAptos();
        const rawTx = await aptos.transaction.build.simple({
            sender: admin.accountAddress,
            data: {
                function: `${admin.accountAddress}::titan_power_nft_v1::mint`,
                functionArguments: [
                    AccountAddress.from(receiver.accountAddress),
                    new U64(amount),
                ],
            }
        });
        const pendingTxn = await aptos.signAndSubmitTransaction({
            signer: admin,
            transaction: rawTx,
        });
        await aptos.waitForTransaction({
            transactionHash: pendingTxn.hash,
        });
        return pendingTxn.hash;
    } catch (error) {
        console.log(error)
    }
}

const transferCoin = async (admin, fromAddress, toAddress, amount) => {
    try {
        const aptos = getAptos();
        const rawTx = await aptos.transaction.build.simple({
            sender: admin.accountAddress,
            data: {
                function: `${admin.accountAddress}::titan_power_nft_v1::transfer`,
                functionArguments: [
                    AccountAddress.from(fromAddress.accountAddress),
                    AccountAddress.from(toAddress.accountAddress),
                    new U64(amount),
                ],
            }
        });
        const pendingTxn = await aptos.signAndSubmitTransaction({
            signer: admin,
            transaction: rawTx,
        });
        await aptos.waitForTransaction({
            transactionHash: pendingTxn.hash,
        });
        return pendingTxn.hash;
    } catch (error) {
        console.log(error)
    }
}

const normalTransferCoin = async (sender, toAccount, amount) => {
    try {
        const aptos = getAptos();
        const transferFundibleAssetRawTransaction = await aptos.transferFungibleAsset({
            sender: sender,
            fungibleAssetMetadataAddress: AccountAddress.from(metadataAddress),
            recipient: AccountAddress.from(toAccount.accountAddress),
            account: amount
        })

        const pendingTxn = await aptos.signAndSubmitTransaction({
            signer: sender,
            transaction: transferFundibleAssetRawTransaction
        });
        await aptos.waitForTransaction({
            transactionHash: pendingTxn.hash,
        });
        return pendingTxn.hash;
    } catch (error) {
        console.log(error)
    }
}

const burnCoin = async (admin, receiver, amount) => {
    try {
        const aptos = getAptos();
        const rawTx = await aptos.transaction.build.simple({
            sender: admin.accountAddress,
            data: {
                function: `${admin.accountAddress}::titan_power_nft_v1::burn`,
                functionArguments: [
                    AccountAddress.from(receiver.accountAddress),
                    new U64(amount),
                ],
            }
        });
        const pendingTxn = await aptos.signAndSubmitTransaction({
            signer: admin,
            transaction: rawTx,
        });
        await aptos.waitForTransaction({
            transactionHash: pendingTxn.hash,
        });
        return pendingTxn.hash;
    } catch (error) {
        console.log(error)
    }
}

const deployHelloCanadoToken = async () => {
    try {
        const aptos = getAptos();

        const alice = Account.generate();
        const bob = Account.generate();
        const charlie = Account.generate();

        await Promise.all([
            aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 }),
            aptos.fundAccount({ accountAddress: bob.accountAddress, amount: 100_000_000 }),
            aptos.fundAccount({ accountAddress: charlie.accountAddress, amount: 100_000_000 }),
        ])

        const account = Account.fromPrivateKey({
            privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEY_DEPLOY),
            address: AccountAddress.from(process.env.PUBLIC_KEY_DEPLOY)
        });

        // console.log("====account", account.accountAddress.toString());
        // console.log("\n=== Compiling TitanPowerNFT package locally ===");
        // compilePackage(
        //     "move/titanPowerNFTv1",
        //     "move/titanPowerNFTv1/titanPowerNFTv1.json",
        //     [{ name: "TitanPowerNFTv1", address: account.accountAddress }]
        // );

        // const { metadataBytes, byteCode } = getPackageBytesToPublish("move/TitanPowerNFTv1/TitanPowerNFTv1.json");
        // console.log(metadataBytes, byteCode);
        // console.log(`\n=== Publishing TitanPowerNFTv1 package to ${aptos.config.network} network ===`);

        // const transaction = await aptos.publishPackageTransaction({
        //     account: account.accountAddress,
        //     metadataBytes,
        //     moduleBytecode: byteCode,
        // });
        // console.log("\nFinished compiling and publishing TitanPowerNFT package");

        // const pendingTransaction = await aptos.signAndSubmitTransaction({
        //     signer: account,
        //     transaction,
        // });
        // console.log("\nFinished deploying TitanPowerNFT package");

        // await aptos.waitForTransaction({ transactionHash: pendingTransaction.hash });
        // console.log(`Publish package transaction hash: ${pendingTransaction.hash}`);

        const metadataAddress = await getMetadata(aptos, account);
        console.log(`metadataAddress: ${metadataAddress}`);

        console.log("All the balances in this exmaple refer to balance in primary fungible stores of each account.");
        console.log(`Alice's initial Coin balance: ${await getFaBalance(alice, metadataAddress, aptos)}.`);
        console.log(`Bob's initial FACoin balance: ${await getFaBalance(bob, metadataAddress, aptos)}.`);
        console.log(`Charlie's initial balance: ${await await getFaBalance(charlie, metadataAddress, aptos)}.`);

        console.log("Alice mints charlie 100 coins")
        const mintCoinTransactionHash = await mintCoin(account, charlie, 100);
        console.log(`mintCoinTransactionHash: ${mintCoinTransactionHash}`);

        console.log(`Charlie's new balance: ${await await getFaBalance(charlie, metadataAddress, aptos)}.`);

        console.log("Alice freezes Bob's account.");
        const freezeAccountTransaction = await freezeTransaction(account, bob);
        console.log(`freezeAccountTransaction: ${freezeAccountTransaction}`);

        console.log(
            "Alice as the admin forcefully transfers the newly minted coins of Charlie to Bob ignoring that Bob's account is frozen.",
        );
        const transferCoinTransactionHash = await transferCoin(account, charlie, bob, 100);
        console.log(`transferCoinTransactionHash: ${transferCoinTransactionHash}`);
        console.log(`Bob's updated FACoin balance: ${await getFaBalance(bob, metadataAddress, aptos)}.`);

        console.log("Alice burns 50 coins from Bob.");
        const burnCoinTransactionHash = await burnCoin(account, bob.accountAddress, 50);
        console.log(`burnCoinTransactionHash: ${burnCoinTransactionHash}`);

        console.log("Bob transfers 10 coins to Alice as the owner.");
        const transferFungibleAssetRawTransaction = await normalTransferCoin(bob, alice, 10);
        console.log(`transferFungibleAssetRawTransaction: ${transferFungibleAssetRawTransaction}`);
    } catch (error) {
        console.log(error);
    }
}

deployHelloCanadoToken()



const exampleCreateNewCollection = async () => {
    try {
        const collectionName = "Example Collection";
        const collectionDescription = "Example description.";
        const collectionURI = "aptos.dev";

        const aptos = new Aptos();
        const alice = Account.fromPrivateKey({
            privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEY_DEPLOY_USER1),
            address: AccountAddress.from(process.env.PUBLIC_KEY_DEPLOY_USER1)
        });

        const createCollectionTransaction = await aptos.createCollectionTransaction({
            creator: alice,
            description: collectionDescription,
            name: collectionName,
            uri: collectionURI,
        });

        console.log("\n=== Create the collection ===\n");
        const committedTxn = await aptos.signAndSubmitTransaction({
            signer: alice,
            transaction: createCollectionTransaction
        });
        const pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
        console.log(`Create collection transaction hash: ${pendingTxn.hash}`);

        const alicesCollection = await aptos.getCollectionData({
            creatorAddress: alice.accountAddress,
            collectionName,
            minimumLedgerVersion: BigInt(4212275),
        });
        console.log(`Alice's collection: ${JSON.stringify(alicesCollection, null, 4)}`);

        const toAddress = AccountAddress.from("0xd5f021cfbd78705f6e3fc5af2ab0ef20b80ee57c5aef8003d2b996d006e35b27");

        // const tokenName = "Example Asset";
        // const tokenDescription = "Example asset description.";
        // const tokenURI = "https://clonex-assets.rtfkt.com";
        // console.log("\n=== Alice Mints the digital asset ===\n");

        // let indexV = 100;
        // while (true) {
        //     const tokenURIIndex = `${tokenURI}/${indexV}`
        //     const mintTokenTransaction = await aptos.mintDigitalAssetTransaction({
        //         creator: alice,
        //         collection: collectionName,
        //         description: tokenDescription,
        //         name: tokenName,
        //         uri: tokenURIIndex,
        //     });
        //     committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: mintTokenTransaction });
        //     pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
        //     console.log(`Mint token transaction hash: ${pendingTxn.hash}`);

        //     const alicesDigitalAsset = await aptos.getOwnedDigitalAssets({
        //         ownerAddress: alice.accountAddress,
        //         minimumLedgerVersion: BigInt(pendingTxn.version),
        //     });
        //     console.log(`Alice's digital assets balance: ${JSON.stringify(alicesDigitalAsset[alicesDigitalAsset.length - 1], null, 4)}`);

        //     indexV++;

        //     //     // const transferTransaction = await aptos.transferDigitalAssetTransaction({
        //     //     //     sender: alice,
        //     //     //     digitalAssetAddress: alicesDigitalAsset[0].token_data_id,
        //     //     //     recipient: toAddress,
        //     //     // })
        //     //     // committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: transferTransaction });
        //     //     // pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
        //     //     // console.log(`Transfer token transaction hash: ${pendingTxn.hash}`);

        //     //     // const alicesDigitalAssetsAfter = await aptos.getOwnedDigitalAssets({
        //     //     //     ownerAddress: alice.accountAddress,
        //     //     //     minimumLedgerVersion: BigInt(pendingTxn.version),
        //     //     // });

        //     //     // console.log(`Alices's digital assets balance: ${alicesDigitalAssetsAfter.length}`);
        // }
    } catch (error) {
        console.log(error);
    }
}
// exampleCreateNewCollection();