import * as secp from '@noble/secp256k1';
import { keccak256 } from 'viem';
import { toEthAddress } from "./index.js";
import { cacheExchange, createClient, fetchExchange, Provider, useQuery } from 'urql';
import { checkStealthAddress } from "@scopelift/stealth-address-sdk";

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
  let ephemeralPublicKey;
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


  const sharedSecret = secp.getSharedSecret(BigInt(viewingPrivateKey), ephemeralPublicKey);
  console.log('sharedSecret:', sharedSecret);

  var hashedSharedSecret = keccak256(Buffer.from(sharedSecret.slice(2)));
  console.log("hashedSharedSecret2 :",hashedSharedSecret);

  var ViewTag = hashedSharedSecret.slice(0,2).toString();
  console.log('View tag:', ViewTag);
  console.log('View tag given:', viewTag_given);
  if (viewTag_given != ViewTag) {
    console.log("skipped thanks to view tag;")
    return false;
  }

  // Fix 3: Remove 0x prefix before creating Buffer
  const hashedSharedSecretPoint = secp.Point.fromPrivateKey(
    Buffer.from(hashedSharedSecret.slice(2), "hex")
  );
  console.log('hashedSharedSecretPoint1:', hashedSharedSecretPoint);

  const stealthPublicKey = spendingPublicKey.add(hashedSharedSecretPoint);
  console.log("stealthPublicKey :",stealthPublicKey.toHex());

  const stealthAddress = toEthAddress(stealthPublicKey.toHex());
  console.log(stealthAddress);
  console.log(stealthAddress_given);
  if (stealthAddress === stealthAddress_given) {
    return [stealthAddress, ephemeralPublicKey_hex,  "0x" + hashedSharedSecret.toString()];
  }
  return false;
}

// const GRAPH_URL = 'https://gateway.thegraph.com/api/subgraphs/id/AVHQeKhBop1z4YFgx78hR6wsBJFcjRr2FrxHsKxqaN5Q';
const GRAPH_URL = 'https://api.studio.thegraph.com/query/115552/correct-contract/version/latest'
const client = createClient({
  url: GRAPH_URL,
  fetchOptions: {
    headers: {

      Authorization: 'Bearer dda69902abbe4922d3c01f9278ca713d',

    },
  },
  exchanges: [cacheExchange, fetchExchange],
});

// Main function to orchestrate the entire scan
export async function scanForStealthAssets(userKeys: { viewingPrivateKey: string, spendingPublicKey: string }) {


  const AnnouncementsQuery = `
    query GetAnnouncements {
      announcements(first: 5) {
        id
        schemeId
        stealthAddress
        ephemeralPubKey
        metadata
      }
    }
  `;

  console.log("Fetching announcements from The Graph...");
  const result = await client.query(AnnouncementsQuery).toPromise();
  console.log("result:", result);

  for (const announcement of result.data.announcements) {
    if (!announcement.ephemeralPubKey || !announcement.stealthAddress) {
      console.warn(`Skipping announcement ${announcement.id} due to missing ephemeralPubKey or stealthAddress.`);
      continue;
    }

    console.log("announcement:", announcement.ephemeralPubKey)

    try {
      const isForUser = parseStealthAddresses(
        announcement.ephemeralPubKey,
        announcement.stealthAddress,
        userKeys.spendingPublicKey,
        userKeys.viewingPrivateKey,
        announcement.metadata,
      );
      console.log("isForUser:", isForUser);
    } catch (e) {
      console.error("Error parsing stealth addresses:", e)
    }

  }

  if (result.error) {
    console.error("GraphQL Error:", result.error);
    throw new Error("Failed to fetch announcements from The Graph.");
  }

  return []
}