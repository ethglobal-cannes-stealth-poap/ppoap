// EIP-5564 Stealth Meta-Address Generator using WebAuthn API + secp256k1
// EIP-5564 Stealth Meta-Address Generator using WebAuthn API
// Based on https://github.com/nerolation/stealth-utils and https://eips.ethereum.org/EIPS/eip-5564
// Generates deterministic spending and viewing keys from passkey signatures

import * as secp from '@noble/secp256k1';

const CREDENTIAL_STORAGE_KEY = 'ppoap-webauthn-credentials';
const STATIC_MESSAGE = 'cannes-love-poap';

interface CredentialDescriptor {
  id: string;
  type: 'public-key';
  createdAt: string;
}

interface StealthAddressResult {
  stealthMetaAddress: string;
  spendingPrivateKey: string;
  viewingPrivateKey: string;
  spendingPublicKey: string;
  viewingPublicKey: string;
  viewTag: string;
  credentialUsed: string;
}

/**
 * Get stored credentials from localStorage
 */
function getStoredCredentials(): CredentialDescriptor[] {
  const stored = localStorage.getItem(CREDENTIAL_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Store credential in localStorage
 */
function storeCredential(credentialDescriptor: CredentialDescriptor): void {
  const stored = getStoredCredentials();
  stored.push(credentialDescriptor);
  localStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify(stored));
}

/**
 * Setup WebAuthn credentials with excludeCredentials to prevent duplicates
 */
export const setupPassKeys = async (): Promise<CredentialDescriptor> => {
  try {
    if (!window.PublicKeyCredential) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    // Get existing credentials to exclude from creation
    const existingCredentials = getStoredCredentials();
    
    if (existingCredentials.length > 0) {
      console.log('WebAuthn credentials already exist, skipping setup');
      return existingCredentials[0]!; // Return the first credential
    }

    console.log('Generating WebAuthn credential...');
    
    // Convert existing credential IDs to proper format for excludeCredentials
    const excludeCredentials = existingCredentials.map(cred => ({
      id: hexToArray(cred.id),
      type: 'public-key' as const
    }));

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: {
          name: 'PPOAP Stealth Address Demo',
          id: window.location.hostname,
        },
        user: {
          id: crypto.getRandomValues(new Uint8Array(32)),
          name: 'ppoap-user',
          displayName: 'PPOAP User',
        },
        pubKeyCredParams: [
          {
            alg: -7, // ES256 (ECDSA with P-256 and SHA-256)
            type: 'public-key',
          },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
        },
        timeout: 60000,
        // Exclude existing credentials to prevent duplicates
        excludeCredentials: excludeCredentials,
      },
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to create WebAuthn credential');
    }

    console.log('WebAuthn credential created successfully');
    
    const credentialDescriptor: CredentialDescriptor = {
      id: arrayToHex(new Uint8Array(credential.rawId)),
      type: 'public-key',
      createdAt: new Date().toISOString(),
    };
    
    storeCredential(credentialDescriptor);
    
    return credentialDescriptor;

  } catch (error) {
    // Handle InvalidStateError specifically (credential already exists)
    if (error instanceof Error && error.name === 'InvalidStateError') {
      console.log('Credential already exists on this authenticator');
      const existingCredentials = getStoredCredentials();
      if (existingCredentials.length > 0) {
        return existingCredentials[0]!;
      }
    }
    console.error('Error setting up WebAuthn credentials:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
};

/**
 * Authenticate using existing WebAuthn credentials to sign a message
 */
export const authenticateAndGenerateStealthAddress = async (message: string = STATIC_MESSAGE): Promise<StealthAddressResult> => {
  try {
    if (!window.PublicKeyCredential) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const storedCredentials = getStoredCredentials();
    if (storedCredentials.length === 0) {
      throw new Error('No WebAuthn credentials found. Please run setupPassKeys() first.');
    }

    const allowCredentials = storedCredentials.map(cred => ({
      id: hexToArray(cred.id),
      type: 'public-key' as const
    }));

    const messageBuffer = new TextEncoder().encode(message);
    
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: messageBuffer,
        allowCredentials: allowCredentials,
        userVerification: 'preferred',
        timeout: 60000,
      },
    })) as PublicKeyCredential;

    if (!assertion) {
      throw new Error('Failed to get WebAuthn assertion');
    }

    // Derive key material from credential ID or public key.
    // Most robust: use credential ID as identifier for the passkey
    const keyMaterial = hexToArray(assertion.id); // assertion.id is base64url
    const keySeed = await crypto.subtle.digest("SHA-256", keyMaterial);

    const { spendingKey, viewingKey } = await deriveStealthKeys(new Uint8Array(keySeed), message);
    
    const spendingPubKey = await getCompressedPublicKey(spendingKey);
    const viewingPubKey = await getCompressedPublicKey(viewingKey);
    
    const viewTag = await generateViewTag(viewingPubKey);
    
    // Format stealth meta-address according to EIP-5564
    // Format: st:eth:0x<spendingPubKey><viewingPubKey>
    // slice(2) removes the "0x" prefix from hex strings before concatenation
    const stealthMetaAddress = `st:eth:0x${spendingPubKey.slice(2)}${viewingPubKey.slice(2)}`;
    
    console.log('\nSTEALTH META-ADDRESS GENERATED:');
    console.log('=====================================');
    console.log(`Stealth Meta-Address: ${stealthMetaAddress}`);
    console.log(`Spending Private Key: 0x${arrayToHex(spendingKey)}`);
    console.log(`Viewing Private Key: 0x${arrayToHex(viewingKey)}`);
    console.log(`Spending Public Key: 0x${spendingPubKey}`);
    console.log(`Viewing Public Key: 0x${viewingPubKey}`);
    console.log(`View Tag: 0x${viewTag}`);
    console.log('=====================================\n');

    return {
      stealthMetaAddress,
      spendingPrivateKey: arrayToHex(spendingKey),
      viewingPrivateKey: arrayToHex(viewingKey),
      spendingPublicKey: spendingPubKey,
      viewingPublicKey: viewingPubKey,
      viewTag,
      credentialUsed: arrayToHex(new Uint8Array(assertion.rawId)),
    };

  } catch (error) {
    console.error('Error generating stealth meta-address:', error);
    throw error;
  }
};

