import { useState, useEffect, useRef, useCallback } from "react";
import { EMOTION_META } from "../data/emotions";
import { EP7A_PROMPT, EP7B_PROMPT } from "../data/episodes";
import ep7aScript from "../data/scripts/ep7a.json";
import ep7bScript from "../data/scripts/ep7b.json";
import useGameLogic from "../hooks/useGameLogic";
import ClinicScene from "./ClinicScene";
import NotebookPanel from "./NotebookPanel";

export default function DualGameScreen({ ep, storyFlags, residentState, onEnd }) {
  const logicA = useGameLogic(EP7A_PROMPT, ep7aScript);
  const logicB = useGameLogic(EP7B_PROMPT, ep7bScript);
  const [focused,     setFocused]     = useState("A");
  const [totalTurns,  setTotalTurns]  = useState(0);
  const [turnsA,      setTurnsA]      = useState(0);
  const [turnsB,      setTurnsB]      = useState(0);
  const [input,       setInput]       = useState("");
  const [notebookOpen,setNotebookOpen]= useState(false);
  const [userNotes,   setUserNotes]   = useState("");
  const [showLog,     setShowLog]     = useState(false);
  const inputRef = useRef(null);
  const MAX_TURNS = 12;

  const activeLogic = focused==="A" ? logicA : logicB;
  const activePat   = focused==="A" ? ep.patientA : ep.patientB;
  const emotionMeta = EMOTION_META[activeLogic.emotion]||EMOTION_META.neutral;

  useEffect(()=>{
    setTimeout(()=>{
      logicA.setEmotion(ep.patientA.initialEmotion);
      logicA.setTalking(true);
      logicA.setHistory([{role:"patient",text:ep.patientA.cc,emotion:ep.patientA.initialEmotion}]);
      setTimeout(()=>logicA.setTalking(false),2000);
      logicB.setEmotion(ep.patientB.initialEmotion);
      logicB.setHistory([{role:"patient",text:ep.patientB.cc,emotion:ep.patientB.initialEmotion}]);
    },600);
  },[]);

  const handleSend = useCallback(async(text)=>{
    if(!text.trim()||activeLogic.loading||totalTurns>=MAX_TURNS) return;
    setInput(""); setShowLog(false);
    setTotalTurns(p=>p+1);
    if(focused==="A") setTurnsA(p=>p+1); else setTurnsB(p=>p+1);
    await activeLogic.send(text);
    setTimeout(()=>inputRef.current?.focus(),50);
  },[activeLogic, focused, totalTurns]);

  const isAbnormal = (k,v)=>(k==="BP"&&parseInt(v)>130)||(k==="HR"&&parseInt(v)>90)||(k==="SpO2"&&parseInt(v)<94);
  const allDone = totalTurns >= MAX_TURNS;

  const visibleMsgs = (()=>{
    const msgs=activeLogic.history.filter(m=>m.role!=="system");
    if(!msgs.length) return [];
    const last=msgs[msgs.length-1];
    if(last.role==="patient"&&msgs.length>=2&&msgs[msgs.length-2].role==="doctor") return [msgs[msgs.length-2],last];
    return [last];
  })();

  const miniCard = (pat, logic, side, isActive) => {
    const em = EMOTION_META[logic.emotion]||EMOTION_META.neutral;
    return (
      <div onClick={()=>setFocused(side)}
        style={{flex:1,padding:"10px 12px",background:isActive?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.04)",border:`1px solid ${isActive?"rgba(255,255,255,0.22)":"rgba(255,255,255,0.07)"}`,borderRadius:10,cursor:isActive?"default":"pointer",transition:"all 0.2s",position:"relative"}}>
        {isActive&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:em.color,borderRadius:"10px 10px 0 0"}}/>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
          <div>
            <span style={{fontSize:12,fontWeight:700,color:isActive?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.4)"}}>{pat.name}</span>
            <span style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginLeft:6}}>{pat.age}세</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4,background:`${em.color}20`,borderRadius:12,padding:"2px 7px"}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:em.color,display:"block",animation:"pulse2 2s infinite"}}/>
            <span style={{fontSize:9,color:em.color}}>{em.label}</span>
          </div>
        </div>
        <div style={{fontSize:10,color:"#d06050",fontStyle:"italic",marginBottom:4}}>"{pat.cc.slice(0,30)}{pat.cc.length>30?"...":""}"</div>
        <div style={{display:"flex",gap:3}}>
          {Array.from({length:5}).map((_,i)=><div key={i} style={{flex:1,height:2,borderRadius:1,background:i<logic.rapportLevel?(logic.rapportLevel>=3?"#78c878":"#e2a84b"):"rgba(255,255,255,0.1)"}}/>)}
        </div>
        <div style={{marginTop:6,display:"flex",gap:3}}>
          {Object.entries(pat.vitals).map(([k,v])=>{
            const abn=isAbnormal(k,v);
            return <div key={k} style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:abn?"rgba(220,60,40,0.2)":"rgba(255,255,255,0.06)",color:abn?"#f07060":"rgba(255,255,255,0.5)"}}>{k}:{v}</div>;
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{height:"100vh",background:"#0e0c0a",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",inset:0,zIndex:0}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,#2a2520 0%,#1a1612 45%,#12100e 100%)"}}/>
        <div style={{position:"absolute",bottom:"195px",left:"50%",transform:"translateX(-50%)",width:"min(440px,78vw)",aspectRatio:"280/320"}}>
          <ClinicScene emotion={activeLogic.emotion} talking={activeLogic.talking} ep={activePat} emotionColor={emotionMeta.color} phoneCheck={false} breathingCalm={false}/>
        </div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:"310px",background:"linear-gradient(to bottom,transparent 0%,rgba(14,12,10,0.8) 38%,rgba(14,12,10,0.97) 68%,#0e0c0a 100%)"}}/>
      </div>

      {/* Top: dual cards + turn bar */}
      <div style={{position:"absolute",top:12,left:12,right:12,zIndex:20,display:"flex",flexDirection:"column",gap:6}}>
        <div style={{display:"flex",gap:8}}>{miniCard(ep.patientA,logicA,"A",focused==="A")}{miniCard(ep.patientB,logicB,"B",focused==="B")}</div>
        <div style={{background:"rgba(255,255,255,0.05)",borderRadius:6,height:4,overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{width:`${(totalTurns/MAX_TURNS)*100}%`,height:"100%",background:totalTurns>=MAX_TURNS?"#c05050":totalTurns>=8?"#d4914a":"#7aaa96",transition:"width 0.3s ease,background 0.3s"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"0 2px"}}>
          <span style={{fontSize:9,color:"rgba(255,255,255,0.2)"}}>이혜란 {turnsA}턴 / 강도현 {turnsB}턴</span>
          <span style={{fontSize:9,color:totalTurns>=MAX_TURNS?"#c05050":"rgba(255,255,255,0.2)"}}>남은 시간 {MAX_TURNS-totalTurns}턴</span>
        </div>
      </div>

      <div style={{position:"absolute",bottom:"208px",left:0,right:0,zIndex:5,textAlign:"center",pointerEvents:"none"}}>
        <span style={{fontFamily:"Georgia,serif",fontSize:11,color:"rgba(255,255,255,0.4)",letterSpacing:"0.18em"}}>{activePat.name}</span>
      </div>

      <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:10}}>
        <div style={{padding:"0 clamp(16px,6vw,80px) 10px",display:"flex",flexDirection:"column",gap:10,minHeight:90,justifyContent:"flex-end"}}>
          {visibleMsgs.map((msg,i)=>{
            const isDoc=msg.role==="doctor";
            return (
              <div key={i} style={{display:"flex",justifyContent:isDoc?"flex-end":"flex-start",alignItems:"flex-end",gap:10}}>
                {!isDoc&&<div style={{width:28,height:28,borderRadius:"50%",background:EMOTION_META[msg.emotion]?.color||emotionMeta.color,flexShrink:0,opacity:0.65}}/>}
                <div style={{maxWidth:"72%",padding:"12px 17px",borderRadius:isDoc?"15px 15px 4px 15px":"15px 15px 15px 4px",background:isDoc?"rgba(52,72,44,0.92)":"rgba(245,238,218,0.95)",color:isDoc?"#ccdac4":"#1a1008",fontSize:13.5,lineHeight:1.8,boxShadow:"0 3px 18px rgba(0,0,0,0.45)",backdropFilter:"blur(8px)"}}>{msg.text}</div>
              </div>
            );
          })}
          {activeLogic.loading&&<div style={{display:"flex",alignItems:"flex-end",gap:10}}><div style={{width:28,height:28,borderRadius:"50%",background:emotionMeta.color,opacity:0.65,flexShrink:0}}/><div style={{padding:"12px 17px",background:"rgba(245,238,218,0.95)",borderRadius:"15px 15px 15px 4px",display:"flex",gap:6}}>{[0,1,2].map(j=><div key={j} style={{width:5,height:5,borderRadius:"50%",background:"#a09060",animation:`ep_b 1s ease ${j*0.22}s infinite`}}/>)}</div></div>}
        </div>

        {allDone&&(
          <div style={{padding:"8px 20px 10px",background:"rgba(20,15,10,0.9)",borderTop:"1px solid rgba(200,130,40,0.2)",display:"flex",justifyContent:"center"}}>
            <button onClick={()=>onEnd({turnsA,turnsB,rapportA:logicA.rapportLevel,rapportB:logicB.rapportLevel})}
              style={{background:"rgba(160,130,60,0.18)",border:"1px solid rgba(170,140,60,0.38)",color:"rgba(190,160,75,0.88)",padding:"10px 28px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"Georgia,serif",letterSpacing:"0.1em"}}>
              외래 종료
            </button>
          </div>
        )}

        {!allDone&&(
          <div style={{padding:"10px 20px 18px",background:"rgba(10,8,6,0.97)",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",gap:10,alignItems:"flex-end"}}>
            <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
              <button onClick={()=>setNotebookOpen(o=>!o)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",padding:"7px 11px",cursor:"pointer",fontSize:11,fontFamily:"inherit",borderRadius:8}}>📓</button>
              <button onClick={()=>setShowLog(v=>!v)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",padding:"7px 11px",cursor:"pointer",fontSize:11,fontFamily:"inherit",borderRadius:8}}>📋</button>
            </div>
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend(input);}}}
              placeholder={`${activePat.name}에게...   ↵ Enter`} disabled={activeLogic.loading} rows={2}
              style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:10,padding:"11px 14px",fontSize:13,fontFamily:"system-ui,sans-serif",lineHeight:1.65,color:"rgba(255,255,255,0.82)",outline:"none",resize:"none",caretColor:"#c0b070"}}/>
            <button onClick={()=>handleSend(input)} disabled={activeLogic.loading||!input.trim()} style={{background:(activeLogic.loading||!input.trim())?"rgba(255,255,255,0.06)":"rgba(64,82,52,0.9)",border:"none",color:(activeLogic.loading||!input.trim())?"rgba(255,255,255,0.2)":"#ccdac4",padding:"11px 17px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>전송</button>
          </div>
        )}
      </div>

      <NotebookPanel isOpen={notebookOpen} onClose={()=>setNotebookOpen(false)} epNum={ep.titleNum} preNotes={ep.notebookPre} userNotes={userNotes} onUserNotesChange={setUserNotes} hints={activePat.hints} usedIntents={activeLogic.usedIntents} hintsUnlocked={totalTurns>=3}/>
      <style>{`@keyframes ep_b{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-5px);opacity:1}}@keyframes pulse2{0%,100%{opacity:0.7;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}@keyframes cardIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
