/**
 * Decentralized, encrypted, privacy preserving, self-integrity aware protocol 
 * using GunDb as shared key-value cache.
 * @module unimatrix
 * 
 * @remarks
 * 
 * There are 2 types of data that can be stored in JSON objects: **Items** or (Item) **Announcements**
 * 
 * The key-value store design consists on:
 *  - a key that is a hash of a concatenated list of private and/or public strings. The order of the list builds a 'path'
 *  - a value that is a store of private encrypted and public serialized data. 
 *  - encryption (and hash) usually reuse the secret in the path among the public strings and the validation method name.   
 *  - data validation on read and write events links and checks data against the path and the validation method used.
 *  - to read or write a value you must know its full path, and it must comply the validation method used.
 *  - the strings, or secrets used for the path are considered a private channel.
 * 
 * Security: 
 * - usually every stored data on key-value store is encrypted with a secret id
 * - usually if you know the id you can read/write encrypted data
 * - every key of the key-value store is a hash of the secret id, the (type) validator involved and the unique path of the item
 * - encryption and data lookup depends on knowing the secret id, the validator and the path of the item.
 * - non valid data types, invalid data structures, data with hash mismatch, or miss-encrypted data is automatically discarded by a reading peer
 * - id behaves like a session token, and it should be renewed after usage, for ex: after a finalized multisig operation 
 * - new private channels cannot be expected for when you don't know channel parameters, good for avoiding DDoS attacks
 * - at scale all key-value pairs populate under a common root, making listening for all pairs difficult
 * - fake value injection attacks are filtered by encryption and validators
 * - **Items**:
 *      - Items are checked against type validity tests and hash-matching tests against provided path, 
 *      - therefore provide the strongest security, 
 *      - knowing the right id for reading/writing encrypted data means nothing if data does not match required path.
 * - **Announcements**: 
 *      - are only checked against type validity, 
 *      - therefore provide the weakest security, 
 *      - anyone with the right id can read/write the encrypted data. 
 *      - but this is acceptable because of data validation
 *      - for example, announcing a sign request of injected transactions can be easily discarded by signer validators checking against transaction body validity
 *      - usually users should announce signing requests and validators in dapps should check transaction body
 *
 * 
 * Basic operations:
 * - `setData`: encrypts and writes data at a path
 * - `getData`: reads and decrypt first valid data from a path with a timeout
 * - `onData`: reads all incoming data at a path and tries to validate and decrypt it
 * 
 */

import {
    JSONStringify,
    logger,
    UnimatrixDB,
} from "./common";

import Gun,{IGunInstance,IGunChain} from 'gun';
import sha512 from 'crypto-js/sha512';

/**
 * root node name on GunDB
 */
export const ROOT_NODE_KEY  ="root";

/**
 * default timeout in milliseconds for getters like `getData`
 */
export const GET_TIMEOUT_MS = 1000*10;



 /**
 * Validator name or tag
 * 
 * @remarks
 * 
 * Validators naming convention:
 * 
 * - those starting in uppercase are for (Item) **Announcements**, where path is not used to verify data integrity
 * - those starting in lowercase are for **Items**, where standardized path is used to verify data integrity
 *
*/
export type UnimatrixValidatorTag = string;
/**
 * Custom user errors reported by Unimatrix nodes
 */
export type UnimatrixUserError = string;
/**
 * Unimatrix data structure. Usually or data or error is stored.
 */
export type UnimatrixData = {
    data:any|undefined,
    error:undefined,
}|{   
    data:undefined,
    error:UnimatrixUserError,
}
/**
 * An un-encrypted and decoded representation of a `UnimatrixData` file and some metadata. 
 */
export type UnimatrixDataStore={
    file:UnimatrixData,
    updatedAt:number
};
/**
 * An encrypted and encoded representation of a `UnimatrixDataStore`. Some parts like metadata can be public, some parts like `UnimatrixData` file are encrypted.
 */
export type UnimatrixEncryptedDataStore = string;
/**
 * Arguments for a `UnimatrixValidatorFn`, basically channel parameters and the `UnimatrixDataStore` data to validate.
 */
export type UnimatrixValidatorFnArgs = {
    id:string,
    validator:UnimatrixValidatorTag,
    path:string[],
    store:UnimatrixDataStore,
}
/**
 * Unimatrix data validator function. It validates `UnimatrixDataStore` data based on channel parameters.
 */
export type UnimatrixValidatorFn =(args:UnimatrixValidatorFnArgs)=>true|string;
/**
 * Modules built on top of Unimatrix can define validator maps, well known key-value structures with `UnimatrixValidatorTag` keys  and `UnimatrixValidatorFn` as values.
 */