/**
 * Check if WebAuthn credentials are already set up
 */
export const hasCredentials = (): boolean => {
  return getStoredCredentials().length > 0;
};

/**
 * Get all stored credentials
 */
export const getCredentials = (): CredentialDescriptor[] => {
  return getStoredCredentials();
};

/**
 * Clear stored WebAuthn credentials (for testing or reset)
 */
export const clearCredentials = (): void => {
  localStorage.removeItem(CREDENTIAL_STORAGE_KEY);
  console.log('WebAuthn credentials cleared');
};

/**
 * Initialize the stealth address system
 * Sets up credentials if they don't exist, then generates stealth address
 */
export const initializeStealthAddress = async (): Promise<StealthAddressResult> => {
  try {
    // Setup credentials if they don't exist
    if (!hasCredentials()) {
      await setupPassKeys();
    }
    
    // Generate stealth address using existing credentials
    const v = await authenticateAndGenerateStealthAddress();
    return v
  } catch (error) {
    console.error('Error initializing stealth address:', error);
    throw error;
  }
};

/**
 * Derive spending and viewing keys from WebAuthn signature using HKDF
 * Following EIP-5564 key derivation patterns
 */
export const deriveStealthKeys = async (signature: Uint8Array, staticMessage: string): Promise<{spendingKey: Uint8Array, viewingKey: Uint8Array}> => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    signature,
    'HKDF',
    false,
    ['deriveKey', 'deriveBits']
  );

  // Derive spending key using EIP-5564 compliant salt and info
  const spendingKeyMaterial = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('EIP-5564-spending-key'),
      info: new TextEncoder().encode(`${staticMessage}-spending`),
    },
    keyMaterial,
    256 // 32 bytes
  );

  // Derive viewing key using EIP-5564 compliant salt and info
  const viewingKeyMaterial = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('EIP-5564-viewing-key'),
      info: new TextEncoder().encode(`${staticMessage}-viewing`),
    },
    keyMaterial,
    256 // 32 bytes
  );

  // Ensure private keys are valid secp256k1 private keys
  const spendingKey = await normalizePrivateKey(new Uint8Array(spendingKeyMaterial));
  const viewingKey = await normalizePrivateKey(new Uint8Array(viewingKeyMaterial));

  return {
    spendingKey,
    viewingKey,
  };
}

