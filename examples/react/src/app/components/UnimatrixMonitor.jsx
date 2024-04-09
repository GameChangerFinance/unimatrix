import UnimatrixListener from './UnimatrixListener';
import {gcSignTxs,gcPaymentsTxs, gcTokenSaleTxs, gcNFTSaleTxs} from "../services/gcscripts"
import { RunInWallet } from './common/RunInWallet';
import { AutoSigner } from './SignerBot';
import { blockExplorerTxUrl, TruncateMe } from './common/common';
import moment from 'moment';


/**
 * React component that listens for changes on application state for 
 * announced and broadcasted transactions under the current channel 
 * and instantiates an `AutoSigner` component for each one to validate
 * sign and reply back with the signatures
 * 
 * @param {*} props 
 */
export const UnimatrixMonitor =(props)=>{
    const {
        gun,
        peers,
        unimatrixId,
        path, 
        dltTag,
        networkTag,
        autoSigner,
        feeAddress,
        feeCoin,
        db,
        setDb,
        config,
        setConfig,    
        index,
    }=props;
    const info=JSON.stringify({
        dltTag,
        networkTag,
        connectionId:gun?._?.opt?.pid,
        peers,//:Object.keys(gun?._?.opt?.peers),
        feeAddress,
        feeCoin,
    },null,2);
    const spendKeyHash  =autoSigner?.pubSpendKeyHash;
    const stakeKeyHash  =autoSigner?.pubStakeKeyHash;    
    const walletActions={
        gcPaymentsTxs   :gcPaymentsTxs({networkTag,unimatrixId,path,peers,feeCoin,feeAddress,spendKeyHash,stakeKeyHash}),
        gcTokenSaleTxs  :gcTokenSaleTxs({networkTag,unimatrixId,path,peers,feeCoin,feeAddress,spendKeyHash,stakeKeyHash}),
        gcNFTSaleTxs    :gcNFTSaleTxs({networkTag,unimatrixId,path,peers,feeCoin,feeAddress,spendKeyHash,stakeKeyHash}),
    }
    return <div className="text-start">
        
        <UnimatrixListener {...{    
            gun,
            unimatrixId,
            path, 
            dltTag,
            networkTag,
            setDb,
            config,
        }} />

        <h4 className="bg-dark p-2 rounded" title={`Listening ${autoSigner?"and signing transactions automatically":"for announced transactions"} on a ${dltTag} ${networkTag} encrypted channel`}>#{index}: <TruncateMe str={networkTag}/> | <TruncateMe str={unimatrixId} label={"****"} tooltip="private channel ID"/> | <TruncateMe str={path.join('/')}/></h4>
        {!!autoSigner && <div>            
                <h6 title={info} className="text-success m-0 p-0 d-inline"><i className="mdi mdi-key"/> Signer Bot Mode </h6>                                
                <span className="text-muted pl-2">( <b>spend key:</b> <TruncateMe str={autoSigner?.pubSpendKeyHash}/> | <b>stake key:</b> <TruncateMe str={autoSigner?.pubStakeKeyHash}/> )</span>                 
        </div>}
        {!autoSigner && <div>            
                <h6 title={info} className="text-info m-0 p-0"><i className="mdi mdi-antenna"/> Passive Mode</h6>                                
        </div>}
        <div className="p-1">
        {Object.entries(walletActions).map(([walletActionKey,walletAction])=>
            <RunInWallet 
                key     ={walletActionKey}
                gcscript={walletAction?.code}
                network ={networkTag}
                usePopUp={true}
            />)}
        </div>
        <ul>
            {Object.keys(db?.txGroup||{}).map((txGroupId,txGroupIndex)=>{
                const txHexList         =Object.values(db?.txGroup[txGroupId]||{}).map(txItem=>txItem.txHex||"");
                const enableSignAction  =Object.values(db?.txGroup[txGroupId]||{}).every(txItem=>!!txItem.txHex);               
                const signAction     =enableSignAction
                    ?gcSignTxs({networkTag,unimatrixId,path,peers,txHexList})
                    :undefined
                const itemLabel=`${txHexList.length} ${txHexList.length>1?"transactions":"transaction"}`;                
                return  <li key={`${unimatrixId}-${txGroupId}`}>
                    <hr/>
                    <div className="row ">
                        <div className="col text-start">
                        <b>Announcement #{txGroupIndex+1} ID:</b> <TruncateMe str={txGroupId}/>
                        </div>
                        <div className="col text-end">
                            <RunInWallet 
                                gcscript={signAction?.code}
                                network ={networkTag}
                                usePopUp={true}
                                tooltip ={`Sign ${itemLabel} using GameChanger Wallet`}
                                label   ={`Sign ${txHexList.length>1?"all":""} manually`}
                            />
                        </div>
                    </div>
                    <ul>
                        {Object.keys(db?.txGroup[txGroupId]||{}).map((txHash,txIdx)=>{
                            const itemUpdatedAt=db?.txGroup[txGroupId][txHash]?.updatedAt;
                            const blockExplorerUrl=blockExplorerTxUrl(txHash,networkTag);
                            const txHex=db?.txGroup[txGroupId][txHash]?.txHex||"??";
                            return <li key={`${unimatrixId}-${txGroupId}-${txHash}`}>
                                <b>Transaction #{txIdx+1}: </b> 
                                <TruncateMe str={txHash}/>
                                {" "}
                                {blockExplorerUrl && <a href={blockExplorerUrl} title={`View transaction ${txIdx+1} in block explorer`} target="_blank">View <i className="mdi mdi-link-variant"/></a>}
                                        
                                {autoSigner && <div>
                                    <AutoSigner
                                        {...{
                                            config,
                                            setConfig,
                                            txHash,
                                            txHex,
                                            autoSigner,
                                            feeAddress,
                                            feeCoin,
                                            gun,
                                            unimatrixId,
                                            path, 
                                            dltTag,
                                            networkTag,
                                        }}
                                    />
                                </div>}                                
                                <div>
                                    {itemUpdatedAt && <i>updated {moment(itemUpdatedAt).fromNow()}</i>}
                                </div>
                            </li>                            
                        })}
                    </ul>
                </li>                    
            })}
        </ul>
    </div>
}


export default UnimatrixMonitor;
