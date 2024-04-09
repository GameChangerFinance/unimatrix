
const toBoolean=(str)=>{
    if(['true','TRUE'].includes(str))
        return true;
    if(['false','FALSE'].includes(str))
        return false;
    return undefined;
}
const toArray=(str,delimiter)=>{
    return String(str||"")
        .split(delimiter)
        .map(x=>(x||"")
        .trim())
        .filter(x=>!!x)
}

module.exports={
    toBoolean,
    toArray,
}