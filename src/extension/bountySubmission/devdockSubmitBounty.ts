import * as fcl from "@onflow/fcl";
import { authz } from "../flow/authz";

fcl.config({
  "flow.network": `${process.env.FLOWTESTNET}`,
  "accessNode.api": `${process.env.AccessNodeTestAPI}`,
});

export const submitDevdockBounty = async (
  bountyId: string,
  postMssage?: string,
  privateKey?: string,
  flowWalletAddress?: string
) => {
  if (flowWalletAddress != null && privateKey != null) {
    const authZVal = authz(
      flowWalletAddress, // public address of master account on Flow
      "0", // key id
      privateKey // flow account private key of master account
    );

    try {
      const tx_id = await fcl.mutate({
        cadence: `
        import BountyContract from 0x9d2ade18cb6bea1a

        transaction(id: UInt, submit_string: String) {

          prepare(acct: &Account) {
            log(acct.address)
          }

          execute {
            BountyContract.submit_bounty(id: id, submit_string: submit_string)
          }
        }
        `,
        args: (arg: any, t: any) => [
          arg(bountyId, t.UInt),
          arg(postMssage, t.String),
        ],
        proposer: authZVal,
        payer: authZVal,
        authorizations: [authZVal],
        limit: 100, // Setting an explicit compute limit for consistency
      });

      const transactionResult = await fcl.tx(tx_id).onceSealed();
      console.log("Bounty Submitted for bounty id ", bountyId);
      console.log("Transaction Hash:", tx_id);
      console.log("Transaction transactionResult:", transactionResult);

      return { transactionHash: tx_id };
    } catch (error) {
      console.error("Error submitting bounty:", error);
      // throw error;
      return { error: error };
    }
  } else {
    console.log("Private key or address is null for Flow chain");
    return null;
  }
};
