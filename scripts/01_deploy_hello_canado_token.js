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

const compilePackage = async (
    packageDir,
    outputFile,
    namedAddresses
) => {
    try {
        console.log("In order to run compilation, you must have the `aptos` CLI installed.");

        try {
            execSync("aptos --version");
        } catch (e) {
            console.log("aptos is not installed. Please install it from the instructions on aptos.dev");
        }

        const addressArg = namedAddresses.map(({ name, address }) => `${name}=${address}`).join(" ");
        const compileCommand = `aptos move build-publish-payload --json-output-file ${outputFile} --package-dir ${packageDir} --named-addresses ${addressArg} --assume-yes`;
        // aptos move build-publish-payload --json-output-file ${outputFile} 
        execSync(compileCommand);
    } catch (error) {
        console.log(error);
    }
}

const deployHelloCanadoToken = async () => {
    try {
        // Create two accounts, Alice and Bob
        const account = Account.fromPrivateKey({
            privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEY_DEPLOY),
            address: AccountAddress.from(process.env.PUBLIC_KEY_DEPLOY)
        });

        const path = require('path');
        const packageDir = path.resolve(__dirname, 'build-data');
        const outputFile = path.resolve(__dirname, 'build-data', 'hello_contract.json');
        compilePackage(packageDir, outputFile, [{ name: "hello_contract", address: account.accountAddress }]);
    } catch (error) {
        console.log(error);
    }
}

deployHelloCanadoToken()