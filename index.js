const {
    Account,
    AccountAddress,
    Aptos,
    AptosConfig,
    Network,
    NetworkToNetworkName,
    Ed25519PrivateKey
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

const deployHelloCanadoToken = async () => {
    try {
        const aptos = new Aptos();

        const account = Account.fromPrivateKey({
            privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEY_DEPLOY),
            address: AccountAddress.from(process.env.PUBLIC_KEY_DEPLOY)
        });
        console.log("====account", account.accountAddress.toString());
        console.log("\n=== Compiling MoonCoin package locally ===");
        compilePackage(
            "move/titanPower",
            "move/titanPower/titanPower.json",
            [{ name: "TitanPower", address: account.accountAddress }]
        );

        const { metadataBytes, byteCode } = getPackageBytesToPublish("move/titanPower/titanPower.json");
        console.log(`\n=== Publishing MoonCoin package to ${aptos.config.network} network ===`);

        const transaction = await aptos.publishPackageTransaction({
            account: account.accountAddress,
            metadataBytes,
            moduleBytecode: byteCode,
        });
        console.log("\nFinished compiling and publishing MoonCoin package");

        const pendingTransaction = await aptos.signAndSubmitTransaction({
            signer: account,
            transaction,
        });
        console.log("\nFinished deploying MoonCoin package");

        await aptos.waitForTransaction({ transactionHash: pendingTransaction.hash });
        console.log(`Publish package transaction hash: ${pendingTransaction.hash}`);
    } catch (error) {
        console.log(error);
    }
}

// deployHelloCanadoToken()



const exampleCreateNewCollection = async () => {
    try {
        const collectionName = "Example Collection";
        const collectionDescription = "Example description.";
        const collectionURI = "aptos.dev";

        const aptos = new Aptos();
        const alice = Account.fromPrivateKey({
            privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEY_DEPLOY),
            address: AccountAddress.from(process.env.PUBLIC_KEY_DEPLOY)
        });
        const toAddress = AccountAddress.from("0xd5f021cfbd78705f6e3fc5af2ab0ef20b80ee57c5aef8003d2b996d006e35b27");

        // const createCollectionTransaction = await aptos.createCollectionTransaction({
        //     creator: alice,
        //     description: collectionDescription,
        //     name: collectionName,
        //     uri: collectionURI,
        // });

        // console.log("\n=== Create the collection ===\n");
        // const committedTxn = await aptos.signAndSubmitTransaction({
        //     signer: alice,
        //     transaction: createCollectionTransaction
        // });
        // const pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
        // console.log(`Create collection transaction hash: ${pendingTxn.hash}`);

        const alicesCollection = await aptos.getCollectionData({
            creatorAddress: alice.accountAddress,
            collectionName,
            minimumLedgerVersion: BigInt(4212275),
        });
        console.log(`Alice's collection: ${JSON.stringify(alicesCollection, null, 4)}`);

        const tokenName = "Example Asset";
        const tokenDescription = "Example asset description.";
        const tokenURI = "https://clonex-assets.rtfkt.com";
        console.log("\n=== Alice Mints the digital asset ===\n");

        let indexV = 100;
        while (true) {
            const tokenURIIndex = `${tokenURI}/${indexV}`
            const mintTokenTransaction = await aptos.mintDigitalAssetTransaction({
                creator: alice,
                collection: collectionName,
                description: tokenDescription,
                name: tokenName,
                uri: tokenURIIndex,
            });
            committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: mintTokenTransaction });
            pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
            console.log(`Mint token transaction hash: ${pendingTxn.hash}`);

            const alicesDigitalAsset = await aptos.getOwnedDigitalAssets({
                ownerAddress: alice.accountAddress,
                minimumLedgerVersion: BigInt(pendingTxn.version),
            });
            console.log(`Alice's digital assets balance: ${JSON.stringify(alicesDigitalAsset[alicesDigitalAsset.length - 1], null, 4)}`);

            indexV++;

            //     // const transferTransaction = await aptos.transferDigitalAssetTransaction({
            //     //     sender: alice,
            //     //     digitalAssetAddress: alicesDigitalAsset[0].token_data_id,
            //     //     recipient: toAddress,
            //     // })
            //     // committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: transferTransaction });
            //     // pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
            //     // console.log(`Transfer token transaction hash: ${pendingTxn.hash}`);

            //     // const alicesDigitalAssetsAfter = await aptos.getOwnedDigitalAssets({
            //     //     ownerAddress: alice.accountAddress,
            //     //     minimumLedgerVersion: BigInt(pendingTxn.version),
            //     // });

            //     // console.log(`Alices's digital assets balance: ${alicesDigitalAssetsAfter.length}`);
        }
    } catch (error) {
        console.log(error);
    }
}

exampleCreateNewCollection();