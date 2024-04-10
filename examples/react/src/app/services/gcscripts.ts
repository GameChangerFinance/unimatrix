
// Factory functions that generates parameterized GCScript for example actions and for manual signing action

export const gcSignTxs=(args:{networkTag:string,unimatrixId:string,path:string[],peers:string[],txHexList:string[],options?:any})=>{
    const itemLabel=`${args.txHexList.length} ${args.txHexList.length>1?"transactions":"transaction"}`;
    const gcScript:any={
        title       :`Multi-sign ${itemLabel}`,
        description :`About to sign ${itemLabel}. When fully signed after you run this action, you can manually submit any transaction using each "Submit" button in "Transactions" tab`,
        "type":"script",
        //"exportAs":"data",
        "run":{  
            "sign":{
                "type":"signTxs",                
                "namePattern":"MultiSig-{key}",
                "multisig":[
                    {"kind":"MainAddress"},
                    {"kind":"CurrentWorkspace"},
                    {"kind":"Roundtable", share:true},
                    {
                        "kind":"Unimatrix" , 
                        "share":true, 
                        "id":args.unimatrixId,
                        "relays":args?.peers,                
                    },
                ],
                "txs":[...(args.txHexList||[])],
            }  
        }  
    };  
    return {url:"",code:gcScript};
}

//common options for also allowing multisig workspaces to build these transactions (optional, but recommended)
const options={
    "autoProvision": {
        "workspaceNativeScript": true
    },
    "autoOptionalSigners": {
        "nativeScript": true,
    },
}


export const gcPaymentsTxs=(args:{networkTag:string,unimatrixId:string,path:string[],peers:string[],feeCoin:string,feeAddress:string,spendKeyHash:string,stakeKeyHash:string,options?:any})=>{    
    const gcScript:any={
        "title": "Three transactions at once",
        "description": "Builds, sign and submit 3 multisig transactions requiring external signing keys, signatures that will be provided in real time by decentralized Unimatrix validator nodes",
        "exportAs": "multisig",
        "return": {
            "mode": "last"
        },
        "type": "script",
        "run": {
            "build1": {
                "type": "buildTx",
                "title":"Unimatrix Multisig 1",
                "tx": {
                    "outputs":{ 
                        serviceFee:{
                            "address": args.feeAddress,
                            "assets": [
                                {
                                    "policyId": "ada",
                                    "assetName": "ada",
                                    "quantity": args.feeCoin
                                }
                            ]
                        }
                    },                
                    "requiredSigners": args.spendKeyHash
                        ?{
                            "spend": args.spendKeyHash
                        }
                        :undefined,
                    options,
                }
            },
            "build2": {
                "type": "buildTx",
                "title":"Unimatrix Multisig 2",
                "tx": {
                    "outputs":{ 
                        serviceFee:{
                            "address": args.feeAddress,
                            "assets": [
                                {
                                    "policyId": "ada",
                                    "assetName": "ada",
                                    "quantity": args.feeCoin
                                }
                            ]
                        }
                    },             
                    "requiredSigners": args.stakeKeyHash
                    ?{
                        "stake": args.stakeKeyHash
                    }
                    :undefined,
                    options,
                }
            },
            "build3": {
                "type": "buildTx",
                "title":"Unimatrix Multisig 3",
                "tx": {
                    "outputs":{ 
                        serviceFee:{
                            "address": args.feeAddress,
                            "assets": [
                                {
                                    "policyId": "ada",
                                    "assetName": "ada",
                                    "quantity": args.feeCoin
                                }
                            ]
                        }
                    },               
                    "requiredSigners": args.spendKeyHash||args.stakeKeyHash
                    ?{
                        "spend": args.spendKeyHash,
                        "stake": args.stakeKeyHash
                    }
                    :undefined,
                    options,
                }
            },
            "sign": {
                "type": "signTxs",                
                "detailedPermissions": false,
                "multisig": [
                    {
                        "kind": "MainAddress"
                    },
                    {
                        "kind": "CurrentWorkspace"
                    },
                    {
                        "id": args.unimatrixId,
                        "kind": "Unimatrix",
                        "share": true,
                        "shareTxs": true,
                        "announceTxHashes": true,
                        "announceTxHashesSubPath":args?.path.join('/'),
                        "relays":args?.peers,
                    }
                ],
                "txs": [
                    "{get('cache.build1.txHex')}",
                    "{get('cache.build2.txHex')}",
                    "{get('cache.build3.txHex')}"
                ]
            },
            "submit": {
                "type": "submitTxs",
                "txs": "{get('cache.sign')}"
            },
            "finally": {
                "type": "macro",
                "run": {
                    "txHash": [
                        "{get('cache.build1.txHash')}",
                        "{get('cache.build2.txHash')}",
                        "{get('cache.build3.txHash')}"
                    ]
                }
            }
        }
    };  
    return {url:"",code:gcScript};
}




