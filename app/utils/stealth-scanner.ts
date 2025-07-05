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

    const isForUser = checkStealthAddress({
      ephemeralPublicKey: announcement.ephemeralPubKey,
      userStealthAddress: announcement.stealthAddress,
      viewTag: announcement.metadata,
      schemeId: 1,
      spendingPublicKey: userKeys.spendingPublicKey,
      viewingPrivateKey: userKeys.viewingPrivateKey,
    });

    console.log("isForUser:", isForUser);
  }


  /*

st:eth:0x028e9bfa1cd10a5caf3430f0950c1eee06d6ed6f92c80882cb6280848d2aadedb8025480981357796378a9ab0b1c0557f5709a0f546b88415438bf86b1bb188d85bf


Spending Private Key: 0x5256b6d42240ae6294916bb9270bd214a5fc666623c4deaf00825c778e1f8eb6
Viewing Private Key: 0x2a264a23bb95ff6b8c0fee48911fea6920ddf3a1c5ffd247b020fe5e761748c7
Spending Public Key: 0x028e9bfa1cd10a5caf3430f0950c1eee06d6ed6f92c80882cb6280848d2aadedb8
Viewing Public Key: 0x025480981357796378a9ab0b1c0557f5709a0f546b88415438bf86b1bb188d85bf

st:eth:0x028e9bfa1cd10a5caf3430f0950c1eee06d6ed6f92c80882cb6280848d2aadedb8025480981357796378a9ab0b1c0557f5709a0f546b88415438bf86b1bb188d85bf
Stealth Address: 0xfb64bb53c7c2cf08ab8124dd074210f00964763c
Announcement: 0x02017b0de440cc36b44ef60f6c4af438d57d6bcd6dd9e893a1e18e2ab770ad94b1
Metadata: 0x9c

  */

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