export type UnimatrixValidatorMap={[validatorTag:string]:UnimatrixValidatorFn};
/**
 * Functions that encrypt and encode private and public data from a `UnimatrixDataStore` using channel parameters and returns a `UnimatrixEncryptedDataStore`
 */
export type UnimatrixEncryptFn=(args:{
    id:string,
    validator:UnimatrixValidatorTag,
    path:string[],
    store:UnimatrixDataStore,
})=>UnimatrixEncryptedDataStore;
/**
 * Functions that decode and decrypt private and public data from a `UnimatrixEncryptedDataStore` using channel parameters and returns a `UnimatrixDataStore`
 */
export type UnimatrixDecryptFn=(args:{
    id:string,
    validator:UnimatrixValidatorTag,
    path:string[],
    store:UnimatrixEncryptedDataStore,
})=>UnimatrixDataStore;


/**
 * Function that generates a Unimatrix hash string based on channel parameters that will be used as key for storing a `UnimatrixEncryptedDataStore` on a GunDb node key-value structure
 * @param args 
 */
export const genDataKey=(args:{
    id:string,
    validator:UnimatrixValidatorTag,
    path:string[],
})=>{
    if(args.path.length<=0 || !args.id || !args.validator)
        throw new Error(`Missing parts. Cannot generate unimatrix key`);
    if( args.path.some(x=>!x || !x?.trim()) )
        throw new Error(`Path items cannot be empty. Cannot generate unimatrix key`);
    const path=`${args.id}:${args.validator}:${args.path.join('/')}`;
    const key=sha512(path).toString()
    if(logger) logger.log(`[UNIMATRIX] KEY`,{path,key})
    return {key,path};
}


/**
 * Listener function that triggers the `on()` callback every time an **Item** or an **Announcement** (`UnimatrixDataStore`) is received on a specific channel.
 * @param args 
 */
export const onData=(args:{
    db:UnimatrixDB,
    id:string,
    validator:UnimatrixValidatorTag,
    validators:UnimatrixValidatorMap,
    path:string[],        
    change?:boolean,
    timeout?:number,
    encryptData:UnimatrixEncryptFn,//normalized args, but currently not required
    decryptData:UnimatrixDecryptFn,
    on:(args:{
        store?:UnimatrixDataStore,
        validationError?:string,
        userError?:string,
        timeoutError?:boolean,
        node:IGunChain<string>,
        stop:()=>void,
    })=>void,
}):void=>{

    if(!args.db)
        throw new Error("Missing GunDb connection");            
    if(!args.validators)
        throw new Error("Missing validator definitions");
    if(!args.validator)
        throw new Error("Missing validator tag");
    // if(!args.encryptData)
    //     throw new Error("Missing encrypting function");
    if(!args.decryptData)
        throw new Error("Missing decrypting function");


    const validatorFn=args.validators[args.validator]        
    if(!validatorFn)
        throw new Error("Unknown validator");

        let halt=false;
        const stop=()=>{
            try{
                halt=true;
                node.off();                
            }catch(err){};
        }
        const {key,path}=genDataKey(args);
        const node = args.db
            .get(ROOT_NODE_KEY)
            .get(key);
    
        if(args?.timeout){
            setTimeout(()=>{
                if(halt)
                    return;
                stop();
                if(logger) logger.error(`[UNIMATRIX] GET TimeoutError`,{path,key,timeout:args.timeout})
                return args.on({
                    store:undefined,
                    node,
                    timeoutError:true,
                    stop,
                });                        
            },args.timeout);
        }
       
        node.on((_node,_key)=>{ 
            try{                
                if(halt){  
                    stop();
                }            
                const {file,updatedAt} = args.decryptData({...args,store:_node});
                const {data,error}     = file||{};
                if(!error){
                    const isValid      = validatorFn({...args,store:{file,updatedAt}});
                    if(isValid!==true){
                        if(logger) logger.error(`[UNIMATRIX] GET ValidationError`,{path,key,file,validationError:isValid,updatedAt})
                        return args.on({
                            store:undefined,
                            node,
                            validationError:isValid,
                            stop,
                        });
                    }
                    if(logger) logger.info(`[UNIMATRIX] GET`,{path,key,file,updatedAt})
                    return args.on({
                        store:{
                            file:{
                                data:data,
                                error:undefined,
                            },
                            updatedAt:updatedAt
                        },
                        node,
                        stop,
                    });
                }else{
                    if(logger) logger.warn(`[UNIMATRIX] GET ReceivedError`,{path,key,file,updatedAt})
                    return args.on({
                        store:{
                            file:{
                                data:undefined,
                                error:error,
                            },
                            updatedAt:updatedAt
                        },
                        node,
                        userError:error,
                        stop,
                    });                
                }            
            }catch(err){
                //most likely a data injection attack, so raising this error would be just causing too much noise
                if(logger) logger.error(`[UNIMATRIX] GET Error: ${err}.`,{path,key,_node,_key});
            }
        },{
            change:args?.change!==undefined
                ?args.change
                :true
        });
}

