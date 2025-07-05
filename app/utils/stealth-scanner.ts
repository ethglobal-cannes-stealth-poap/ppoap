import * as secp from '@noble/secp256k1';
import { keccak256 } from 'viem';
import { toEthAddress } from "./index.js";
import { cacheExchange, createClient, fetchExchange, Provider, useQuery } from 'urql';

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

// Function to check if a single stealth address belongs to the user
function checkStealthAddressOwnership(ephemeralPubKey: string, viewingPrivateKeyBytes: Uint8Array, spendingPublicKey: string, targetStealthAddress: string) {
  // Validate the format of the ephemeral public key from The Graph
  if (typeof ephemeralPubKey !== 'string' || ephemeralPubKey.length !== 68 || !(ephemeralPubKey.startsWith('0x02') || ephemeralPubKey.startsWith('0x03'))) {
    return false;
  }

  try {
    // Compute the shared secret: s = ephemeralPubKey * viewingPrivateKey
    const sharedSecret = secp.getSharedSecret(viewingPrivateKeyBytes, ephemeralPubKey.slice(2));

    // Hash the shared secret: h = H(s)
    const hashedSharedSecret = keccak256(sharedSecret.slice(1));

    // Compute the stealth public key: P_stealth = P_spend + H(s)G
    const hashedSharedSecretPoint = secp.Point.fromPrivateKey(hashedSharedSecret.slice(2));
    const spendingPublicKeyPoint = secp.Point.fromHex(spendingPublicKey);
    const computedStealthPublicKey = spendingPublicKeyPoint.add(hashedSharedSecretPoint);

    // Convert the computed public key to an address
    const computedStealthAddress = toEthAddress(computedStealthPublicKey.toHex());

    // Compare with the address from the announcement
    return computedStealthAddress.toLowerCase() === targetStealthAddress.toLowerCase();
    
  } catch (error) {
    // Catch errors if the ephemeralPubKey is not a valid point on the curve.
    console.warn(`Could not process ephemeralPubKey: ${ephemeralPubKey}. It is likely an invalid curve point. Skipping.`);
    return false;
  }
}

const GRAPH_URL = 'https://api.studio.thegraph.com/query/115552/correct-contract/version/latest';
const client = createClient({
    url: GRAPH_URL,
    fetchOptions: {

    headers: {

      Authorization: 'Bearer 5da881b6307862778780ce5f8f167a0b',

    },

  },

  exchanges: [cacheExchange, fetchExchange],
});

// Main function to orchestrate the entire scan
export async function scanForStealthAssets(userKeys: { viewingPrivateKey: string, spendingPublicKey: string }) {


  const AnnouncementsQuery = `
    query GetAnnouncements {
      announcements(first: 100, where: {schemeId: "1"}) {
        id
        stealthAddress
        ephemeralPubKey
        caller
        metadata
      }
    }
  `;

  console.log("Fetching announcements from The Graph...");
  const result = await client.query(AnnouncementsQuery).toPromise();
    debugger
  if (result.error) {
    console.error("GraphQL Error:", result.error);
    throw new Error("Failed to fetch announcements from The Graph.");
  }
  
  const announcements = result.data.announcements;
  console.log(`Found ${announcements.length} total announcements to scan.`);

  const myStealthAddresses = new Set();
  const viewingPrivateKeyBytes = hexToBytes(userKeys.viewingPrivateKey);
  const spendingPublicKeyHex = userKeys.spendingPublicKey.startsWith('0x') ? userKeys.spendingPublicKey.slice(2) : userKeys.spendingPublicKey;

  for (const ann of announcements) {
    if (!ann.ephemeralPubKey || !ann.stealthAddress) continue;
    
    const isOwner = checkStealthAddressOwnership(
      ann.ephemeralPubKey,
      viewingPrivateKeyBytes,
      spendingPublicKeyHex,
      ann.stealthAddress
    );

    if (isOwner) {
      console.log(`✅ Match found! Stealth Address: ${ann.stealthAddress}`);
      myStealthAddresses.add(ann.stealthAddress);
    }
  }

  if (myStealthAddresses.size === 0) {
    console.log("Scan complete. No matching stealth addresses found.");
    return [];
  }

  console.log(`Fetching POAPs for ${myStealthAddresses.size} owned stealth addresses...`);
  const poapPromises = Array.from(myStealthAddresses).map(address =>
    fetch(`https://api.poap.tech/actions/scan/${address}`)
      .then(res => {
        if (!res.ok) throw new Error(`POAP API failed for ${address} with status ${res.status}`);
        return res.json();
      })
      .catch(err => {
        console.error(err);
        return [];
      })
  );

  const allPoapsNested = await Promise.all(poapPromises);
  const allPoaps = allPoapsNested.flat();

  console.log(`Scan complete. Found ${allPoaps.length} POAPs.`);
  return allPoaps;
}