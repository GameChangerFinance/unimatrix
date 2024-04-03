/**
 * Unimatrix Sync library for Cardano
 * 
 * A set of helpers to standardize a basic data exchange protocol 
 * to share Cardano transactions and signatures using Unimatrix
 * 
 * Main use case are multi-signature or deferred-signature scenarios
 * involving wallets, dapps and services
 * 
 */

import {genDataKey,getData,GET_TIMEOUT_MS,onData,setData, UnimatrixDataStore, UnimatrixDecryptFn, UnimatrixEncryptFn, UnimatrixUserError, UnimatrixValidatorFn,UnimatrixValidatorFnArgs, UnimatrixValidatorMap} from  '../unimatrix';
import { JSONStringify, logger,UnimatrixDB, UnimatrixDBDataNode } from '../common';
import sha512 from 'crypto-js/sha512';
import crypto from 'crypto';

export type DLTTag              = "cardano" | "forkano" | "guild" | "shareslake"
export type NetworkTag          = "mainnet" | "preprod" | "preview" | "legacy"
export type CardanoValidatorTag = 'sha512' | 'cardano.TxHashHexList' | 'cardano.vkWitnessHex' | 'cardano.txHex';

//export const defaultTimeoutMs   =1000*5;//5 seconds
export const SALT_SIZE          = 32
export const NONCE_SIZE         = 12

export type CardanoSerializationLib = any;

export function randomBytes(size:number) {
	return Buffer.from(crypto.getRandomValues(new Uint8Array(size)))
}

export const genUnimatrixIdFromTxHashes=(txHashes:string[])=>{
    const data=txHashes
    .filter(x=>!!(x||"").trim())
    .sort()
    .join('-');
    return sha512(data).toString();
}

