import {useEffect} from 'react';
import {cardano as CardanoSync} from '@gamechanger-finance/unimatrix'
import CardanoWasm from '../services/cardanoWasm';

/**
 * React component that listens for announced transaction groups on Unimatrix Sync,
 * retrieves the transaction (hexadecimal encoded CBOR structure)
 * and populates the React application state with all the data for `UnimatrixMonitor` 
 * component to render it and trigger transaction validation and signing.
 * 
 * @param {*} param0 
 */
export const UnimatrixListener =({
    gun,
    unimatrixId,
    path, 
    dltTag,
    networkTag,
    setDb,
    config,
})=>{

    const params={
        CSL:CardanoWasm(),
        db:gun,
        dltTag,
        networkTag,
        id:unimatrixId,
        subPath:path, 
    }
    /**
     * Helper to register a group of announced transaction hashes (transaction ID's) on state
     * @param {*} param0 
     */
    const registerTxHashes=({txHashes})=>{
        if(txHashes?.length<=0)
            return;
        const txGroupId=CardanoSync.genUnimatrixIdFromTxHashes(txHashes);
        if (!txGroupId)
            return;
        setDb(oldDb=>{
            const newDb={...oldDb||{}}
            if(!newDb.txGroup)
                newDb.txGroup={};
            if(!newDb.txGroup[txGroupId])
                newDb.txGroup[txGroupId]={};                                                        
            txHashes.forEach(txHash => {                            
                if(!newDb.txGroup[txGroupId][txHash])
                    newDb.txGroup[txGroupId][txHash]={txHex:"",updatedAt:undefined}
            });       
            return newDb;                     
        });
        return txGroupId;
    }
    /**
     * Helper to register a broadcasted transaction (hexadecimal encoded CBOR structure) on state
     * @param {*} param0 
     */
    const registerTxHex=({txGroupId,txHash,txHex,updatedAt})=>{
        if(!txHex || !txGroupId || !txHash)
            return;
        setDb(oldDb=>{
            const newDb={...oldDb||{}}
            if(!newDb.txGroup)
                newDb.txGroup={};
            if(!newDb.txGroup[txGroupId])
                newDb.txGroup[txGroupId]={};                                                                    
            if(!newDb.txGroup[txGroupId][txHash])
                newDb.txGroup[txGroupId][txHash]={txHex:"",updatedAt:undefined}
            newDb.txGroup[txGroupId][txHash]={txHex,updatedAt}   
            return newDb;                                     
        });
        return txHex;
    }


    useEffect(()=>{
        if(!gun || !unimatrixId ||!path ) 
            return
        (async()=>{

            //We listen for announced group of transaction hashes
            CardanoSync.onTxHashes({
                ...params,
                cb:async ({txHashes,validationError,userError,timeoutError,store,node,stop})=>{
                    if(validationError||userError||timeoutError)
                        console.warn(`onTxHashes(): Error. ${JSON.stringify({validationError,userError,timeoutError,node})}`);
                    if(txHashes){
                        const updatedAt=store.updatedAt||0;
                        // we register the transaction hashes
                        const txGroupId=registerTxHashes({txHashes})
                        // console.info(`[${path.join('/')}]: Data = ${JSON.stringify({txGroupId,txHashes})}`);
                        txHashes.forEach(txHash => {
                            // for each transaction hash we try to retrieve the transaction data (CBOR hex)
                            CardanoSync.getTxHex({...params,txHash})
                                //we register the transaction data
                                .then(({txHex})=>registerTxHex({txGroupId,txHash,txHex,updatedAt}))
                                .catch(err=>{
                                    console.warn(`Warning: Failed to fetch transaction '${txHash}'.${err||"Unknown error"}`);
                                    return {};
                                });
                        
                        });
                    }
                },
            });
        })();

    },[gun,config.CSL,unimatrixId,path]);
    return null;
}



export default UnimatrixListener;