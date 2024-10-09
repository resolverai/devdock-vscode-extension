import { Magic as MagicBase } from 'magic-sdk';
import { OAuthExtension } from "@magic-ext/oauth2";
import { FlowExtension } from '@magic-ext/flow';
import { SDKBase, InstanceWithExtensions } from '@magic-sdk/provider';

type MagicSDK = InstanceWithExtensions<
  SDKBase,
  { oauth2: OAuthExtension; flow: FlowExtension }
>;
type MagicSDK_eth = InstanceWithExtensions<
  SDKBase,
  { oauth2: OAuthExtension }
>;
let magic: MagicSDK | null = null;
let magic_eth: MagicSDK_eth | null = null;

const createMagic = (key: string): MagicSDK => {
  return new MagicBase(key, {
    extensions: [
      new OAuthExtension(),
      new FlowExtension({
        rpcUrl: 'https://rest-testnet.onflow.org',
        network: 'testnet'
      }),
    ]
  });
};

const createMagic_eth = (key: string): MagicSDK_eth => {
  return new MagicBase(key, {
    extensions: [new OAuthExtension()]
  });
};

export const getMagic = (): MagicSDK | null => {
    console.log("Inisde get magic before if")
  if (typeof window !== 'undefined' && !magic) {
    console.log("Inisde get magic after if")

    magic = createMagic('pk_live_EEBF7A044DEA0768'); // change key
  }
  return magic;
};

export const getMagic_eth = (): MagicSDK_eth | null => {
  if (typeof window !== 'undefined' && !magic_eth) {
    magic_eth = createMagic_eth('pk_live_C3F8C5D5B5287599'); // change key
  }
  return magic_eth;
};
//pk_live_C3F8C5D5B5287599
