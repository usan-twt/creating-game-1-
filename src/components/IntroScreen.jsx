import { useState, useEffect } from "react";

export default function IntroScreen({ ep, onStart }) {
  const [vis, setVis] = useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),100);return()=>clearTimeout(t);},[]);
  return (
    <div style={{minHeight:"100vh",background:"#16120e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",opacity:vis?1:0,transition:"opacity 1s ease"}}>
      <div style={{textAlign:"center",maxWidth:340,padding:"0 24px"}}>
        <div style={{fontSize:9,letterSpacing:"0.5em",color:"#4a3a2a",marginBottom:20}}>INTERN</div>
        <div style={{width:36,height:1,background:"#4a3a28",margin:"0 auto 24px"}}/>
        <div style={{fontSize:30,color:"#e0d4c0",marginBottom:8,letterSpacing:"0.06em"}}>{ep.titleNum}</div>
        <div style={{fontSize:14,color:"#a09070",marginBottom:36,fontStyle:"italic"}}>{ep.subtitle}</div>
        <div style={{fontSize:12,color:"#5a4a38",lineHeight:2.3,marginBottom:44}}>{ep.teaser}</div>
        <button onClick={onStart}
          style={{background:"none",border:"1px solid #4a3a28",color:"#8a7a60",padding:"13px 40px",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:11,letterSpacing:"0.22em",transition:"all 0.2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#9a8a70";e.currentTarget.style.color="#c0b090";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="#4a3a28";e.currentTarget.style.color="#8a7a60";}}>
          {ep.mechanics?.noPatient ? "들어가기" : "진료실로 들어가기"}
        </button>
      </div>
    </div>
  );
}