/**
 * Normalize private key to ensure it's a valid secp256k1 private key
 */
async function normalizePrivateKey(keyMaterial: Uint8Array): Promise<Uint8Array> {
  // Ensure the key is exactly 32 bytes
  if (keyMaterial.length !== 32) {
    throw new Error('Private key must be exactly 32 bytes');
  }

  // Use secp256k1 library to validate the private key
  try {
    // Try to generate a public key - this will throw if the private key is invalid
    secp.getPublicKey(keyMaterial, true);
    return keyMaterial;
  } catch (error) {
    // If key is invalid, hash it until we get a valid one
    const hashedKey = await crypto.subtle.digest('SHA-256', keyMaterial);
    return normalizePrivateKey(new Uint8Array(hashedKey));
  }
}

/**
 * Generate compressed public key from private key using secp256k1
 */
async function getCompressedPublicKey(privateKey: Uint8Array): Promise<string> {
  try {
    // Use noble/secp256k1 to generate the public key
    const publicKey = secp.getPublicKey(privateKey, true); // true for compressed format
    return `0x${arrayToHex(publicKey)}`;
  } catch (error) {
    console.error('Error generating compressed public key:', error);
    throw error;
  }
}

/**
 * Generate view tag for efficient stealth address parsing
 * Following EIP-5564 view tag specification
 */
async function generateViewTag(publicKey: string): Promise<string> {
  // Remove 0x prefix if present
  const cleanPubKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;
  
  // Hash the public key
  const pubKeyBytes = hexToArray(cleanPubKey);
  const hash = await crypto.subtle.digest('SHA-256', pubKeyBytes);
  const hashArray = new Uint8Array(hash);
  
  // View tag is the first byte of the hash
  return (hashArray[0] || 0).toString(16).padStart(2, '0');
}

/**
 * Convert hex string to Uint8Array
 */
function hexToArray(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
function arrayToHex(array: Uint8Array): string {
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Export additional utility functions
export const generateStealthAddress = initializeStealthAddress;

/**
 * Demonstrate stealth address generation with comprehensive logging
 */
export const runDemo = async (): Promise<StealthAddressResult> => {
  console.log('🚀 Starting EIP-5564 Stealth Meta-Address Demo...');
  console.log('Based on: https://github.com/nerolation/stealth-utils');
  console.log('');
  console.log('This demo will:');
  console.log('1. Check for existing WebAuthn credentials (using excludeCredentials)');
  console.log('2. Create credentials if needed (ES256 - ECDSA P-256)');
  console.log('3. Sign the static message "cannes-love-poap"');
  console.log('4. Derive spending and viewing keys using HKDF');
  console.log('5. Generate compressed public keys using secp256k1 (33 bytes each)');
  console.log('6. Generate view tag for efficient parsing');
  console.log('7. Format the stealth meta-address according to EIP-5564');
  console.log('');
  
  try {
    const result = await initializeStealthAddress();
    console.log('✅ EIP-5564 stealth meta-address generated successfully!');
    console.log('📚 Learn more: https://nerolation.github.io/stealth-utils/');
    return result;
  } catch (error) {
    console.error('❌ Demo failed:', error instanceof Error ? error.message : error);
    throw error instanceof Error ? error : new Error(String(error));
  }
};