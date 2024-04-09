import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import { loadModule } from './app/services/cardanoWasm';
import { loadConfig } from './app/services/config';

const configUrl='config.json';

const AppLoader=()=>{
  const [cslReady,setCSLReady]=useState(null);
  const [config,setConfig]    =useState(null);
  
  useEffect(()=>{
    (async()=>{
      loadModule().then(lib=>{if(lib)setCSLReady(true)});
    })()
  },[]);
  useEffect(()=>{
  (async()=>{
      loadConfig(configUrl).then(config=>{setConfig(config)});
    })()
  },[]);

  if(!config || !cslReady)
    return <h3 className="centered" >Loading dependencies...</h3>

  return <App initialConfig={config}/>;
}


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppLoader />
  </React.StrictMode>,
)
