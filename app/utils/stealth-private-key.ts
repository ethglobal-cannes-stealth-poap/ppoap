import * as secp from '@noble/secp256k1';
import { addPriv } from '@scopelift/stealth-address-sdk/dist/utils/crypto/computeStealthKey';
import { HexString } from '@scopelift/stealth-address-sdk/dist/utils/crypto/types';
import { keccak256 } from 'viem';

export const generateStealthPrivateKey = (
    ephemeralPublicKey: string,
    viewingPrivateKey: string, 
    spendingPrivateKey: string,
) => {

    debugger
    // replaced bigint in the next arg with just hex string
    const sharedSecret = secp.getSharedSecret(BigInt(`0x${viewingPrivateKey}`), ephemeralPublicKey.replace('0x', ''));

    // sharedSecret is a Uint8Array, skip the first byte (0x04 prefix for uncompressed point)
    const hashedSharedSecret = keccak256(sharedSecret.slice(1));

    const spendingPrivateKeyBigInt = BigInt(`0x${spendingPrivateKey}`);
    const hashedSecretBigInt = BigInt(hashedSharedSecret);

    // Compute the stealth private key by summing the spending private key and the hashed shared secret.
    const stealthPrivateKeyBigInt = addPriv({
        a: spendingPrivateKeyBigInt,
        b: hashedSecretBigInt
    });

    const stealthPrivateKeyHex = `0x${stealthPrivateKeyBigInt
        .toString(16)
        .padStart(64, '0')}` as HexString;
    
    return stealthPrivateKeyHex;
}