# Aptos Smart Contract Deployment Guide

This guide provides step-by-step instructions for deploying a smart contract on the Aptos network.

## Step 1: Install the Required Libraries

1. **Install Yarn**: Ensure you have Yarn installed. If not, you can install it using npm.
   ```sh
   npm install -g yarn
   ```
2. **Initialize Yarn**: Run the following command in your project directory to install the necessary libraries and dependencies.
   ```sh
   yarn
   ```

## Step 2: Set Up Configuration for Deployment

1. **Install Aptos CLI**: If you haven't installed the Aptos CLI, you can do so by following the instructions from the official Aptos CLI GitHub repository

   For example, on macOS you can use Homebrew:

   ```sh
   brew install aptos
   ```

- On other platforms, download the appropriate binary from the GitHub releases page and add it to your PATH.

2. **Initialize Aptos Configuration**: In your project directory, run the following command to set up the configuration for your Aptos account.
   ```sh
   aptos init
   ```
   This command will prompt you for several details:

- Network: Choose the network (mainnet, testnet, devnet, or a local network).
- Account: You can create a new account or import an existing one using a private key or mnemonic phrase.
- Configuration Directory: By default, the configuration is stored in ~/.aptos.
- Follow the prompts to complete the initialization.

## Step 3: Verify Configuration

1. **Check Account Configuration**: To verify that your configuration is set up correctly, list the accounts associated with your configuration.
   ```sh
   aptos account list
   ```

- This command should display a list of accounts along with their addresses and public keys. Ensure that your intended account is correctly listed.