/**
 * Getter promise that gets a specific **Item** or **Announcement** (`UnimatrixDataStore`) from a specific channel.
 * @param args 
 */
export const getData=async (args:{
    db:UnimatrixDB,
    id:string,
    validator:UnimatrixValidatorTag,
    validators:UnimatrixValidatorMap,
    path:string[],
    throwValidationErrors?:boolean
    throwUserErrors?:boolean
    throwTimeoutErrors?:boolean
    timeout?:number,
    encryptData:UnimatrixEncryptFn,
    decryptData: UnimatrixDecryptFn,
}):Promise<UnimatrixDataStore|undefined>=>{
    return new Promise((resolve,reject)=>{    
        try{            
            onData({
                ...args,
                timeout:args?.timeout!==undefined
                    ?args.timeout
                    :GET_TIMEOUT_MS,
                on:({store,validationError,timeoutError,node,stop})=>{
                    if(args?.throwValidationErrors && validationError){
                        stop();
                        return reject(validationError);  
                    }
                    if(args?.throwUserErrors && store?.file?.error){
                        stop();
                        return reject(store?.file?.error);
                    }
                    if(timeoutError){
                        stop();
                        if(args?.throwTimeoutErrors)
                            return reject("TimeoutError")
                        else 
                            return resolve(undefined);
                    }                
                    stop();
                    return resolve(store);                
                }
            });
        }catch(err){
            return reject(`GetDataError. ${err}`);
        }
    });
}



const gunPut = (node:IGunChain<string>,val:any):Promise<true|string> => { 
    return new Promise((res,rej) => {
        let sub=node.once((data,_key) => {
            if (data !== val) 
                node.put(val, function(ack:any){     
                    sub?.off?.();
                    (sub as any)= undefined;           
                    if(ack?.err){
                        res(String(ack?.err));
                    }
                    res(true)
                });
            else {
                sub?.off?.();
                (sub as any)= undefined;
                res(true)
            }
        }); 
})};

/**
 * Setter promise that puts an **Item** or **Announcement** (`UnimatrixDataStore`) on a specific channel.
 * @param args 
 */
export const setData=async (args:{
    db:UnimatrixDB,    
    id:string,
    validator:UnimatrixValidatorTag,
    validators:UnimatrixValidatorMap,
    path:string[],       
    store:UnimatrixDataStore,     
    checkByFetching?:boolean,
    encryptData:UnimatrixEncryptFn,
    decryptData: UnimatrixDecryptFn,
}):Promise<UnimatrixDataStore|undefined>=>{
    return new Promise(async (resolve,reject)=>{
        try{            
            
            if(!args.db)
                throw new Error("Missing GunDb connection");            
            if(!args.validators)
                throw new Error("Missing validator definitions");
            if(!args.validator)
                throw new Error("Missing validator tag");
            if(!args.encryptData)
                throw new Error("Missing encrypting function");
            if(!args.decryptData)
                throw new Error("Missing decrypting function");
        
            const validatorFn=args.validators[args.validator]        
            if(!validatorFn)
                throw new Error("Unknown validator");
        
            const {key,path}=genDataKey(args);                                    
            const updatedAt=args?.store?.updatedAt||Date.now();
            if(args?.store?.file?.data){
                const isValid = validatorFn({...args,store:args.store});
                if(isValid!==true)
                    throw new Error(isValid);
            }
            const store:UnimatrixDataStore={file:args.store.file,updatedAt}
            const encryptedStore=args.encryptData({...args,...store});
            const node=args.db
                .get(ROOT_NODE_KEY)
                .get(key)
            
            const result=await gunPut(node,encryptedStore);  
            if(result!==true){
                throw new Error(result);
            }else{
                if(logger) logger.log(`[UNIMATRIX] SET`,{path,key,store,result});
            }
            if(args?.checkByFetching){                
                const retrievedData =await getData(args);
                if( 
                    JSONStringify({
                        file:{
                            data:retrievedData?.file?.data,
                            error:retrievedData?.file?.error
                        },
                        updatedAt:retrievedData?.updatedAt,
                    }) 
                    !== 
                    JSONStringify({
                        file:{
                            data:store.file?.data,
                            error:store.file?.error
                        },
                        updatedAt:store?.updatedAt,
                    })                
                )
                if(logger) logger.warn(`[UNIMATRIX] SET Error. Value not set or race condition detected.`,{path,key,file:args?.store?.file,retrievedData,node,result})                                    
            }
            return resolve(store);
        }catch(err){
            if(logger) logger.warn(`[UNIMATRIX] SET Error. ${err}`,{id:args.id,path:args.path,file:args?.store?.file})
            return reject(err);
        }        
    });
    
}

