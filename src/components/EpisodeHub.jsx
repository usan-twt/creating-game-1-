import { useState, useEffect } from "react";
import { EPISODE_LIST } from "../data/episodes";

export default function EpisodeHub({ storyFlags, onPlay }) {
  const [vis, setVis] = useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),80);return()=>clearTimeout(t);},[]);

  return (
    <div style={{minHeight:"100vh",background:"#0e0c0a",fontFamily:"Georgia,serif",opacity:vis?1:0,transition:"opacity 0.9s ease",overflowY:"auto"}}>
      <div style={{padding:"52px 0 0",textAlign:"center"}}>
        <div style={{fontSize:8,letterSpacing:"0.6em",color:"#3a2e24",marginBottom:14}}>INTERN</div>
        <div style={{width:32,height:1,background:"#3a2e24",margin:"0 auto 20px"}}/>
        <div style={{fontSize:11,color:"#5a4a38",letterSpacing:"0.1em",marginBottom:6}}>레지던트 1년차</div>
        <div style={{fontSize:10,color:"#3a2e24",marginBottom:48}}>오늘의 외래 환자</div>
      </div>

      <div style={{maxWidth:640,margin:"0 auto",padding:"0 24px 80px",display:"flex",flexDirection:"column",gap:10}}>
        {EPISODE_LIST.map((ep,idx)=>{
          const done = storyFlags[ep.completedFlag];
          const tags = [];
          if(ep.id==="EP4") tags.push("재진");
          if(ep.id==="EP8") tags.push("재등장");
          if(ep.mechanics?.dual) tags.push("두 환자");
          if(ep.mechanics?.noPatient) tags.push("환자 없음");
          return (
            <div key={ep.id} onClick={()=>onPlay(ep.id)}
              style={{display:"flex",alignItems:"stretch",background:done?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.055)",border:`1px solid ${done?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.1)"}`,borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all 0.2s",opacity:vis?1:0,transitionDelay:`${0.2+idx*0.07}s`}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.09)";e.currentTarget.style.borderColor="rgba(255,255,255,0.18)";}}
              onMouseLeave={e=>{e.currentTarget.style.background=done?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.055)";e.currentTarget.style.borderColor=done?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.1)";}}>
              <div style={{width:56,background:"rgba(255,255,255,0.04)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRight:"1px solid rgba(255,255,255,0.06)",flexShrink:0,padding:"16px 0"}}>
                <div style={{fontSize:8,letterSpacing:"0.3em",color:"rgba(255,255,255,0.2)",marginBottom:4}}>EP</div>
                <div style={{fontSize:20,color:done?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.6)",fontWeight:"bold"}}>{String(idx+1).padStart(2,"0")}</div>
              </div>
              <div style={{flex:1,padding:"14px 18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontSize:15,fontWeight:"bold",color:done?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.8)"}}>{ep.name}</span>
                    {ep.age>0&&<span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>{ep.age}세 · {ep.sex}성</span>}
                    {tags.map(t=>(
                      <span key={t} style={{fontSize:9,letterSpacing:"0.08em",color:"#8a7050",background:"rgba(140,110,60,0.15)",border:"1px solid rgba(140,110,60,0.25)",borderRadius:4,padding:"2px 6px"}}>{t}</span>
                    ))}
                  </div>
                  <div style={{fontSize:9,color:done?"#78c878":"rgba(255,255,255,0.18)",letterSpacing:"0.1em",flexShrink:0,marginLeft:8}}>{done?"완료":"대기"}</div>
                </div>
                {ep.cc&&<div style={{fontSize:11,color:"#d06050",fontStyle:"italic",marginBottom:4}}>"{ep.cc}"</div>}
                <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",letterSpacing:"0.04em"}}>{ep.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