export const gcTokenSaleTxs=(args:{networkTag:string,unimatrixId:string,path:string[],peers:string[],feeCoin:string,feeAddress:string,spendKeyHash:string,stakeKeyHash:string,options?:any})=>{    
    const gcScript:any={
        "type": "script",
        "title": "Buy 1 Nanite token",
        "description": `Decentralized Token Sale. Buy 1 Nanite for ${args.feeCoin} lovelaces. Transaction will be reviewed by decentralized Unimatrix validator nodes.`,
        "exportAs": "TokenSale",
        "return": {
            "mode": "last"
        },
        "run": {
            "dependencies": {
                "type": "script",
                "run": {               
                    "mintingPolicy": {
                        "type": "nativeScript",
                        "script": {
                            "all": {
                                "issuer": {
                                    "pubKeyHashHex": args.spendKeyHash
                                }
                            }
                        }
                    }
                }
            },
            "build": {
                "type": "buildTx",
                "title": "Decentralized Token Sale",
                "tx": {
                    "mints": [
                        {
                            "policyId": "{get('cache.dependencies.mintingPolicy.scriptHashHex')}",
                            "assets": [
                                {
                                    "assetName": "nanite",
                                    "quantity": "1"
                                }
                            ]
                        }
                    ],                    
                    "outputs":{ 
                        serviceFee:{
                            "address": args.feeAddress,
                            "assets": [
                                {
                                    "policyId": "ada",
                                    "assetName": "ada",
                                    "quantity": args.feeCoin
                                }
                            ]
                        }
                    },               
                    "requiredSigners": args.spendKeyHash
                    ?{
                        "spend": args.spendKeyHash,
                        //"stake": args.stakeKeyHash
                    }
                    :undefined,
                    "witnesses": {
                        "nativeScripts": {
                            "mintingScript": "{get('cache.dependencies.mintingPolicy.scriptHex')}"
                        }
                    },
                    options,
                }
            },
            "sign": {
                "type": "signTxs",
                "detailedPermissions": false,
                "multisig": [
                    {
                        "kind": "MainAddress"
                    },
                    {
                        "kind": "CurrentWorkspace"
                    },
                    {
                        "id": args.unimatrixId,
                        "kind": "Unimatrix",
                        "share": true,
                        "shareTxs": true,
                        "announceTxHashes": true,
                        "announceTxHashesSubPath":args?.path.join('/'),
                        "relays":args?.peers,
                    }
                ],

                "txs": [
                    "{get('cache.build.txHex')}"
                ]
            },
            "submit": {
                "type": "submitTxs",
                "txs": "{get('cache.sign')}"
            },
            "finally": {
                "type": "script",
                "run": {
                    "txHash": {
                        "type": "macro",
                        "run": "{get('cache.build.txHash')}"
                    },
                    "policyId": {
                        "type": "macro",
                        "run": "{get('cache.dependencies.mintingPolicy.scriptHashHex')}"
                    },
                    "mintingScript": {
                        "type": "macro",
                        "run": "{get('cache.dependencies.mintingPolicy.scriptHex')}"
                    }
                }
            }
        }
    };  
    return {url:"",code:gcScript};
}




