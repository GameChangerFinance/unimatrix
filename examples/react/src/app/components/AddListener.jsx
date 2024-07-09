import { TapToChange, useInput } from "./common/common";
import Gun from 'gun';
import { generateMnemonic,getWalletData } from "../services/wallet";
import { useEffect, useState } from "react";

/**
 * React component that registers on application state a new "listener":
 * - A Unimatrix Channel setup to listen for broadcasted transactions
 * - A Cardano wallet with a spending and staking key pairs to auto-sign transactions if conditions are met
 * 
 * @param {*} param0 
 */
export const AddListener=({
    config,
    setConfig,
})=>{
    const [showPrivate, setShowPrivate] = useState(false);

    const [newId,  setNewId, setNewIdInput]  = 
    useInput({ title:"Unimatrix ID",name:"newId",type: "text", defaultValue:"multisig_1234",className:"w-100"});
    const [newPath,  setNewPath, setNewPathInput]  = 
    useInput({ title:"Announcement path",name:"newPath",type: "text", defaultValue:`${["signTxs"].join('/')}`,className:"w-100"});    
    const [newNetwork,  setNewNetwork, setNewNetworkInput]  = 
    useInput({ title:"Cardano network",name:"newNetwork",type: "text", defaultValue:config.networkTag,className:"w-100"});
    const [mnemonic,  setMnemonic, mnemonicInput]  = 
    useInput({ title:"Signer Bot Mode seed phrase (empty=Passive Mode)",name:"mnemonic",type: "textarea", defaultValue:"",className:"w-100"});
    const [newFee,  setNewFee, setNewFeeInput]  = 
    useInput({ title:"Signer Bot and examples fee amount (lovelaces)",name:"newFee",type: "number",min:1, defaultValue:config?.unimatrix?.autoSigner[newNetwork]?.fee, className:"w-100"});
    const [newAddress,  setNewAddress, setNewAddressInput]  = 
    useInput({ title:"Signer Bot and examples fee address",name:"newAddress",type: "text",defaultValue:config?.unimatrix?.autoSigner[newNetwork]?.address, className:"w-100"});

    useEffect(()=>{
        setNewAddress(config?.unimatrix?.autoSigner[newNetwork]?.address);
        setNewFee(config?.unimatrix?.autoSigner[newNetwork]?.fee);
    },[newNetwork]);
    
    const walletData=getWalletData(mnemonic,newNetwork);
    const handleGenerateSeed=(e)=>{
        e && e.preventDefault();
        setMnemonic(generateMnemonic());
    }
    const handleAddListener=(e)=>{

        setConfig(oldConfig=>{        
            if(!newId || !newPath){
                alert("Missing channel parameters!")
                return oldConfig;
            }
            const _key=`${newNetwork||""}:${newId||""}:${newPath||""}:${walletData?.address||""}`;
            if(oldConfig.db.unimatrixListeners.find((listener)=>listener?._key===_key) ){
                alert("Listener already loaded!");
                return oldConfig;  
            }
            const peers=oldConfig?.unimatrix?.relays[newNetwork]||[];
            //for hosting with gunDb examples or dandelion-lite:  
            if(oldConfig?.unimatrix?.selfHostedRelayPaths){
                for(const relayPath of oldConfig?.unimatrix?.selfHostedRelayPaths){
                    if(relayPath)
                        peers.push(`${location?.origin||""}${relayPath}`);
                }    
            }
            if(!peers || peers?.length<1){
                alert("Missing relay peers!")
                return oldConfig;
            }
            const newConfig={...oldConfig};
            const _newPath=newPath.split('/')
            const gun=new Gun({peers});
            console.info(`Connecting to ${JSON.stringify(peers)}`)
            newConfig.db.unimatrixListeners.push({
                _key,
                id:newId,
                path:[..._newPath],
                dltTag:config.dltTag,
                networkTag:newNetwork,                
                autoSigner:walletData,
                feeAddress:newAddress,
                feeCoin:String(newFee||""),
                gun,
                peers,
            });
            newConfig.ui.tab="listeners";
            return newConfig;
        })
    }

    
  
    return(
    <div className="pb-4">
        <div className="row p-3">
            <div className="col-md-6 col-12">
                <div style={{maxWidth:"700px"}} className="p-2 m-auto">
                    {setNewIdInput}
                    {setNewPathInput}
                    <TapToChange label={<span className="d-block text-muted">Listen on Cardano network:</span>} defaultIndex={config.networkTags.indexOf(config.networkTag)} variantsFactories={[
                    ...config.networkTags.map((networkTag)=>
                        (onClick,currentIndex)=><a title={`click to change`}  className={`btn btn-sm btn-secondary`} onClick={(e)=>{e?.preventDefault();setNewNetwork(config.networkTags[onClick()]);}}> <i className="mdi mdi-swap-horizontal"/> {networkTag}</a>),
                    ]}/>
                    <hr/>
                    {setNewAddressInput}
                    {setNewFeeInput}
                    <hr/>
                    {mnemonicInput}
                    <a href={undefined} onClick={handleGenerateSeed} className="btn btn-sm btn-secondary mb-2" ><i className="mdi mdi-reload"/> generate seed phrase</a>            
                </div>
            </div>

            <div className="col-md-6 col-12">

            {walletData && 
                    <div className="py-3">
                        <div className="card" >
                            <div className="card-body">
                                <h5 className="card-title">Signer Bot Mode</h5>
                                <div title="Try the examples on Monitor tab to learn how to build transactions for this bot">
                                    <p className="card-text">
                                        Announced transactions will be signed automatically using this wallet <b>spend</b> and <b>stake</b> private keys if they met these conditions:
                                    </p>
                                    <p  style={{fontSize:"0.7em"}} className="alert alert-info">
                                        One output must send at least <b>{newFee} lovelaces</b> to: 
                                        <br/>
                                        <u >{newAddress}</u>
                                    </p>
                                    <p  style={{fontSize:"0.7em"}} className="alert alert-info">
                                        required signers list must contain at least one of these key hashes
                                        <br/>
                                        <b>spend:</b> <u >{walletData?.pubSpendKeyHash}</u>
                                        <br/>
                                        or
                                        <br/>
                                        <b>stake:</b> <u >{walletData?.pubStakeKeyHash}</u>

                                    </p>
                                </div>
                                <h6 className="card-subtitle">Wallet Data - Keep private!</h6>
                                <a className="btn btn-sm btn-danger m-2" onClick={()=>setShowPrivate(!showPrivate)}> {showPrivate?"hide":"show"} private data</a>
                                {showPrivate && <pre className="text-start p-2">
                                    {JSON.stringify(walletData,null,2)}
                                </pre>}
                                <p className="alert alert-danger">
                                    Seed phrase and private keys will not be persisted on browser storage. 
                                    Reload page to wipe all imported wallets and listeners.
                                </p>
                            </div>
                        </div>
                    </div>
                    }
                    {!walletData && 
                    <div className="py-3">
                        <div className="card" >
                            <div className="card-body">
                                <h5 className="card-title">Passive Mode</h5>
                                <p className="card-text">
                                    Announced transactions will be monitored passively. A button will allow you to manually sign incoming transactions using <b>GameChanger Wallet</b>.        
                                </p>
                            </div>
                        </div>
                    </div>
                    }
            </div>
        </div>

        
        <a onClick={handleAddListener} className="btn btn-lg btn-success"> <i className="mdi mdi-plus"/>add listener</a>
    </div>
  )
}