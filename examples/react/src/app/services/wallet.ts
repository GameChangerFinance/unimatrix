import  { 
	mnemonicToEntropy,
	generateMnemonic as _generateMnemonic,
	validateMnemonic as _validateMnemonic,
	entropyToMnemonic,
} from 'bip39';
import CardanoWasm from './cardanoWasm';

export const HARDENED_THRESHOLD             = 0x80000000
export const SHELLEY_COIN_TYPE              = 1815; //year of birth of Ada Lovelace 
export const SHELLEY_COIN_TYPE_HARDENED     = SHELLEY_COIN_TYPE + HARDENED_THRESHOLD; 
export const SHELLEY_COIN_PURPOSE           = 1852; //year of death of Ada Lovelace 
export const SHELLEY_COIN_PURPOSE_HARDENED  = SHELLEY_COIN_PURPOSE + HARDENED_THRESHOLD; 
export const EXTERNAL_ROLE                  = 0 //Same as defined in BIP44
export const INTERNAL_ROLE                  = 1 //Same as defined in BIP44
export const STAKING_ROLE                   = 2 //See CIP11


export const generateMnemonic=(wordCount:number=15) =>{
	if (wordCount % 3 !== 0) {
	  throw new Error(`Invalid mnemonic word count supplied: ${wordCount}`)
	}  
	return _generateMnemonic((32 * wordCount) / 3);
}
export const networkIdByTag=(networkTag:string):number=>{
    const CSL=CardanoWasm();
    const networkTags:any={
        'mainnet':[CSL.NetworkInfo.mainnet()         .network_id()],
        'preprod':[CSL.NetworkInfo.testnet_preprod() .network_id()],
        'preview':[CSL.NetworkInfo.testnet_preview() .network_id()],
    };
    return networkTags[networkTag]
}
export const harden   = (value: number):number => value + HARDENED_THRESHOLD;
export const unharden = (value: number):number => value - HARDENED_THRESHOLD;


/**
 * It returns a Cardano wallet derived from the provided `mnemonic` seed phrase 
 * 
 * @param mnemonic 
 * @param networkTag 
 */
export const getWalletData=(mnemonic:string,networkTag:string)=>{
    if(!mnemonic || networkTag===undefined)
        //throw new Error(`getWalletData(): missing arguments`)
        return undefined;
    try{
        const accountIndex  = 0,
            addressIndex  = 0;
        const entropy       = mnemonicToEntropy(mnemonic); 
        const rootPrivKey   = CardanoWasm().Bip32PrivateKey.from_bip39_entropy(
            Buffer.from(entropy, "hex"), 
            Buffer.from("")
            );
        const accountKey    = 	rootPrivKey
            .derive(SHELLEY_COIN_PURPOSE_HARDENED) // CIP1852
            .derive(SHELLEY_COIN_TYPE_HARDENED)
            .derive(harden(accountIndex));    
        const privSpendKey=	accountKey
            .derive(EXTERNAL_ROLE) // External
            .derive(addressIndex)
            .to_raw_key()
        const privStakeKey=	accountKey
            .derive(STAKING_ROLE) // Chimeric (Staking)
            .derive(addressIndex)
            .to_raw_key()
        const pubSpendKey   = 	accountKey
            .derive(EXTERNAL_ROLE) // External
            .derive(addressIndex)
            .to_public()
            .to_raw_key()
        const pubStakeKey   = 	accountKey
            .derive(STAKING_ROLE) // Chimeric
            .derive(addressIndex)
            .to_public()
            .to_raw_key()
        const baseAddressObj= CardanoWasm().BaseAddress.new(
            networkIdByTag(networkTag),//parseInt(networkId),
            CardanoWasm().StakeCredential.from_keyhash(pubSpendKey.hash()),
            CardanoWasm().StakeCredential.from_keyhash(pubStakeKey.hash())
        );
        return {
            address:baseAddressObj.to_address().to_bech32(),
            privSpendKey:privSpendKey.to_hex(),
            privStakeKey:privStakeKey.to_hex(),
            pubSpendKey:pubSpendKey.to_hex(),
            pubStakeKey:pubStakeKey.to_hex(),
            pubSpendKeyHash:pubSpendKey.hash().to_hex(),
            pubStakeKeyHash:pubStakeKey.hash().to_hex(),   
            networkTag,     
        };
    }catch(err){
        console.warn(err)
    }
    return undefined;
}    


/**
 * Helper that signs a transaction `args.txHex` if conditions are met.
 *  
 * - If calling user defined validator function `args.conditions.spend` returns true it signs the transaction using `args.wallet.privSpendKey`
 * - If calling user defined validator function `args.conditions.stake` returns true it signs the transaction using `args.wallet.privStakeKey`
 * 
 * @param args 
 */
export const signTxIf=async(args:{
    txHex:string,
    wallet:{
        address:string,
        privSpendKey:string,
        privStakeKey:string,
        pubSpendKey:string,
        pubStakeKey:string,
        pubSpendKeyHash:string,
        pubStakeKeyHash:string,
        networkTag:string,
    },
    conditions:{
        spend:(args:{txJson:any,txHash:string,vkHash:string})=>Promise<{doSign:boolean,error:string|undefined}>,
        stake:(args:{txJson:any,txHash:string,vkHash:string})=>Promise<{doSign:boolean,error:string|undefined}>,
    }
}):Promise<{
    spend:string|undefined,
    stake:string|undefined,
    spendError:string|undefined,
    stakeError:string|undefined,
}|undefined>=>{
    try{
        const CSL=CardanoWasm();
        const txObj=CSL.Transaction.from_hex(args.txHex);
        const txHashObj=CSL.hash_transaction(txObj.body());
        const txHash=txHashObj.to_hex();
        const txJson=JSON.parse(txObj.to_json());
        const {doSign:signWithSpend,error:spendError}=await args.conditions.spend({txJson,txHash,vkHash:args?.wallet?.pubSpendKeyHash});
        const {doSign:signWithStake,error:stakeError}=await args.conditions.stake({txJson,txHash,vkHash:args?.wallet?.pubStakeKeyHash});
        const res={
            spend:undefined,
            stake:undefined,
            spendError,
            stakeError,
        };
        if(signWithSpend){
            const prvKeyObj=CSL.PrivateKey.from_hex(args.wallet.privSpendKey)            
            const signatureObj=prvKeyObj.sign(Buffer.from(txHashObj.to_bytes()));
            const witnessObj=CSL.Vkeywitness.new(CSL.Vkey.new(prvKeyObj.to_public()),signatureObj);
            res.spend=witnessObj.to_hex();
            prvKeyObj.free();
        }
        if(signWithStake){
            const prvKeyObj=CSL.PrivateKey.from_hex(args.wallet.privStakeKey)            
            const signatureObj=prvKeyObj.sign(Buffer.from(txHashObj.to_bytes()));
            const witnessObj=CSL.Vkeywitness.new(CSL.Vkey.new(prvKeyObj.to_public()),signatureObj);
            res.stake=witnessObj.to_hex();
            prvKeyObj.free();
        }
        return res;        
    }catch(err){console.error(err)}
    return undefined;
}