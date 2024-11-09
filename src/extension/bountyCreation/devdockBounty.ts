import * as fcl from "@onflow/fcl";
import { authz } from "../flow/authz";

fcl.config({
  "flow.network": `${process.env.FLOWTESTNET}`,
  "accessNode.api": `${process.env.AccessNodeTestAPI}`,
});

export const createDevdockBounty = async (
  description: string,
  //   title: string,
  total_bounty: number,
  allowed_bounties: number,
  privateKey: string,
  flowWalletAddress: string
) => {
  const title: string = "Do a bounty";

  const authZVal = authz(
    flowWalletAddress, //public address of master account on Flow
    "0", //key id
    privateKey // flow account private key of master account
  );

  fcl
    .mutate({
      cadence: `
import BountyReward from 0x9d2ade18cb6bea1a //Change the address

transaction(description:String,title:String,total_bounty:UInt,allowed_bounties:UInt) {

  prepare(acct: &Account) {
    log(acct.address)
  }

  execute {
    let loggable=BountyReward.create_bounty(description:description,title:title,total_bounty:total_bounty,allowed_bounties:allowed_bounties)
    log(loggable)
  }
}

             `,

      args: (arg: any, t: any) => [
        arg(description, t.String),
        arg(title, t.String),
        arg(total_bounty, t.UInt),
        arg(allowed_bounties, t.UInt),
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
          console.log(events["events"][0].data["id"]);
        });
    });
};

// createDevdockBounty("XXXX", 12, 1);
