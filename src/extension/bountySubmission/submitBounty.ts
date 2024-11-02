// import { NextRequest, NextResponse } from "next/server";
import { devcashABI } from "./devCashABI";
import {
  createPublicClient,
  createWalletClient,
  http,
  PrivateKeyAccount,
} from "viem";
import { gnosis } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

/*
This endpoint canbe triggered in the following 2 ways
1) Pass id along with request as a parameter and this will trigger the fetch_single function. This function will fetch one single bounty detail from the list
2) Simple calling the endpoint without any id as parameter will call the fetch_all() function which will fetch and return all the bounty details

*/

function convertBigIntToString(obj: any): any {
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        convertBigIntToString(value),
      ])
    );
  }
  return obj;
}

export async function submitBounty(
  bountyId: string,
  privateKey?: string,
  postMssage?: string,
  userWallet?: string
) {
  const P_client = createPublicClient({
    chain: gnosis,
    transport: http(),
  });

  const W_client = createWalletClient({
    chain: gnosis,
    transport: http(),
  });
  try {
    const submitString = postMssage
      ? postMssage
      : `submitting bounty: ${bountyId}, check my github link`;
    const idParam = 200;
    // const account = userWallet
    //   ? (userWallet as `0x${string}`)
    //   : privateKeyToAccount(privateKey as `0x${string}`);
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const { request } = await P_client.simulateContract({
      // address: '0xa34917a6e2a7d409c7581fd46341ada9e07d368f',
      address: process.env.CONTRACT_ADDRESS as `0x${string}`,
      abi: devcashABI,
      functionName: "submit",
      args: [idParam, submitString],
      account,
      chain: gnosis,
    });
    const hash = await W_client.writeContract(request);
    const TRreciept = await P_client.waitForTransactionReceipt({ hash });
    console.log("TRreciept, hash", TRreciept, hash);
    const reciept = convertBigIntToString(TRreciept);
    return { reciept, hash };
  } catch (e) {
    console.error("Unexpected error Submitting bounty:", e);
  }
}
