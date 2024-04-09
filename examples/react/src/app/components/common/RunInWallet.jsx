
import { useState, useEffect } from 'react';
import gc from '@gamechanger-finance/gc'

/**
 * Customizable GameChanger dapp connection launcher button
 * @param {*} param0 
 */
export const RunInWallet=({
        label,
        tooltip,
        gcscript,
        network,
        fallBackComponent,
        useClass,
        useTarget,
        usePopUp,
        popUpWidth,
        popUpHeight,
    })=>{
    const [ui,setUi]=useState({
        url:"",
        title:"",
        description:"",
    });

    useEffect(()=>{
        (async()=>{
            try{
                const {title,description}=gcscript||{};
                const url=await gc.encode.url({
                    input:JSON.stringify(gcscript),
                    network:network,
                });
                setUi((oldUi)=>({...oldUi,
                    url,
                    title:title,
                    description:description,
                }));
            }catch(err){
                console.warn(`RunInWallet(): ${err}`);
            }
        })();
    },[gcscript,network]);

    if(!ui.url)
        return fallBackComponent||null;
    
    const popUpHandler=(e)=>{
        e.preventDefault();
        const width=popUpWidth||450
        const height=popUpHeight||700
        let newWindow = window.open(ui.url, label || ui.title || "GameChanger Wallet dapp connection", `width=${width}, height=${height}, left=${window.outerWidth - width}`);
        if (newWindow?.focus)
            newWindow.focus(); 
    }
    let defaultTarget=usePopUp?undefined:"_blank"
    return <a 
        className   ={useClass||"btn btn-success btn-sm mx-1"} 
        href        ={ui.url}
        onClick     ={usePopUp?popUpHandler:undefined} 
        title       ={tooltip || ui.description}
        target      ={useTarget||defaultTarget}><i className={`mdi mdi-play`} /> {label || ui.title || "Run"}</a>
}