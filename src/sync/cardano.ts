/**
 * Unimatrix Sync library for Cardano
 * 
 * A set of helpers to standarize a basic data exchange protocol 
 * to share Cardano transactions and signatures using Unimatrix
 * 
 * Main usecase are multi-signature or deferred-signature scenarios
 * involving wallets, dapps and services
 * 
 */

import {genDataKey,UnimatrixValidatorFnArgs, UnimatrixValidatorMap} from  '../unimatrix';
import {logger} from '../common';
import sha512 from 'crypto-js/sha512';

export type DLTTag              = "cardano" | "forkano" | "guild" | "shareslake"
export type NetworkTag          = "mainnet" | "preprod" | "preview" | "legacy"
export type CardanoValidatorTag = 'sha512' | 'cardano.TxHashHexList' | 'cardano.vkWitnessHex' | 'cardano.txHex';
export type CardanoSerializationLib = any;

export const genUnimatrixIdFromTxHashes=(txHashes:string[])=>{
    const data=txHashes
    .filter(x=>!!(x||"").trim())
    .sort()
    .join('-');
    return sha512(data).toString();
}

/**
 * Verifies a transaction witness with hexadecimal arguments provided.
 * @param args.CSL pass cardano serialization lib
 * @param args.txHash transaction hash hex
 * @param args.vkWitnessHex witness hex
 * @param args.vkHash (optional) public key hash hex. when provided will check vkHash against pub key
 */
export const verifyVkWitnessHex=(args:{
    CSL?:any,
    txHash:string,
    vkHash?:string, //
    vkWitnessHex:string,
  }):true|string=>{
    if(logger) logger?.log(`verifyVkWitnessHex():`,{args});
    try{
      let _CardanoWasm=args.CSL;
      if(!args.CSL)
        return "missing CSL";
      if(!args.txHash)  
        return "missing transaction hash";
      if(typeof args.txHash!=="string")  
        return "invalid transaction hash";        
      if(!args.vkWitnessHex)  
        return "missing transaction witness";      
      if(typeof args.vkWitnessHex!=="string")  
        return "invalid transaction witness";              
      const txHashObj    = _CardanoWasm.TransactionHash.from_hex(args.txHash)
      const vkWitnessObj = _CardanoWasm.Vkeywitness.from_hex(args.vkWitnessHex);
      const pubKeyObj    = vkWitnessObj.vkey().public_key();
      const keyHashObj   = pubKeyObj.hash();
      const keyHashHex   = keyHashObj.to_hex()
      if(args.vkHash && args.vkHash  !== keyHashHex)
        return `unexpected witness ${keyHashHex}`;
      const signatureObj = vkWitnessObj.signature();
      if(pubKeyObj.verify(txHashObj.to_bytes(),signatureObj)!=true)
        return "invalid witness";
      return true;
    }catch(err){
        if(logger) logger.warn(`verifyVkWitnessHex(): unexpected error. ${err}`,{
            txHash:args?.txHash,
            vkHash:args?.vkHash,
            vkWitnessHex:args?.vkWitnessHex,
        })
    }
    return "invalid data provided";
}


export const cardanoValidatorsFactory=(CSL:any):UnimatrixValidatorMap=>({
    //'sha512'                     :(args:UnimatrixValidatorFnArgs)=>{return "TODO"},
    'cardano.TxHashHexList':(args:UnimatrixValidatorFnArgs)=>{  
        if(args?.store.file?.error && typeof args?.store.file?.error!=="string")
            return "Invalid error type";
        const txHashes:string[]=args?.store.file?.data||[];
        const areValid=txHashes.every(txHash=>{
            try{
                if(CSL.TransactionHash.from_hex(txHash).to_hex()===txHash)
                    return true;           
            }catch(err){if(logger) logger.warn(`[UNIMATRIX] Validator '${args?.validator}' Error: ${err}`,args)}
            return false;
        });
        if(areValid!==true)
            return "Invalid transaction hash"
        return true;
    },
    'cardano.vkWitnessHex'       :(args:UnimatrixValidatorFnArgs)=>{
        if(args?.store.file?.error && typeof args?.store.file?.error!=="string")
            return "Invalid error type";        
        try{
            const [dltTag,networkTag,txHash,vkHash] = args.path||[];
            return verifyVkWitnessHex({CSL:CSL,txHash,vkHash,vkWitnessHex:args?.store.file?.data})
        }catch(err){if(logger) logger.warn(`[UNIMATRIX] Validator '${args?.validator}' Error: ${err}`,{args})}
        return "Invalid transaction witness";
    },
    'cardano.txHex'              :(args:UnimatrixValidatorFnArgs)=>{
        if(args?.store.file?.error && typeof args?.store.file?.error!=="string")
            return "Invalid error type";
        try{
            const txHex:string=args?.store.file?.data||"";        
            const [dltTag,networkTag,txHash] = args.path||[];
            const txObj 	    = CSL.Transaction.from_hex(txHex) //.from_bytes(fromHex(txHex))           
            const txBodyObj	    = txObj.body() //args.CSL.TransactionBody.from_bytes(fromHex(txHex))
            const networkId     = txBodyObj.network_id()?.kind();
            if(networkId!==undefined){
                const networkTags={
                    [CSL.NetworkInfo.mainnet()         .network_id()]:'mainnet',
                    [CSL.NetworkInfo.testnet_preprod() .network_id()]:'preprod',
                    //[CSL.NetworkInfo.testnet_preview() .network_id()]:'preview',// key collision!!!, solve based on app context data
                };
                const realNetworkTag=networkTags[networkId];
                if(realNetworkTag!==networkTag)
                    return `This is a '${realNetworkTag||"unknown network"}' transaction. Wrong network`
            }
            const txHashObj  	= CSL.hash_transaction(txBodyObj);
            const realTxHash    = txHashObj.to_hex();
            if(realTxHash!==txHash)
                return "Transaction hash mismatch"                        
            return true;           
        }catch(err){if(logger) logger.warn(`[UNIMATRIX] Validator '${args?.validator}' Error: ${err}`,args)}
        return "Invalid transaction"
    },
})



////////////  vkWitnessHex ////////////////

//file:{data:vkWitnessHex,error:undefined},
export const genVkWitnessHexKey=(args:{
    id:string,
    dltTag:DLTTag,
    networkTag:NetworkTag,
    txHash:string,
    vkHash:string,
})=>genDataKey({
    id:args.id,
    validator:'cardano.vkWitnessHex',
    path:[args.dltTag,args.networkTag,args.txHash,args.vkHash],
});


////////////  txHex ////////////////


//file:{data:txHex,error:undefined},                
export const genTxHexKey=(args:{
    id:string,
    dltTag:DLTTag,
    networkTag:NetworkTag,
    txHash:string,
})=>genDataKey({
    id:args.id,
    validator:'cardano.txHex',
    path:[args.dltTag,args.networkTag,args.txHash],
});

////////////  TxHashHexList ////////////////

//file:{data:txHashList,error:undefined},
export const genTxHashesKey=(args:{
    id:string,//getUnimatrixIdFromTxHashes(txHashList)
    dltTag:DLTTag,
    networkTag:NetworkTag,
    subPath?:string[],
})=>genDataKey({
    id:args.id,
    validator:'cardano.TxHashHexList',
    path:[args.dltTag,args.networkTag,...args?.subPath||[]],
});


