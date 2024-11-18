import * as vscode from "vscode";

import * as fs from "fs";
import * as path from "path";
import * as auth0 from "auth0-js";
import { Utils } from "vscode-uri";
import { ExtensionContext } from "vscode";

import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import {
  CHAIN_NAMESPACES,
  OPENLOGIN_NETWORK,
  WALLET_ADAPTERS,
  WEB3AUTH_NETWORK,
} from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
// @ts-ignore
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";
// @ts-ignore
import { KERNEL_V3_1 } from "@zerodev/sdk/constants";
// @ts-ignore
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
// @ts-ignore
import { http, createPublicClient, zeroAddress, walletActions } from "viem";
// @ts-ignore
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
// @ts-ignore
import { sepolia } from "viem/chains";
// @ts-ignore
import { ENTRYPOINT_ADDRESS_V07, bundlerActions } from "permissionless";
import { NHFile, NHProvider } from "zerog-da-sdk";
import axios from "axios";
// import { pinFileToIPFS } from './ipfs';

type AuthCallback = (
  error: auth0.Auth0ParseHashError | null,
  result?: auth0.Auth0DecodedHash
) => void;
let webViewPanel: vscode.WebviewPanel | undefined = undefined;
let web3Auth: Web3Auth;
let extensionContext: ExtensionContext;
let privateKey: `0x${string}`;

const envFilePath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envFilePath)) {
  require("dotenv").config({ path: envFilePath });
}

const auth0Config = {
  domain: process.env.ALCHEMY_AUTH0_DOMAIN || "",
  clientId: process.env.ALCHEMY_AUTH0_CLIENT_ID || "",
  redirectUri: process.env.ALCHEMY_AUTH0_REDIRECT_URI || "",
};

// const chainConfig = {
//   chainNamespace: CHAIN_NAMESPACES.OTHER,
//   chainId: "SN_SEPOLIA", //
//   rpcTarget: "https://cloud.argent-api.com/v1/starknet/sepolia/rpc/v0.7",
//   // Avoid using public rpcTarget in production.
//   displayName: "StarkNet Testnet",
//   blockExplorer: "https://sepolia.starkscan.co",
//   ticker: "STRK",
//   tickerName: "StarkNet",
// };

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x3",
  rpcTarget: "https://rpc.ankr.com/eth_ropsten",
  displayName: "Ropsten Testnet",
  blockExplorer: "https://ropsten.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://images.toruswallet.io/ethereum.svg",
};

const webAuth = new auth0.WebAuth({
  domain: auth0Config.domain,
  clientID: auth0Config.clientId,
  redirectUri: auth0Config.redirectUri,
  responseType: "token id_token",
  scope: "openid profile email",
});

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig: chainConfig },
});

const generateNonce = () => {
  const random = Math.random().toString(36).substring(2, 15);
  return encodeURIComponent(random);
};

const socialLogin = (context: ExtensionContext) => {
  extensionContext = context;
  //webAuth.authorize();
  const nonce = generateNonce();

  // Add the desired GitHub scopes here (read:user, repo)
  const scope = "openid profile email read:user repo";

  const authUrl = `https://${auth0Config.domain}/authorize?client_id=${
    auth0Config.clientId
  }&redirect_uri=${encodeURIComponent(
    auth0Config.redirectUri
  )}&response_type=token id_token&scope=${scope}&nonce=${encodeURIComponent(
    nonce
  )}`;

  console.log("GithubAuthUrl", authUrl);

  vscode.env
    .openExternal(vscode.Uri.parse(authUrl))
    .then(undefined, (error) => {
      console.error("Failed to open Auth0 login URL:", error);
      vscode.window.showErrorMessage(
        "Failed to initiate login. Please try again later."
      );
    });
};

