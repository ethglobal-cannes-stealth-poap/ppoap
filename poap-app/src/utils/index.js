import * as secp from '@noble/secp256k1';
import { keccak256 } from 'viem'

export function randomPrivateKey() {
    const randPrivateKey = secp.utils.randomPrivateKey();
    return BigInt(`0x${Buffer.from(randPrivateKey, "hex").toString('hex')}`);
}

export function toEthAddress(PublicKey) {
    const stAA = keccak256(Buffer.from(PublicKey, 'hex').slice(1)).toString(16);
    return "0x"+stAA.slice(-40);
}