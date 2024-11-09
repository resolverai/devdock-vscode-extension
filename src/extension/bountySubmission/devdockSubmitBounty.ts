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
  //   const authZVal = authz(
  //     "0x9d2ade18cb6bea1a", //public address of master account on Flow
  //     "0", //key id
  //     "c82378d0b92011d574966e835b8027d3cc5e230bb05c26d728a0ed2c5d484889" // flow account private key of master account
  //   );

  if (flowWalletAddress != null && privateKey != null) {
    const authZVal = authz(
      flowWalletAddress, //public address of master account on Flow
      "0", //key id
      privateKey // flow account private key of master account
    );
    fcl
      .mutate({
        cadence: `
      import BountyReward from 0x9d2ade18cb6bea1a

transaction(id:UInt,submit_string:String) {

  prepare(acct: &Account) {
    log(acct.address)
  }

  execute {
    BountyReward.submit_bounty(id:id,submit_string:submit_string)
    
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
      })
      .then(async (tx_id) => {
        console.log(tx_id);
        fcl
          .tx(tx_id)
          .onceSealed()
          .then((events) => {
            console.log("Bounty Submitted for bounty id ");
            console.log(events["events"][0].data["id"]);
          });
      });
  } else {
    console.log("Private key or adderss is null for Flow chain");
  }
};
// ['events'][0].data['id']
// submitDevdockBounty("XXXX", "XXXXX", 12, 1);
