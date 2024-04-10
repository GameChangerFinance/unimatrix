const { getConfig } = require('./config');
const { useLogger } = require('./logger');
useLogger();
module.exports=async function validator({
    txJson,
    txHex,
    txHash,
    vkHash,
    pubKeyHex,
    signerId,
    dltTag,
    networkTag,
    CSL,
}){
    const {
        address:feeAddress,
        fee:feeLovelace,
    }=await getConfig();

    if(!feeAddress)
        throw new Error ('You need to provide to the validator an address to collect the fee ')
    if(!feeLovelace)
        throw new Error ('You need to provide to the validator a fee in lovelaces')
    const requiredSigners=txJson?.body?.required_signers||[];
    const isRequired=requiredSigners.includes(vkHash);
    const outputs=txJson?.body?.outputs||[];
    let isValid=outputs.some((output,outputIndex)=>{
        const {address,amount:{coin}}=output||{};
        if(address!==feeAddress){
            return false;
        }        
        const feeCoinObj=CSL.BigNum.from_str(String(feeLovelace));
        const coinObj=CSL.BigNum.from_str(coin);
        if(coinObj.compare(feeCoinObj)<0)
            return false;
        
        return true;                     
    });    
    const doSign=isRequired && isValid;
    let error=undefined;
    if(!isRequired) 
        error= `Signature not required explicitly`;
    if(!isValid) 
        error= `You didn't pay ${feeLovelace} lovelaces`;
    console.dir({signerId,isRequired,isValid,txHash,vkHash,txJson,feeAddress,feeLovelace});         
    return Promise.resolve({
        doSign,
        error,
    });
}