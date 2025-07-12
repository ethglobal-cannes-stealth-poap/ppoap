import * as secp from '@noble/secp256k1';
import { randomPrivateKey, toEthAddress } from "./index";
import { keccak256 } from 'viem'

/**
 * Borrowed from https://github.dev/nerolation/stealth-utils
 */
export const generateStealthAddress = async (stealthMetaAddress: string) => {
    //USER = "st:eth:0x03312f36039e1479d10ba17eef98bba5f9a299af277c1dfac2e9134f352892b16603312f36039e1479d10ba17eef98bba5f9a299af277c1dfac2e9134f352892b166";

  const USER = stealthMetaAddress;
  if (!USER.startsWith("st:eth:0x")){
    throw "Wrong address format; Address must start with `st:eth:0x...`";
  }

  const R_pubkey_spend = secp.Point.fromHex(USER.slice(9,75));

  const R_pubkey_view = secp.Point.fromHex(USER.slice(75,));


  const ephemeralPrivateKey = randomPrivateKey();
  // console.log('ephemeralPrivateKey:', "0x" + ephemeralPrivateKey.toString(16));

  const ephemeralPublicKey = secp.getPublicKey(ephemeralPrivateKey, true);
  // console.log('ephemeralPublicKey:', Buffer.from(ephemeralPublicKey).toString('hex'));

  const sharedSecret = secp.getSharedSecret(ephemeralPrivateKey, R_pubkey_view);
  // console.log('sharedSecret:', sharedSecret);

  // sharedSecret is a Uint8Array, skip the first byte (0x04 prefix for uncompressed point)
  const hashedSharedSecret = keccak256(sharedSecret.slice(1));
  // console.log('hashedSharedSecret:', hashedSharedSecret);

  // ViewTag should be first byte of the hash (after 0x prefix)
  const ViewTag = hashedSharedSecret.slice(2, 4); // Get first byte as hex string
  // console.log('View tag:', ViewTag);
  
  // Remove 0x prefix and convert to proper format for Point creation
  const hashedSharedSecretHex = hashedSharedSecret.slice(2); // Remove 0x prefix
  const hashedSharedSecretPoint = secp.Point.fromPrivateKey(hashedSharedSecretHex);
  // console.log('hashedSharedSecretPoint1:', hashedSharedSecretPoint);
  const stealthPublicKey = R_pubkey_spend.add(hashedSharedSecretPoint);
  // console.log("stealthPublicKey.toHex(): ", stealthPublicKey.toHex());
  const stealthAddress = toEthAddress(stealthPublicKey.toHex());
  // console.log('stealth address:', stealthAddress);
  return {"stealthAddress":stealthAddress, "ephemeralPublicKey":"0x"+Buffer.from(ephemeralPublicKey).toString('hex'), "viewTag":"0x"+ViewTag};
};