const handleAuthentication = async (uri: vscode.Uri) => {
  console.log(uri);
  if (
    uri.scheme === vscode.env.uriScheme &&
    uri.authority === "copilot.devdock" &&
    uri.path === "/auth/callback"
  ) {
    const fragment = uri.fragment;
    console.log("Fragment: ", fragment);
    const tokenRegex = /id_token=([^&]+)/;
    const match = tokenRegex.exec(fragment);
    if (match && match.length > 1) {
      const accessToken = match[1];
      console.log("Access Token:", accessToken);
      // const githubUserData = await fetchGitHubUserData(accessToken)
      let walletAddress =
        extensionContext.globalState.get<string>("zerodev_wallet");
      //privateKey = extensionContext.globalState.get<string>('private_key');
      if (walletAddress) {
        console.log("Zerodev wallet already created...");
        extensionContext.globalState.update("zerodev_wallet", undefined);
      } else {
        const response = await createZeroDevWallet();
        walletAddress = response.accountAddress;
        extensionContext.globalState.update("private_key", response.privateKey);
        extensionContext.globalState.update(
          "zerodev_wallet",
          response.accountAddress
        );
        await pushToIPFS(response.privateKey, response.accountAddress);
      }

      vscode.window.showInformationMessage(
        "Github Login Successful. Connected to a wallet!"
      );
      vscode.window.showInformationMessage(
        `Your Wallet Address: ${walletAddress}`,
        { modal: true }
      );
      //
      //await initWeb3Auth()
    } else {
      console.error("No access token found in URI fragment");
    }
  } else {
    console.error("Invalid callback URI");
  }
};

const pushToIPFS = async (privateKey: `0x${string}`, walletAddress: string) => {
  const testfileURI = Utils.joinPath(
    extensionContext.extensionUri,
    "assets",
    "testfile.json"
  );
  const jsonData = {
    walletAddress: walletAddress,
    privateKey: privateKey,
  };
  fs.writeFile(testfileURI.fsPath, JSON.stringify(jsonData, null, 2), (err) => {
    if (err) {
      console.error("Error writing to file:", err);
    } else {
      console.log("JSON file has been written successfully.");
    }
  });

  // pinFileToIPFS(testfileURI.fsPath, 'testfile.json')
};

const createZeroDevWallet = async () => {
  const PROJECT_ID = process.env.ZERODEV_PROJECT_ID;
  const BUNDLER_RPC = `${process.env.ZERODEV_BUNDLER_RPC}/${PROJECT_ID}`;
  const PAYMASTER_RPC = `${process.env.ZERODEV_PAYMASTER_RPC}/${PROJECT_ID}`;

  const chain = sepolia;
  const entryPoint = ENTRYPOINT_ADDRESS_V07;
  const kernelVersion = KERNEL_V3_1;

  console.log("BUNDLER RPC: ", BUNDLER_RPC);
  console.log("PAYMASTER RPC: ", PAYMASTER_RPC);

  // Construct a signer
  privateKey = generatePrivateKey();
  const signer = privateKeyToAccount(privateKey);

  // Construct a public client
  const publicClient = createPublicClient({
    transport: http(BUNDLER_RPC),
  });

  // Construct a validator
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer,
    entryPoint,
    kernelVersion,
  });

  // Construct a Kernel account
  const account = await createKernelAccount(publicClient, {
    plugins: {
      sudo: ecdsaValidator,
    },
    entryPoint,
    kernelVersion,
  });

  // Construct a Kernel account client
  const kernelClient = createKernelAccountClient({
    account,
    chain,
    entryPoint,
    bundlerTransport: http(BUNDLER_RPC),
    middleware: {
      sponsorUserOperation: async ({ userOperation }) => {
        const zerodevPaymaster = createZeroDevPaymasterClient({
          chain,
          entryPoint,
          transport: http(PAYMASTER_RPC),
        });
        return zerodevPaymaster.sponsorUserOperation({
          userOperation,
          entryPoint,
        });
      },
    },
  });

  const accountAddress = kernelClient.account.address;
  console.log("My account:", accountAddress);

  const testfileURI = Utils.joinPath(
    extensionContext.extensionUri,
    "assets",
    "testfile.txt"
  );

  const testfileURIBack = Utils.joinPath(
    extensionContext.extensionUri,
    "assets",
    "testfile2.txt"
  );

  const file = await NHFile.fromFilePath(testfileURI.fsPath);
  const [tree, err] = await file.merkleTree();
  let rootHash: string;
  if (err === null) {
    console.log("File Root Hash: ", tree?.rootHash());
    rootHash = tree?.rootHash() || "";
  }
  const nhRpc = "https://rpc-storage-testnet.0g.ai";
  const nhProvider = new NHProvider(nhRpc);

  await nhProvider
    .uploadFile(file)
    .then(async () => {
      console.log("File successfully dumped in 0g testnet");
      // await nhProvider.downloadFile(rootHash, testfileURIBack.fsPath, false).then(() => {
      //   fs.readFile(testfileURIBack.fsPath, 'utf8', (err, data) => {
      //     if (err) {
      //         console.error(`Error reading file: ${err}`);
      //         return;
      //     }
      //     console.log(data);
      // });
      //   console.log("Successfilly downloaded file from 0g");
      // }).catch((error) => {
      //   console.log("Error downloading file from 0g.. ", error)
      // });
    })
    .catch((error) => {
      console.log("Error submitting file to 0g testnet: ", error);
    });

  return { privateKey, accountAddress };
};