export const gcNFTSaleTxs=(args:{networkTag:string,unimatrixId:string,feeCoin:string,path:string[],peers:string[],feeAddress:string,spendKeyHash:string,stakeKeyHash:string,options?:any})=>{    
    const gcScript:any={
        "type": "script",
        "title": "Buy 1 Cube NFT",
        "description": `Decentralized NFT Sale. Buy 1 Cube NFT for ${args.feeCoin} lovelaces. Transaction will be reviewed by decentralized Unimatrix validator nodes.`,
        "exportAs": "NFTSale",
        "return": {
            "mode": "last"
        },
        "run": {
            "dependencies": {
                "type": "script",
                "run": {
                    "currentSlotNumber": {
                        "type": "getCurrentSlot"
                    },
                    "deadlineSlotNumber": {
                        "type": "macro",
                        "run": "{addBigNum('107478818',mulBigNum('86400','365'))}"//+365 days
                        //preprod:43288475
                        //mainnet:107478818 -> using actual mainnet slot no for this demo
                    },
                    "assetName": {
                        "type": "macro",
                        "run": "{replaceAll('Cube #__QUANTITY__','__QUANTITY__',get('cache.dependencies.currentSlotNumber'))}",
                    },
                    "quantity": {
                        "type": "data",
                        "value": "1"
                    },                    
                    "mintingPolicy": {
                        "type": "nativeScript",
                        "script": {
                            "all": {
                                "issuer": {
                                    "pubKeyHashHex": args.spendKeyHash
                                },
                                "timeLock": {
                                    "slotNumEnd": "{get('cache.dependencies.deadlineSlotNumber')}"
                                }
                            }
                        }
                    }
                }
            },
            "build": {
                "type": "buildTx",
                "title": "Decentralized NFT Sale",
                "tx": {
                    "ttl": {
                        "until": "{get('cache.dependencies.deadlineSlotNumber')}"
                    },
                    "mints": [
                        {
                            "policyId": "{get('cache.dependencies.mintingPolicy.scriptHashHex')}",
                            "assets": [
                                {
                                    "assetName": "{get('cache.dependencies.assetName')}",
                                    "quantity": "{get('cache.dependencies.quantity')}"
                                }
                            ]
                        }
                    ],
                
                    "outputs":{ 
                        serviceFee:{
                            "address": args.feeAddress,
                            "assets": [
                                {
                                    "policyId": "ada",
                                    "assetName": "ada",
                                    "quantity": args.feeCoin
                                }
                            ]
                        }
                    },               
                    "requiredSigners": args.spendKeyHash
                    ?{
                        "spend": args.spendKeyHash,
                        // "stake": args.stakeKeyHash
                    }
                    :undefined,                                             
                    "witnesses": {
                        "nativeScripts": {
                            "mintingScript": "{get('cache.dependencies.mintingPolicy.scriptHex')}"
                        }
                    },
                    "auxiliaryData": {
                        "721": {
                            "{get('cache.dependencies.mintingPolicy.scriptHashHex')}": {
                                "{get('cache.dependencies.assetName')}": {
                                    "designation":"{get('cache.dependencies.currentSlotNumber')}",
                                    "url": "https://gamechanger.finance",
                                    "name": "{get('cache.dependencies.assetName')}",
                                    "description": "{strToMetadataStr('Shutdown your backends and surrender your code to client side. Your culture will adapt to collaborate. Centralization is futile!')}",
                                    "author": "zxpectre",
                                    "image": "{strToMetadataStr('ipfs://bafkreicslv4c67y4g4u4a3qcqzcq5u7xliwnooiph7xsdhllgifumba43i')}",
                                    "version": "1.0",
                                    "mediaType": "image/png",
                                }
                            }
                        }
                    },
                    options,
                }
            },
            "sign": {
                "type": "signTxs",
                "detailedPermissions": false,
                "multisig": [
                    {
                        "kind": "MainAddress"
                    },
                    {
                        "kind": "CurrentWorkspace"
                    },
                    {
                        "id": args.unimatrixId,
                        "kind": "Unimatrix",
                        "share": true,
                        "shareTxs": true,
                        "announceTxHashes": true,
                        "announceTxHashesSubPath":args?.path.join('/'),
                        "relays":args?.peers,
                    }
                ],
                "txs": [
                    "{get('cache.build.txHex')}"
                ]
            },
            "submit": {
                "type": "submitTxs",
                "txs": "{get('cache.sign')}"
            },
            "finally": {
                "type": "script",
                "run": {
                    "txHash": {
                        "type": "macro",
                        "run": "{get('cache.build.txHash')}"
                    },
                    "assetName": {
                        "type": "macro",
                        "run": "{get('cache.dependencies.assetName')}"
                    },
                    "policyId": {
                        "type": "macro",
                        "run": "{get('cache.dependencies.mintingPolicy.scriptHashHex')}"
                    },
                    "canMintUntilSlotNumber": {
                        "type": "macro",
                        "run": "{get('cache.dependencies.deadlineSlotNumber')}"
                    },
                    "mintingScript": {
                        "type": "macro",
                        "run": "{get('cache.dependencies.mintingPolicy.scriptHex')}"
                    }
                }
            }
        }
    };  
    return {url:"",code:gcScript};
}