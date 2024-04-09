import { useEffect, useState } from "react";
import {CopyToClipboard as RawCopyToClipboard} from 'react-copy-to-clipboard';
//import toast from 'cogo-toast';

export const TapToChange=({label,variantsFactories,defaultIndex})=>{
    const [ui,setUi]=useState({
        currentIndex:defaultIndex||0,
    });
    const setNextIndex=(forcedIndex)=>{
        const oldUi={...ui};
        if(forcedIndex!==undefined){
          setUi({...oldUi,currentIndex:forcedIndex});
          return forcedIndex;
        }
  
        let newIndex=oldUi?.currentIndex+1;
        if(newIndex>= variantsFactories?.length)
            newIndex=0;
        setUi({...oldUi,currentIndex:newIndex})
        return newIndex;
  
    }
    const currentVariantFactory=variantsFactories[ui.currentIndex]||null;
    if(!currentVariantFactory)
      return null;
    return(
        <>
            {label&&label}
            {currentVariantFactory(setNextIndex,ui?.currentIndex)||null}
        </>
    )
  }
  
  export const  useInput=({ title,type ,defaultValue,name,before,after, ...props}) =>{
    const [value, setValue] = useState(defaultValue);
    const input =( 
        <div className={"mb-2"} >
            {before || null}
            <label className={"m-0 p-0 text-muted font-weight-bold"} htmlFor={name}>{title||name}:</label><br/>
            {type==="textarea" && <textarea id={name} name={name} value={value} onChange={e => setValue(e.target.value)} style={{resize:"vertical",width:"100%",height:"100px"}}  {...props}/>}
            {type!=="textarea" && <input id={name} name={name} value={value} onChange={e => setValue(e.target.value)} type={type} {...props}/>}
            {after || null}
        </div>
    );
    return [value, setValue,input];
  }




const blockExplorerByNetworkTag={
    'mainnet':"https://cardanoscan.io",
    'preprod':"https://preprod.cardanoscan.io",
}
export const blockExplorerTxUrl=(txHash,networkTag)=>`${blockExplorerByNetworkTag[networkTag]}/transaction/${txHash}`




export const truncate = function (fullStr, frontChars, backChars,_separator) {
    if(!fullStr || !fullStr.substr )return "";
    //was separator = separator || '...';
    let separator = _separator===undefined
        ?'...'
        :_separator;
  
    var fullLen     = fullStr.length,
        sepLen      = separator.length,
        charsToShow = frontChars +backChars + sepLen;
  
    if (fullLen <= charsToShow){
      return fullStr;
    }
    return fullStr.substr(0, frontChars) + 
           separator + 
           fullStr.substr(fullStr.length - backChars);
  };
  
  export const TruncateMe=({str,label,frontChars,backChars,separator,tooltip})=>{
    const onCopyHandler=(text,result)=>{
        if(!result)
            return;
        const msg=`${subject||""} copied to clipboard`;
        //alert(msg);
        //toast.info(msg);
    }   
    let truncated=truncate(
        str,
        frontChars!==undefined?frontChars:4,
        backChars!==undefined?backChars:4,
        separator
    );
    return(
        <RawCopyToClipboard text={str} onCopy={onCopyHandler}>  
            <a className="a-unstyled" href="#" onClick={(e)=>e.preventDefault()} title={tooltip||str}>{label||truncated} <i style={{fontSize:".8em"}} className={`mdi mdi-content-copy ml-1`}/></a>
        </RawCopyToClipboard>
        )
  }




export const CopyToClipboard= ({children,subject,text,iconColor,hideIcon})=>{
    const onCopyHandler=(text,result)=>{
        if(!result)
            return;
        const msg=`${subject||""} copied to clipboard`;
        alert(msg);
        //toast.info(msg);
    }
    return (
        <RawCopyToClipboard text={text} onCopy={onCopyHandler}>  
            <a title={`Copy ${subject||""} to clipboard`} href={"#"} onClick={(e)=>e?.preventDefault()} className="a-unstyled " >{children}{!hideIcon && <i style={{fontSize:".8em"}} className={`mdi mdi-content-copy ml-1 ${iconColor?"text-"+iconColor:""}`}/>}</a>
        </RawCopyToClipboard>
    );
}