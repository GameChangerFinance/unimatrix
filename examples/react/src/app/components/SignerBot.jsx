import { useEffect, useState } from "react";
import { signTxIf } from "../services/wallet";
import {cardano as CardanoSync} from '@gamechanger-finance/unimatrix'
import {CopyToClipboard, TruncateMe} from './common/common';
import CardanoWasm from '../services/cardanoWasm';

/**
 * React component that receives a `txHex` property, validates that transaction using `autoSigner` data and
 * shares the transaction key witnesses (signatures) over Unimatrix Sync or a rejection reason.
 *  
 * @param {*} param0 
 */
export const AutoSigner=({
    gun,
    config,
    dltTag,
    networkTag,
    unimatrixId,
    autoSigner,
    feeAddress,
    feeCoin,
    txHash,
    txHex,    
})=>{    
    const params={
        CSL:CardanoWasm(),
        db:gun,
        dltTag,
        networkTag,
        id:unimatrixId,
    }

    const [status,setStatus]=useState({
        loading:false,
        witnesses:{
            spend:undefined,
            stake:undefined,
        }
    });

    useEffect(()=>{
        const CSL=CardanoWasm();
        if(!autoSigner || !txHex || !networkTag || !CSL)
            return;
        (async()=>{
            setStatus(oldStatus=>{return{
                ...oldStatus,
                loading:true,                
            }});

            //custom validator function that will check if the transaction
            //is paying a service fee to `feeAddress`
            const feeCondition=async({txJson,txHash:_txHash,vkHash})=>{                
                if(txHash!==_txHash){
                    console.error("[Signer Bot]: transaction hash mismatch",{txHash,_txHash});
                    return Promise.reject("validator error");
                }
                const requiredSigners=txJson?.body?.required_signers||[];
                const outputs=txJson?.body?.outputs||[];
                let isValid=outputs.some((output,outputIndex)=>{
                    const {address,amount:{coin}}=output||{};
                    if(address!==feeAddress){
                        return false;
                    }        
                    const feeCoinObj=CSL.BigNum.from_str(String(feeCoin));
                    const coinObj=CSL.BigNum.from_str(coin);
                    if(coinObj.compare(feeCoinObj)<0)
                        return false;
                    
                    return true;                     
                });    
                const isRequired=requiredSigners.includes(vkHash);
                const doSign=isRequired && isValid;
                
                let error=undefined;
                // if(!isRequired) 
                //     error= `Signature not required explicitly`; //not an error to report back to user
                if(isRequired && !isValid) 
                    error= `You didn't pay ${feeCoin} lovelaces`; //error to report back to user

                console.info(`[Signer Bot]: ${doSign?"signed":"rejected"}. ${error||""}`,{doSign,error,isRequired,isValid,txHash,vkHash,txJson,feeAddress,feeCoin});
         
                return Promise.resolve({doSign,error});
            }
            // we sign the transaction and get the signatures if it passes the `feeCondition` validation 
            const witnesses=await signTxIf({
                txHex,            
                wallet:autoSigner,
                conditions:{
                    spend:feeCondition,
                    stake:feeCondition,
                }
            });    
            //we store the signatures on component state
            setStatus(oldStatus=>{return{
                ...oldStatus,
                loading:false,
                witnesses,
            }});
        })();
    },[
        dltTag,
        networkTag,
        unimatrixId,
        autoSigner,
        txHash,
        txHex,        
    ]);

    //on component state changes
    useEffect(()=>{
        if(!autoSigner)
            return;
        if(status?.loading || !status?.witnesses)
            return;
        (async()=>{
            //if spend key signature (or rejection error) was obtained, lets share it through Unimatrix Sync
            if(status?.witnesses?.spend || status?.witnesses?.spendError )
                CardanoSync.setVkWitnessHex({...params,
                    txHash,
                    txHex,
                    vkHash:autoSigner?.pubSpendKeyHash,
                    vkWitnessHex:status?.witnesses?.spend,
                    error:status?.witnesses?.spendError,
                }).catch(err=>console.error(`AutoSigner(): Error. ${err}`));

            //if stake key signature (or rejection error) was obtained, lets share it through Unimatrix Sync
            if(status?.witnesses?.stake || status?.witnesses?.stakeError )
                CardanoSync.setVkWitnessHex({...params,
                    txHash,
                    txHex,
                    vkHash:autoSigner?.pubStakeKeyHash,
                    vkWitnessHex:status?.witnesses?.stake,
                    error:status?.witnesses?.stakeError
                }).catch(err=>console.error(`AutoSigner(): Error. ${err}`));
        })();


    },[status?.loading,status?.witnesses])

    if(!autoSigner || !txHash)
        return;

    return <>
        {status?.loading && <>
            <span>signing...</span>        
        </>}
        {!status?.loading && <>
            {txHex && <>
                <span>Bot signatures: </span>
                {!status?.witnesses?.spend && !status?.witnesses?.stake && <i>none</i>}
                {status?.witnesses?.spendError && <span title={status?.witnesses?.spendError} className="badge rounded-pill bg-warning mx-1"><i className="mdi mdi-alert"/> <TruncateMe label="spend signature rejected" str={status?.witnesses?.spendError} /> </span>}
                {status?.witnesses?.stakeError && <span title={status?.witnesses?.stakeError} className="badge rounded-pill bg-warning mx-1"><i className="mdi mdi-alert"/> <TruncateMe label="stake signature rejected" str={status?.witnesses?.spendError} /> </span>}
                {status?.witnesses?.spend && <span title={status?.witnesses?.spend} className="badge rounded-pill bg-success mx-1"><i className="mdi mdi-check-circle"/> <CopyToClipboard subject="spend key transaction witness (signature)" text={status?.witnesses?.spend}> spend </CopyToClipboard></span>}
                {status?.witnesses?.stake && <span title={status?.witnesses?.stake} className="badge rounded-pill bg-success mx-1"><i className="mdi mdi-check-circle"/> <CopyToClipboard subject="stake key transaction witness (signature)" text={status?.witnesses?.stake}> stake </CopyToClipboard></span>}          
            </>}
            {!txHex && <>
                <span>awaiting transaction data...</span>
            </>}
        </>}
    </>
}