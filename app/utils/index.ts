import * as secp from '@noble/secp256k1';
import { keccak256 } from 'viem'

export function randomPrivateKey() {
    const randPrivateKey = secp.utils.randomPrivateKey();
    return BigInt(`0x${Buffer.from(randPrivateKey).toString('hex')}`);
}

export function toEthAddress(PublicKey: string) {
    const hash = keccak256(Buffer.from(PublicKey, 'hex').slice(1));
    return "0x" + hash.slice(-40);
}