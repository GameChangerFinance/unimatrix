/**
 * Unified entrypoint for projects to import **Unimatrix Sync for Cardano** plus basic **Unimatrix** functions
 * @module index
 * 
 */

import {
    genDataKey,
    onData,
    getData,
    setData,
} from './unimatrix';

import * as cardano from './sync';

export {
    // basic unimatrix functions
    genDataKey,
    onData,
    getData,
    setData,
    /**
     * unimatrix-sync-cardano
     */
    cardano,
}