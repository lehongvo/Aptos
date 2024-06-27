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

deployHelloCanadoToken()