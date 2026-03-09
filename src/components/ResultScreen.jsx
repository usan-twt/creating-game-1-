import { useState, useEffect } from "react";

export default function ResultScreen({ ep, storyFlags, sessionFlags, onContinue }) {
  const [vis, setVis] = useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),120);return()=>clearTimeout(t);},[]);
  const { lines, footer } = ep.getResultLines(storyFlags, sessionFlags);
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"#16120e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",opacity:vis?1:0,transition:"opacity 1.2s ease",overflowY:"auto"}}>
      <div style={{textAlign:"center",maxWidth:300,padding:"60px 24px"}}>
        {lines.map((line,i)=>{
          const isQ=line.startsWith("\u201c"); const isB=line===" ";
          return <div key={i} style={{fontFamily:"Georgia,serif",fontSize:isQ?21:12.5,color:isQ?"#d4a060":"#847060",lineHeight:2.2,fontStyle:isQ?"italic":"normal",opacity:vis?1:0,transition:`opacity 0.9s ease ${0.4+i*0.18}s`,minHeight:isB?14:"auto"}}>{isB?"\u00a0":line}</div>;
        })}
        <div style={{marginTop:48,opacity:vis?1:0,transition:`opacity 0.8s ease ${0.4+lines.length*0.18+0.4}s`}}>
          {footer&&<div style={{fontFamily:"Georgia,serif",fontSize:10,color:"#3a2a1a",letterSpacing:"0.08em",marginBottom:28,fontStyle:"italic"}}>{footer}</div>}
          <button onClick={onContinue}
            style={{background:"none",border:"1px solid #3a2a18",color:"#6a5a40",padding:"10px 30px",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:11,letterSpacing:"0.14em",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#7a6a50";e.currentTarget.style.color="#a09070";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#3a2a18";e.currentTarget.style.color="#6a5a40";}}>
            {ep.id==="EP10"?"끝" : "다음 환자"}
          </button>
        </div>
      </div>
    </div>
  );
}
