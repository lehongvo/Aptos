const {
    Account,
    AccountAddress,
    Aptos,
    AptosConfig,
    Network,
    NetworkToNetworkName,
    Ed25519PrivateKey
} = require("@aptos-labs/ts-sdk");

const dotenv = require('dotenv');
dotenv.config();


const compilePackage = async (
    packageDir,
    outputFile,
    nameAddress
) => {
    try {
        console.log("In order to run compilation, you must have the `aptos` CLI installed.");

        try {
            execSync("aptos --version");
        } catch (e) {
            console.log("aptos is not installed. Please install it from the instructions on aptos.dev");
        }
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

        console.log("\n=== Addresses ===");
        console.log(`Alice: ${account.accountAddress.toString()}`);

        // Please ensure you have the aptos CLI installed
        console.log("\n=== Compiling Hello_Canado package locally ===");
        compilePackage("./packages/hello_canado", "hello_canado.mv", "hello_canado");
    } catch (error) {
        console.log(error);
    }
}

deployHelloCanadoToken()