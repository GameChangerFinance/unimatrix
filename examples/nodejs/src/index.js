const {onTxHashes,getTxHex,setVkWitnessHex,genUnimatrixIdFromTxHashes} =require('@gamechanger-finance/unimatrix').cardano;
const CSL = require('@emurgo/cardano-serialization-lib-nodejs');
const { getConfig, getGreeting } = require('./config');
const Gun=require('gun');
const { signTxIfValid,getSigners } = require('./wallet');
const validator=require('./validator');

const { useLogger, logLevels } = require('./logger');
useLogger();

async function main(){
    const config=await getConfig(); 
    
    console.info(await getGreeting());
    const db = new Gun({
        peers:config.unimatrixPeers,
    });
    console.info(` 🔌 Connected to GunDb using relays '${config.unimatrixPeers.join(', ')}'`);
    const signers=getSigners({config,validator});
    const params={
        CSL,
        db,
        dltTag:config.dltTag,
        networkTag:config.networkTag,
        id:config.unimatrixId,
        subPath:config.unimatrixTxSubPath, 
    }
    const announcements={};
    const transactions={};
    for(const signer of signers){
        const vkHash=signer.vkHash;
        const signerId=signer.signerId;
        console.info(` 🖊️ Signer: '${signerId}' validating and signing with key hash '${vkHash}'`);
    }
    console.info(` 🚀 Listening for transactions announcements on the private Unimatrix Sync channel '${config.unimatrixId}', sub path '${config.unimatrixTxSubPath}',  for ${config.dltTag} ${config.networkTag} network`);
    onTxHashes({
        ...params,
        cb:async ({txHashes,validationError,userError,timeoutError,store,node,stop})=>{
            if(validationError)
                console.warn(`Warning: ValidationError: ${validationError}. Received ${JSON.stringify(node)}`);
            if(userError)
                console.warn(`Warning: UserError: ${userError}. Received ${JSON.stringify(node)}`);
            if(timeoutError)
                console.warn(`Warning: TimeoutError. This is unexpected`);
            if(txHashes){
                const updatedAt=store.updatedAt||0;
                const announcementKey=`${genUnimatrixIdFromTxHashes(txHashes)}`
                console.info(`[INCOMING] 👁️ ${announcements[announcementKey]?'Known':'New'} transactions announced: '${txHashes.join(', ')}' `);
                announcements[announcementKey]={txHashes,updatedAt};
                console.dir({announcements},{depth:6});
                for (const txHash of txHashes) {
                    const {txHex}=await getTxHex({...params,txHash})
                        .catch(err=>{
                            console.warn(`Warning: Failed to fetch transaction '${txHash}'.${err||"Unknown error"}`);
                            return {};
                        });
                    console.info(`[INCOMING] ⬇️ ${transactions[txHash]?.txHex?'Known':'New'} CBOR received for transaction '${txHash}' `);
                    transactions[txHash]={updatedAt,txHex,vkWitnesses:{
                        ...transactions[txHash]?.vkWitnesses||{},
                    }};
                    if(txHex){
                        for(const signer of signers){
                            const vkHash=signer.vkHash;
                            const signerId=signer.signerId;
                            let result=transactions[txHash].vkWitnesses[vkHash];
                            const inCache=!!result;
                            if(!inCache)
                                 result=await signTxIfValid({...signer,txHash,txHex})
                                    .catch(err=>{
                                        console.warn(`Warning: Failed to validate and sign transaction '${txHash}'.${err?.message||"Unknown error"}`);
                                    });
                            if(!!result)
                                transactions[txHash].vkWitnesses[vkHash]={
                                    ...result,
                                    updatedAt:Date.now(),
                                    inCache,
                                };
                            const vkWitnessHex          =transactions[txHash].vkWitnesses[vkHash]?.vkWitnessHex;
                            const vkWitnessUserError    =transactions[txHash].vkWitnesses[vkHash]?.error;
                            //if(vkWitnessHex)
                                await setVkWitnessHex({...params,txHash,txHex,vkHash,vkWitnessHex})
                                    .then(err=>{
                                        if(vkWitnessHex)                                        
                                            console.info(`[OUTGOING] ✅ Sent ${inCache?'cached':'new'} signature from '${signerId}' ('${vkHash}') for transaction '${txHash} to the network`);
                                        if(vkWitnessUserError)
                                            console.warn(`[OUTGOING] ❌ Sent ${inCache?'cached':'new'} signature rejection from '${signerId}' ('${vkHash}') for transaction '${txHash} to the network. Reason: ${vkWitnessUserError}`);
                                    })
                                    .catch(err=>{
                                        console.warn(`Warning: Failed to share  signature from '${signerId}' ('${vkHash}') for transaction '${txHash}'.${err?.message||"Unknown error"}`);
                                    })
                            
                        }
                        console.dir({transactions},{depth:5});
                    }
                }
            }
        }
    });
}

main();