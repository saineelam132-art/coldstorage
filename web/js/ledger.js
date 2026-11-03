// Same hash-chain rules as engine/ledger.py, so a phone can re-check every block itself.
import { sha256 } from './sha256.js';

export const GENESIS_PREV = '0'.repeat(64);
const KEYS = ['T_min', 'T_avg', 'T_max', 'RH_avg', 'door_min', 'pcm_pct'];

export function blockString(b) {
  const summ = KEYS.map(k => `${k}=${Number(b.summary[k]).toFixed(2)}`).join(';');
  return [b.index, b.timestamp, b.batch_ids.join(','), summ, b.flag, b.prev_hash].join('|');
}
export const blockHash = b => sha256(blockString(b));

// For a list of CONSECUTIVE blocks: is each block's own hash right, and does it link to the one before?
export function verifyBlocks(blocks) {
  return blocks.map((b, i) => ({
    index: b.index,
    ownOk: blockHash(b) === b.hash,
    linkOk: i === 0 ? true : b.prev_hash === blocks[i - 1].hash,
  }));
}
