import * as CardanoWasm from '@emurgo/cardano-serialization-lib-browser';

const debugMe=true;

let _CardanoWasm:typeof import ('@emurgo/cardano-serialization-lib-browser');

/**
 * CSL loader for setups where dynamic wasm imports are not allowed. 
 * @param cb 
 */
export const loadModule=async (cb?:Function)=>{
    if(_CardanoWasm)
        return Promise.resolve(_CardanoWasm);
    if(debugMe) console.log("[CardanoWasm] Loading...")
    _CardanoWasm = CardanoWasm;//await import ('@emurgo/cardano-serialization-lib-browser'); 
    if(debugMe) console.log("[CardanoWasm] Ready")
    if(cb)
        cb(_CardanoWasm);
    return Promise.resolve(_CardanoWasm);
}
const moduleGetter=()=>_CardanoWasm;

loadModule();

export default moduleGetter;
