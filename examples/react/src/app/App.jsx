import React,{useState,useEffect} from 'react';
import UnimatrixMonitor from './components/UnimatrixMonitor';
import Gun from 'gun';
import { AddListener } from './components/AddListener';
import '@mdi/font/css/materialdesignicons.min.css';
import './App.css';

const App=({initialConfig})=>{
  const [config,setConfig]=useState({
    ...initialConfig||{},
    db:{
      unimatrixListeners:[
        ...(initialConfig?.db?.unimatrixListeners||[])
      ]
    },
    ui:{
      tabs:{
        "addListener":{
          title:"Add"          
        },
        "listeners":{
          title:"Monitor"
        },       
      },
      tab:initialConfig?.db?.unimatrixListeners?.length>0
        ?"listeners"
        :"addListener",
    }
  });
 
  
  const handleSetTab=(tabName)=>(e)=>{
    e && e.preventDefault();
    setConfig(oldConfig=>{
      const newConfig={...oldConfig}
      newConfig.ui.tab=tabName;
      return newConfig;
    })
  }
  return (
    <div className="App centered mx-0 px-0">
        <header className="App-header bg-dark p-2 shiny">
          <h1>⚡ Unimatrix Node</h1>
          <h6><i>Decentralized, privacy preserving, transaction validator and signer nodes using Unimatrix Sync for Cardano</i></h6>
        </header>
        <section className="p-2" style={{minHeight:"100vh"}}>
          <div className="pt-2">
              {Object.keys(config.ui.tabs||{}).map(tabName=>{
                const title=config.ui.tabs[tabName]?.title;   
                const selected=tabName===config.ui.tab;
                return <a key={tabName} onClick={handleSetTab(tabName)}className={`btn btn-lg btn-${selected?"primary":"secondary"} rounded-0 p-1 m-0`}>{title}</a>
              })}
          </div> 
          {config.ui.tab==="listeners"&&<div>
            <h5 className="my-2">Unimatrix Listeners</h5>
            {config.db.unimatrixListeners.length<1 && <div>
              <p>You need to add a listener in order to start receiving transactions</p>
              <a className="btn btn-sm btn-primary" onClick={handleSetTab('addListener')}> Add Listener...</a>  
            </div>}
            {config.db.unimatrixListeners.length>=1 && <div style={{fontSize:"0.8em"}}>
              <ul>
                {config.db.unimatrixListeners.map((listener,listenerIndex)=>{
                  const {id,path,db:_db,networkTag,dltTag,gun,peers,autoSigner,feeAddress,feeCoin}=listener||{};                    
                  if(!id || !path || !networkTag || !dltTag ||!gun)
                    return null;                    
                  const db={...(_db||{})};//config.db.unimatrixListeners[listenerIndex]||{};
                  const setDb=(cb)=>{
                    setConfig(oldConfig=>{
                      const newConfig={...oldConfig}
                      const oldDb={...newConfig.db.unimatrixListeners[listenerIndex].db||{}}
                      newConfig.db.unimatrixListeners[listenerIndex].db=cb(oldDb)
                      return newConfig;
                    })
                  }
                  return <li key={`listener-${listenerIndex}`} className="p-2">
                    <UnimatrixMonitor 
                      {...{...{
                        gun,
                        peers,
                        unimatrixId:id,
                        path,
                        networkTag,
                        dltTag,
                        autoSigner,
                        feeAddress,
                        feeCoin,
                        db,
                        setDb,
                        config,
                        setConfig,
                        index:listenerIndex+1
                      }}}
                    />
                  </li>
                })}
              </ul>
            </div>}
          </div>}     


          {config.ui.tab==="addListener"&&<div>
            <h5 className="my-2">Add Unimatrix Listener</h5>
            <p>Add a listener with a private channel ID in order to start receiving announced transactions</p>
            <AddListener config={config} setConfig={setConfig}/>
          </div>}  

        </section>
      
        <footer style={{fontSize:"0.8em"}} className="App-footer bg-dark p-1">
          <p className="p-0 m-0"><i>Let's democratize access to multisig on Cardano. Centralization is futile!</i></p>
          <h6 className="neon">Made with ❤️ by <i><a href="https://gamechanger.finance" target="_blank" rel="noopener noreferrer" >GameChanger Finance</a></i></h6>
        </footer>
    </div>
  );
}

export default App;



