import fetch from 'cross-fetch';


export const loadConfig=async(url)=>{
    return fetch(url)
        .then(res => {
            if (res.status >= 400) {
                throw new Error("Bad response from server");
            }
            return res.json();
        })
        .catch(err=>{
            alert(`Unable to load '${url}'. ${err?.message||"Unknown error."}`)
        })
}