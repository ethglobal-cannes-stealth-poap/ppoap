import * as secp from '@noble/secp256k1';
import { keccak256 } from 'viem';
import { toEthAddress } from "./index";
import { cacheExchange, createClient, fetchExchange, Provider, useQuery } from 'urql';
import { checkStealthAddress } from "@scopelift/stealth-address-sdk";
import { getAnouncements } from './viewTransactions/getAnouncements';

// export interface StealthAddressResult {
//   stealthMetaAddress: string;
//   spendingPrivateKey: string;
//   viewingPrivateKey: string;
//   spendingPublicKey: string;
//   viewingPublicKey: string;
//   viewTag: string;
//   credentialUsed: string;
// }

// Helper to convert a hex string to a Uint8Array
const hexToBytes = (hex) => {
  if (hex.startsWith('0x')) {
    hex = hex.slice(2);
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

function parseStealthAddresses(
  ephemeralPublicKey_hex: string,
  stealthAddress_given: string,
  spendingPublicKey_hex: string,
  viewingPrivateKey: string,
  viewTag_given: string
){
  console.log("ephemeralPublicKey_hex :",ephemeralPublicKey_hex);

  // Fix 1: Handle ephemeral public key properly
  // The ephemeralPublicKey might be missing compression prefix or be uncompressed
  let ephemeralPublicKey
  try {
    // Try parsing as-is first
    ephemeralPublicKey = secp.Point.fromHex(ephemeralPublicKey_hex.slice(2));
  } catch (e) {
    // If that fails, try with compression prefix (assume even y-coordinate)
    try {
      ephemeralPublicKey = secp.Point.fromHex('02' + ephemeralPublicKey_hex.slice(2));
    } catch (e2) {
      // If still fails, try with odd y-coordinate
      try {
        ephemeralPublicKey = secp.Point.fromHex('03' + ephemeralPublicKey_hex.slice(2));
      } catch (e3) {
        console.error('Failed to parse ephemeralPublicKey:', ephemeralPublicKey_hex, e3);
        return false;
      }
    }
  }
  console.log('ephemeralPublicKey_hex:', ephemeralPublicKey_hex);

  const spendingPublicKey = secp.Point.fromHex(spendingPublicKey_hex.slice(2));
  console.log('spendingPublicKey:', spendingPublicKey);


  const sharedSecret = secp.getSharedSecret(BigInt(`0x${viewingPrivateKey}`), ephemeralPublicKey);
  console.log('sharedSecret:', sharedSecret);

  var hashedSharedSecret = keccak256(Buffer.from(sharedSecret.slice(1)));
  // console.log("hashedSharedSecret2 :",hashedSharedSecret);

  var ViewTag = hashedSharedSecret.slice(2,4).toString();
  // console.log('View tag:', ViewTag);
  // console.log('View tag given:', viewTag_given);
  if (viewTag_given.replace("0x", "") != ViewTag) {
    console.log("skipped thanks to view tag;")
    return false;
  }

  // Fix 3: Remove 0x prefix before creating Buffer
  const hashedSharedSecretPoint = secp.Point.fromPrivateKey(
    Buffer.from(hashedSharedSecret.slice(2), "hex")
  );
  // console.log('hashedSharedSecretPoint1:', hashedSharedSecretPoint);

  const stealthPublicKey = spendingPublicKey.add(hashedSharedSecretPoint);
  // console.log("stealthPublicKey :",stealthPublicKey.toHex());

  const stealthAddress = toEthAddress(stealthPublicKey.toHex());
  console.log(stealthAddress);
  console.log(stealthAddress_given);
  if (stealthAddress.toLowerCase() === stealthAddress_given.toLowerCase()) {
    return [stealthAddress, ephemeralPublicKey_hex,  "0x" + hashedSharedSecret.toString()];
  }
  return false;
}

// // const GRAPH_URL = 'https://gateway.thegraph.com/api/subgraphs/id/AVHQeKhBop1z4YFgx78hR6wsBJFcjRr2FrxHsKxqaN5Q';
// const GRAPH_URL = 'https://api.studio.thegraph.com/query/115552/correct-contract/version/latest'
// const client = createClient({
//   url: GRAPH_URL,
//   fetchOptions: {
//     headers: {

//       Authorization: 'Bearer dda69902abbe4922d3c01f9278ca713d',

//     },
//   },
//   exchanges: [cacheExchange, fetchExchange],
// });

// Main function to orchestrate the entire scan
export async function scanForStealthAssets(userKeys: { viewingPrivateKey: string, spendingPublicKey: string }) {


  // const AnnouncementsQuery = `
  //   query GetAnnouncements {
  //     announcements(first: 5) {
  //       id
  //       schemeId
  //       stealthAddress
  //       ephemeralPubKey
  //       metadata
  //     }
  //   }
  // `;

  // console.log("Fetching announcements from The Graph...");
  // const result = await client.query(AnnouncementsQuery).toPromise();
  // console.log("result:", result);

  const anouncementLogs = await getAnouncements();

  const stealthAddresses = [];

  for (const announcement of anouncementLogs) {
    const { stealthAddress, ephemeralPubKey, metadata } = announcement.args;

    console.log("announcement:", ephemeralPubKey)

    try {
      const isForUser = parseStealthAddresses(
        ephemeralPubKey as string,
        stealthAddress as string,
        userKeys.spendingPublicKey,
        userKeys.viewingPrivateKey,
        metadata as string,
      );

      if (isForUser) {
        stealthAddresses.push(stealthAddress);
      }
      console.log("isForUser:", isForUser);
    } catch (e) {
      console.error("Error parsing stealth addresses:", e)
    }
  }

  return stealthAddresses;
}