export const encryptDataFactory=(CSL:any):UnimatrixEncryptFn=>(args)=>{
    try{
        if(!CSL)
            throw new Error("Missing CSL");
        if(args.path.length<=0 || !args.id || !args.validator)
            throw new Error(`Missing parts`);
        if( args.path.some(x=>!x.trim()) )
            throw new Error(`Path items cannot be empty`);         
        let _CardanoWasm=CSL;                       
        const json      =JSONStringify(args.store.file);
        const idHash    =sha512(args.id).toString();
        const publicDataHex=Buffer.from(
            JSONStringify({updatedAt:args.store.updatedAt})
        ).toString('hex');
        const password  =`${idHash}:${publicDataHex}:${args.validator}:${args.path.join('/')}`;
        const salt      =randomBytes(SALT_SIZE);
        const nonce     =randomBytes(NONCE_SIZE);   
        const cypherHex =_CardanoWasm.encrypt_with_password(
            Buffer.from(password).toString('hex'),
            Buffer.from(salt).toString('hex'),
            Buffer.from(nonce).toString('hex'),
            Buffer.from(json).toString('hex')
        );        
        const file=`${publicDataHex}:${cypherHex}`;
        return file;
    }catch(err){
        throw new Error(`Unimatrix encryption error: ${err}`);
    }    
}
export const decryptDataFactory=(CSL:any):UnimatrixDecryptFn=>(args)=>{
    try{
        if(!CSL)
            throw new Error("Missing CSL");
        if(args.path.length<=0 || !args.id || !args.validator)
            throw new Error(`Missing parts`);
        if( args.path.some(x=>!x.trim()) )
            throw new Error(`Path items cannot be empty`);         
        if(typeof args.store !== "string")
            throw new Error(`Invalid storage`);             
        const [publicDataHex,cypherHex]=(args.store||"").split(':');
        if(!cypherHex)
            throw new Error(`Missing encrypted data`);             
        if(!publicDataHex)
            throw new Error(`Missing public data`);
        
        const idHash    =sha512(args.id).toString();                
        const password  =`${idHash}:${publicDataHex}:${args.validator}:${args.path.join('/')}`;
        const jsonHex   =CSL.decrypt_with_password(
            Buffer.from(password).toString('hex'),
            cypherHex
        );
        const file=JSON.parse(Buffer.from(jsonHex,"hex").toString());        
        const {updatedAt}=JSON.parse(Buffer.from(publicDataHex,"hex").toString())||{};
        return {file,updatedAt};
    }catch(err){
        throw new Error(`Unimatrix decryption error: ${err}`);
    }    
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

export const onVkWitnessHex=async (args:{
    CSL:CardanoSerializationLib,
    db:UnimatrixDB,
    id:string,
    dltTag:DLTTag,
    networkTag:NetworkTag,
    txHash:string,
    vkHash:string,
    timeout?:number,
    cb:(args:{
        vkWitnessHex?:string,
        store?:UnimatrixDataStore,
        validationError?:string,
        userError?:string,
        timeoutError?:boolean,
        node:UnimatrixDBDataNode<string>,
        stop:()=>void,
    })=>void,
})=>onData({
    //basic
    db:args.db,
    timeout:args?.timeout,

    //specific
    id:args.id,
    validator:'cardano.vkWitnessHex',
    validators:cardanoValidatorsFactory(args.CSL),
    path:[args.dltTag,args.networkTag,args.txHash,args.vkHash],    
    encryptData:encryptDataFactory(args.CSL),
    decryptData:decryptDataFactory(args.CSL),
    on:({store,validationError,timeoutError,userError,node,stop})=>{
        const vkWitnessHex=(!!store?.file?.data && typeof store?.file?.data ==="string")
            ?store?.file?.data
            :undefined;
        return args.cb({vkWitnessHex,store,validationError,timeoutError,userError,node,stop});
    },
});

export const getVkWitnessHex=async (args:{
    CSL:CardanoSerializationLib,
    db:UnimatrixDB,
    id:string,
    dltTag:DLTTag,
    networkTag:NetworkTag,
    txHash:string,
    vkHash:string,
    timeout?:number,
})=>getData({
    //basic
    db:args.db,
    timeout:args?.timeout,  
    throwValidationErrors:!false,
    throwUserErrors:!false,
    throwTimeoutErrors:!false,
    //specific
    id:args.id,
    validator:'cardano.vkWitnessHex',
    validators:cardanoValidatorsFactory(args.CSL),
    path:[args.dltTag,args.networkTag,args.txHash,args.vkHash],    
    encryptData:encryptDataFactory(args.CSL),
    decryptData:decryptDataFactory(args.CSL),
})
.then(store=>{
    const vkWitnessHex=(!!store?.file?.data && typeof store?.file?.data ==="string")
        ?store?.file?.data
        :undefined;
    return {
        store,
        vkWitnessHex,
    };
});

export const setVkWitnessHex=async (args:{
    CSL:CardanoSerializationLib,
    db:UnimatrixDB,
    id:string,
    txHash:string,
    vkHash:string,
    networkTag:NetworkTag,
    dltTag:DLTTag,
    vkWitnessHex?:string,
    error?:UnimatrixUserError,
})=>setData({
    //basic
    db:args.db,
    checkByFetching:false,    
    //specific
    id:args.id,
    validator:'cardano.vkWitnessHex',
    validators:cardanoValidatorsFactory(args.CSL),
    path:[args.dltTag,args.networkTag,args.txHash,args.vkHash],
    store:{
        file:!!args.error
        ?{
            data:undefined,
            error:args.error
        }
        :{
            data:args.vkWitnessHex,
            error:undefined
        },
        updatedAt:Date.now(),
    },
    encryptData:encryptDataFactory(args.CSL),
    decryptData:decryptDataFactory(args.CSL),
})
.then(store=>{
    const vkWitnessHex=(!!store?.file?.data && typeof store?.file?.data ==="string")
        ?store?.file?.data
        :undefined;
    return {
        store,
        vkWitnessHex,
    };
});





////////////  txHex ////////////////


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


export const onTxHex=async (args:{
    CSL:CardanoSerializationLib,
    db:UnimatrixDB,
    id:string,
    dltTag:DLTTag,
    networkTag:NetworkTag,
    txHash:string,
    timeout?:number,
    cb:(args:{
        txHex?:string,
        store?:UnimatrixDataStore,
        validationError?:string,
        userError?:string,
        timeoutError?:boolean,
        node:UnimatrixDBDataNode<string>,
        stop:()=>void,
    })=>void,
})=>onData({
    //basic
    db:args.db,
    timeout:args?.timeout,

    //specific
    id:args.id,
    validator:'cardano.txHex',
    validators:cardanoValidatorsFactory(args.CSL),
    path:[args.dltTag,args.networkTag,args.txHash],    
    encryptData:encryptDataFactory(args.CSL),
    decryptData:decryptDataFactory(args.CSL),
    on:({store,validationError,timeoutError,userError,node,stop})=>{
        const txHex=(!!store?.file?.data && typeof store?.file?.data ==="string")
            ?store?.file?.data
            :undefined;
        return args.cb({txHex,store,validationError,timeoutError,userError,node,stop});
    },
});


export const getTxHex=async (args:{
    CSL:CardanoSerializationLib,
    db:UnimatrixDB,
    id:string,
    dltTag:DLTTag,
    networkTag:NetworkTag,
    txHash:string,
    timeout?:number,  
})=>getData({
    //basic
    db:args.db,
    timeout:args?.timeout,  
    throwValidationErrors:!false,
    throwUserErrors:!false,
    throwTimeoutErrors:!false,
    //specific
    id:args.id,
    validator:'cardano.txHex',
    validators:cardanoValidatorsFactory(args.CSL),
    path:[args.dltTag,args.networkTag,args.txHash],    
    encryptData:encryptDataFactory(args.CSL),
    decryptData:decryptDataFactory(args.CSL),
})
.then(store=>{
    const txHex=(!!store?.file?.data && typeof store?.file?.data ==="string")
        ?store?.file?.data
        :undefined;
    return {
        store,
        txHex,
    };
});

export const setTxHex=async (args:{
    CSL:CardanoSerializationLib,
    db:UnimatrixDB,
    id:string,
    txHash:string,    
    networkTag:NetworkTag,
    dltTag:DLTTag,
    txHex?:string,
    error?:UnimatrixUserError,
})=>setData({
    //basic
    db:args.db,
    checkByFetching:false,    
    //specific
    id:args.id,
    validator:'cardano.txHex',
    validators:cardanoValidatorsFactory(args.CSL),
    path:[args.dltTag,args.networkTag,args.txHash],
    store:{
        file:!!args.error
        ?{
            data:undefined,
            error:args.error
        }
        :{
            data:args.txHex,
            error:undefined
        },
        updatedAt:Date.now(),
    },
    encryptData:encryptDataFactory(args.CSL),
    decryptData:decryptDataFactory(args.CSL),
})
.then(store=>{
    const txHex=(!!store?.file?.data && typeof store?.file?.data ==="string")
        ?store?.file?.data
        :undefined;
    return {
        store,
        txHex,
    };
});




////////////  TxHashHexList ////////////////

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



export const onTxHashes=async (args:{
    CSL:CardanoSerializationLib,
    db:UnimatrixDB,
    id:string,
    dltTag:DLTTag,
    networkTag:NetworkTag,
    subPath?:string[],
    timeout?:number,
    cb:(args:{
        txHashes?:string[],
        store?:UnimatrixDataStore,
        validationError?:string,
        userError?:string,
        timeoutError?:boolean,
        node:UnimatrixDBDataNode<any>,
        stop:()=>void,
    })=>void,
})=>onData({
    //basic
    db:args.db,
    timeout:args?.timeout,
    //specific
    id:args.id,
    validator:'cardano.TxHashHexList',
    validators:cardanoValidatorsFactory(args.CSL),
    path:[args.dltTag,args.networkTag,...args.subPath||[]],    
    encryptData:encryptDataFactory(args.CSL),
    decryptData:decryptDataFactory(args.CSL),
    on:({store,validationError,timeoutError,userError,node,stop})=>{
        const txHashes=(!!store?.file?.data 
                && Array.isArray(store?.file?.data) 
                && (<Array<unknown>>store?.file?.data).every(x=>(!!x && typeof x ==="string")))
            ?store?.file?.data
            :undefined;
        return args.cb({txHashes,store,validationError,timeoutError,userError,node,stop});
    },
});


export const getTxHashes=async (args:{
    CSL:CardanoSerializationLib,
    db:UnimatrixDB,
    id:string,
    dltTag:DLTTag,
    networkTag:NetworkTag,
    subPath?:string[],
    timeout?:number,  
})=>getData({
    //basic
    db:args.db,
    timeout:args?.timeout,  
    throwValidationErrors:!false,
    throwUserErrors:!false,
    throwTimeoutErrors:!false,
    //specific
    id:args.id,
    validator:'cardano.TxHashHexList',
    validators:cardanoValidatorsFactory(args.CSL),
    path:[args.dltTag,args.networkTag,...args.subPath||[]],    
    encryptData:encryptDataFactory(args.CSL),
    decryptData:decryptDataFactory(args.CSL),
})
.then(store=>{
    const txHashes=(!!store?.file?.data 
            && Array.isArray(store?.file?.data) 
            && (<Array<unknown>>store?.file?.data).every(x=>(!!x && typeof x ==="string")))
        ?store?.file?.data
        :undefined;

    return {
        store,
        txHashes,
    };
});

export const setTxHashes=async (args:{
    CSL:CardanoSerializationLib,
    db:UnimatrixDB,
    id:string,
    networkTag:NetworkTag,
    dltTag:DLTTag,
    txHashes?:string[],
    subPath?:string[],
    error?:UnimatrixUserError,
})=>setData({
    //basic
    db:args.db,
    checkByFetching:false,    
    //specific
    id:args.id,
    validator:'cardano.TxHashHexList',
    validators:cardanoValidatorsFactory(args.CSL),
    path:[args.dltTag,args.networkTag,...args.subPath||[]],    
    store:{
        file:!!args.error
        ?{
            data:undefined,
            error:args.error
        }
        :{
            data:args.txHashes,
            error:undefined
        },
        updatedAt:Date.now(),
    },
    encryptData:encryptDataFactory(args.CSL),
    decryptData:decryptDataFactory(args.CSL),
})
.then(store=>{
    const txHashes=(!!store?.file?.data 
            && Array.isArray(store?.file?.data) 
            && (<Array<unknown>>store?.file?.data).every(x=>(!!x && typeof x ==="string")))
        ?store?.file?.data
        :undefined;
    return {
        store,
        txHashes,
    };
});