const initWeb3Auth = () => {
  try {
    web3Auth = new Web3Auth({
      web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
      clientId: process.env.WEB3AUTH_SAPPHIRE_DEVNET_CLIENT_ID || "",
      privateKeyProvider: privateKeyProvider,
      // chainConfig: chainConfig
    });
    const openloginAdapter = new OpenloginAdapter({
      adapterSettings: {
        uxMode: "popup",
        loginConfig: {
          jwt: {
            verifier: "github-dd-staging-verifier",
            typeOfLogin: "jwt",
            clientId: `${process.env.AUTH0_CLIENT_ID}`,
          },
        },
        network: OPENLOGIN_NETWORK.SAPPHIRE_DEVNET,
      },
    });

    web3Auth.configureAdapter(openloginAdapter);
    web3Auth.init();
    console.log("Web3Auth initialized successfully");
    return web3Auth;
    // const web3AuthProvider = await web3Auth.connect()
    // console.log("Web3Auth Provider:", web3AuthProvider)

    // // You can now use the provider to interact with blockchain
    // const accounts = await <any>web3AuthProvider?.request({ method: 'eth_accounts' })
    // console.log(`Logged in successfully. Account: ${accounts[0]}`)
    // const user = await web3Auth.getUserInfo();
    // console.log("Web3AUth User: ", user)
  } catch (error) {
    console.error("Web3Auth initialization error:", error);
    vscode.window.showErrorMessage("Failed to initialize Web3Auth");
    return null;
  }
};

const getNonce = () => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const initWeb3Auth2 = () => {
  const panel = vscode.window.createWebviewPanel(
    "web3Auth",
    "Web3Auth",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  panel.webview.html = getWebviewContent();
};

function getWebviewContent() {
  const nonce = getNonce();
  const scriptUri =
    "https://cdn.jsdelivr.net/npm/@web3auth/web3auth@1.2.4/dist/web3auth.umd.min.js";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Web3Auth</title>
    </head>
    <body>
      <h1>Web3Auth Integration</h1>
      <button id="connectButton">Connect with Web3Auth</button>
      <script nonce="${nonce}">
        (function() {
          const script = document.createElement('script');
          script.src = '${scriptUri}';
          script.nonce = '${nonce}';
          script.onload = () => {
            console.log('Web3Auth script loaded');
            console.log("window object: ", window);
            // if(typeof window.Webauth === 'undefined'){
            //   console.log("Web3Auth is undefined");
            // }
            initializeWeb3Auth();
          };
          script.onerror = () => {
            console.error('Failed to load Web3Auth script');
          };
          document.head.appendChild(script);

          function initializeWeb3Auth() {
            const clientId = "${process.env.WEB3AUTH_SAPPHIRE_DEVNET_CLIENT_ID}"
            const web3auth = new window.Web3auth.Web3Auth({
              clientId: clientId,
              chainConfig: {
                chainNamespace: 'other',
                chainId: "SN_SEPOLIA",
                rpcTarget: "https://cloud.argent-api.com/v1/starknet/sepolia/rpc/v0.7",
                displayName: "StarkNet Testnet",
                blockExplorer: "https://sepolia.starkscan.co",
                ticker: "STRK",
                tickerName: "StarkNet",
                logo: "https://images.toruswallet.io/ethereum.svg",
              },
            });

            document.getElementById('connectButton').addEventListener('click', async () => {
              try {
                console.log(web3auth);
                web3auth.initModal().then(() => {
                  console.log("Web3Auth again: ", web3auth);
                  const provider = web3auth.connect().then(() => {
                    console.log("Connected", provider);
                  }).catch((error) => {
                    console.log("Error connecting Web3Auth: ", error);
                  });
                }).catch((error) => {
                  console.log("Error initializing Web3Auth: ", error);
                });
              } catch (error) {
                console.error("Connection error:", error);
              }
            });
          }
        })();
      </script>
    </body>
    </html>
  `;
}

export { auth0Config, socialLogin, handleAuthentication, initWeb3Auth };
