// File: ./authz.js
import { sign } from "./sign";
import * as fcl from "@onflow/fcl";
// import Account from "@onflow/types";
// import type { Account } from "@onflow/types";
// import { Account } from "@onflow/types";
export function authz(
  flowAccountAddress: string,
  flowAccountKeyId: string,
  flowAccountPrivateKey: string
) {
  return (account: any) => {
    return {
      // there is stuff in the account that is passed in
      // import type { Account } from "@onflow/types";you need to make sure its part of what is returned
      ...account,
      // the tempId here is a very special and specific case.
      // what you are usually looking for in a tempId value is a unique string for the address and keyId as a pair
      // if you have no idea what this is doing, or what it does, or are getting an error in your own
      // implementation of an authorization function it is recommended that you use a string with the address and keyId in it.
      // something like... tempId: `${address}-${keyId}`
      addr: fcl.sansPrefix(flowAccountAddress), // eventually it wont matter if this address has a prefix or not, sadly :'( currently it does matter.
      keyId: Number(flowAccountKeyId), // must be a number
      signingFunction: (signable: { message: string }) => ({
        addr: fcl.withPrefix(flowAccountAddress), // must match the address that requested the signature, but with a prefix
        keyId: Number(flowAccountKeyId), // must match the keyId in the account that requested the signature
        signature: sign(flowAccountPrivateKey, signable.message), // signable.message |> hexToBinArray |> hash |> sign |> binArrayToHex
        // if you arent in control of the transaction that is being signed we recommend constructing the
        // message from signable.voucher using the @onflow/encode module
      }),
    };
  };
}
