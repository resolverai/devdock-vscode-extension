import * as fcl from "@onflow/fcl";
import { authz } from "../flow/authz";

fcl.config({
  "flow.network": `${process.env.FLOWTESTNET}`,
  "accessNode.api": `${process.env.AccessNodeTestAPI}`,
});

export const enable_axon_vault_for_user = async (
  privateKey: string,
  flowWalletAddress: string
) => {
  try {
    const authZVal = authz(
      flowWalletAddress, // public address of master account on Flow
      "0", // key id
      privateKey // flow account private key of master account
    );
    const txn_id_val = await fcl.mutate({
      cadence: `      import FungibleToken from 0x9a0766d93b6608b7
          import AXON from 0x9d2ade18cb6bea1a
    // do this transaction first before sending token to a reciever 
    transaction () {
    
        prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue) &Account) {
    
            if signer.storage.borrow<&AXON.Vault>(from: AXON.VaultStoragePath) != nil {
                return
            }
            let vault <- AXON.createEmptyVault(vaultType: Type<@AXON.Vault>())
    
            signer.storage.save(<-vault, to: AXON.VaultStoragePath)
    
            let vaultCap = signer.capabilities.storage.issue<&AXON.Vault>(
                AXON.VaultStoragePath
            )
            signer.capabilities.publish(vaultCap, at: AXON.VaultPublicPath)
        }
    }
    `,
      proposer: authZVal,
      payer: authZVal,
      authorizations: [authZVal],
      limit: 100, // Setting an explicit compute limit for consistency
    });

    console.log("enable_axon_vault_for_user result", txn_id_val);
    const transactionResult = await fcl.tx(txn_id_val).onceSealed();
    return { result: txn_id_val };

    //   .then(async (tx_id) => {
    //     console.log(tx_id);
    //     const transactionResult = await fcl.tx(tx_id).onceSealed();
    //     console.log(
    //       "enable_axon_vault_for_user transactionResult for VaultEnable",
    //       JSON.stringify(transactionResult)
    //     );

    //     return { result: tx_id };

    //     // return { bountyId, transactionHash: tx_id };
    //   });
  } catch (error) {
    console.error("Error enabling vault:", error);
    throw error;
  }
};
// ['events'][0].data['id']
// enable_axon_vault_for_user();
