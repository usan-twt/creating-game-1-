import { useState, useEffect, useRef, useCallback } from "react";
import { EMOTION_META } from "../data/emotions";
import useGameLogic from "../hooks/useGameLogic";
import RapportBar from "./RapportBar";
import ClinicScene from "./ClinicScene";
import NotebookPanel from "./NotebookPanel";

export default function GameScreen({ ep, storyFlags, residentState, onEnd }) {
  const systemPrompt = ep.getSystemPrompt(storyFlags, residentState);
  const logic = useGameLogic(systemPrompt);
  const { emotion, talking, history, loading, rapportLevel, sessionFlags, setSessionFlags, send } = logic;

  const [phoneCheck,       setPhoneCheck]       = useState(ep.initialPhoneCheck||false);
  const [translatorDirect, setTranslatorDirect] = useState(false);
  const [breathingCalm,    setBreathingCalm]    = useState(false);
  const [articleVisible,   setArticleVisible]   = useState(false);
  const [notebookOpen,     setNotebookOpen]     = useState(false);
  const [userNotes,        setUserNotes]        = useState("");
  const [showLog,          setShowLog]          = useState(false);
  const [exchangeCount,    setExchangeCount]    = useState(0);
  const [input,            setInput]            = useState("");

  const inputRef = useRef(null);
  const logRef   = useRef(null);

  useEffect(()=>{
    logic.setEmotion(ep.initialEmotion||"neutral");
    setTimeout(()=>{
      logic.setTalking(true);
      logic.setHistory([{role:"patient",text:ep.cc,emotion:ep.initialEmotion}]);
      logic.talkTimer.current=setTimeout(()=>logic.setTalking(false),2000);
    },600);
  },[]);

  useEffect(()=>{if(showLog&&logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},[history,showLog,loading]);

  const handleSend = useCallback(async(text)=>{
    if(!text.trim()||loading) return;
    setInput(""); setExchangeCount(p=>p+1); setShowLog(false);
    let ctx="";
    if(ep.mechanics?.translator) ctx+=`\n[translator_mode: ${translatorDirect?"direct":"daughter"}]`;
    if(ep.mechanics?.breathing)  ctx+=`\n[breathing_calm: ${breathingCalm}]`;
    const parsed = await send(text, ctx);
    if(parsed?.phone_check!==undefined) setPhoneCheck(!!parsed.phone_check);
    if(parsed?.breathing_calm!==undefined) setBreathingCalm(!!parsed.breathing_calm);
    if(parsed?.flag_trigger==="reversal1") setTranslatorDirect(true);
    if(parsed?.flag_trigger==="article_hint") setArticleVisible(true);
    setTimeout(()=>inputRef.current?.focus(),50);
  },[loading, translatorDirect, breathingCalm, send]);

  const emotionMeta = EMOTION_META[emotion]||EMOTION_META.neutral;
  const fatigueDelay = (residentState?.fatigue >= 3 && ep.day >= 4) ? 1 : 0;
  const canEnd      = exchangeCount >= ep.minTurns + fatigueDelay;
  const preNotes    = typeof ep.getNotebookPre==="function" ? ep.getNotebookPre(storyFlags) : ep.notebookPre;
  const isAbnormal  = (k,v) => (k==="BP"&&parseInt(v)>130)||(k==="HR"&&parseInt(v)>90)||(k==="SpO2"&&parseInt(v)<94);

  const visibleMsgs = (()=>{
    const msgs=history.filter(m=>m.role!=="system");
    if(!msgs.length) return [];
    const last=msgs[msgs.length-1];
    if(last.role==="patient"&&msgs.length>=2&&msgs[msgs.length-2].role==="doctor") return [msgs[msgs.length-2],last];
    return [last];
  })();

  const getBubble = (msg) => {
    if(msg.role==="doctor") return {bg:"rgba(52,72,44,0.92)",color:"#ccdac4"};
    if(msg.speaker==="mother") return {bg:"rgba(60,48,75,0.92)",color:"rgba(220,210,240,0.9)"};
    return {bg:"rgba(245,238,218,0.95)",color:"#1a1008"};
  };

  return (
    <div style={{height:"100vh",background:"#0e0c0a",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",inset:0,zIndex:0}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,#2a2520 0%,#1a1612 45%,#12100e 100%)"}}/>
        <div style={{position:"absolute",bottom:"195px",left:"50%",transform:"translateX(-50%)",width:"min(440px,78vw)",aspectRatio:"280/320"}}>
          <ClinicScene emotion={emotion} talking={talking} ep={ep} emotionColor={emotionMeta.color} phoneCheck={phoneCheck} breathingCalm={breathingCalm}/>
        </div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:"310px",background:"linear-gradient(to bottom,transparent 0%,rgba(14,12,10,0.8) 38%,rgba(14,12,10,0.97) 68%,#0e0c0a 100%)"}}/>
      </div>

      {/* Patient Card */}
      <div style={{position:"absolute",top:16,left:16,zIndex:20,background:"rgba(255,255,255,0.09)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.13)",borderRadius:14,padding:"13px 15px",minWidth:175,boxShadow:"0 4px 28px rgba(0,0,0,0.45)",animation:"cardIn 0.4s ease both"}}>
        <div style={{fontSize:8,letterSpacing:"0.35em",color:"rgba(255,255,255,0.3)",marginBottom:10,fontWeight:700}}>PATIENT</div>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${ep.skin}cc,${ep.skin}77)`,border:"1.5px solid rgba(255,255,255,0.15)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{ep.sex==="여"?"👩":"🧑"}</div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"rgba(255,255,255,0.88)",lineHeight:1.2}}>{ep.name}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.38)",marginTop:2}}>{ep.age}세 · {ep.sex}성</div>
          </div>
        </div>
        <div style={{fontSize:11,color:"#f08070",background:"rgba(240,100,80,0.12)",borderRadius:8,padding:"5px 9px",fontStyle:"italic",lineHeight:1.6,marginBottom:10,border:"1px solid rgba(220,80,60,0.2)"}}>"{ep.cc}"</div>
        <RapportBar level={rapportLevel}/>
        {phoneCheck&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:5,background:"rgba(255,200,60,0.12)",borderRadius:8,padding:"4px 9px",border:"1px solid rgba(200,160,40,0.2)"}}><span style={{fontSize:12,animation:"phoneWiggle 0.8s ease-in-out infinite"}}>📱</span><span style={{fontSize:10,color:"rgba(200,160,60,0.85)"}}>핸드폰 확인 중</span></div>}
        {ep.mechanics?.translator&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:5,background:translatorDirect?"rgba(130,90,160,0.15)":"rgba(60,140,120,0.12)",borderRadius:8,padding:"4px 9px",border:`1px solid ${translatorDirect?"rgba(130,90,160,0.3)":"rgba(60,140,120,0.25)"}`}}><span style={{fontSize:10}}>{translatorDirect?"💬":"🌐"}</span><span style={{fontSize:9,color:translatorDirect?"rgba(180,140,210,0.9)":"rgba(100,180,160,0.85)"}}>{translatorDirect?"직접 대화 중":"이수진 (딸) 통역"}</span></div>}
      </div>

      {/* Status Card */}
      <div style={{position:"absolute",top:16,right:16,zIndex:20,background:"rgba(255,255,255,0.09)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.13)",borderRadius:14,padding:"13px 15px",minWidth:150,boxShadow:"0 4px 28px rgba(0,0,0,0.45)",animation:"cardIn 0.4s ease both"}}>
        <div style={{fontSize:8,letterSpacing:"0.35em",color:"rgba(255,255,255,0.3)",marginBottom:10,fontWeight:700}}>STATUS</div>
        <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
          {Object.entries(ep.vitals).map(([k,v])=>{
            const abn=isAbnormal(k,v);
            return <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 9px",borderRadius:8,background:abn?"rgba(220,60,40,0.13)":"rgba(255,255,255,0.06)",border:`1px solid ${abn?"rgba(220,80,60,0.3)":"rgba(255,255,255,0.09)"}`}}><span style={{fontSize:10,color:"rgba(255,255,255,0.38)",fontWeight:600}}>{k}</span><span style={{fontSize:12,color:abn?"#f07060":"rgba(255,255,255,0.8)",fontWeight:abn?800:600}}>{v}</span></div>;
          })}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7,background:`${emotionMeta.color}20`,border:`1px solid ${emotionMeta.color}40`,borderRadius:20,padding:"5px 11px"}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:emotionMeta.color,display:"block",flexShrink:0,animation:"pulse2 2s infinite"}}/>
          <span style={{fontSize:11,color:emotionMeta.color,fontWeight:700}}>{emotionMeta.label}</span>
        </div>
      </div>

      {/* Name tag */}
      <div style={{position:"absolute",bottom:"208px",left:0,right:0,zIndex:5,textAlign:"center",pointerEvents:"none"}}>
        <span style={{fontFamily:"Georgia,serif",fontSize:11,color:"rgba(255,255,255,0.4)",letterSpacing:"0.18em"}}>{ep.name}</span>
      </div>

      {/* Log popup */}
      {showLog&&(
        <div ref={logRef} style={{position:"absolute",bottom:"196px",left:"50%",transform:"translateX(-50%)",width:"min(560px,88vw)",maxHeight:"42vh",overflowY:"auto",zIndex:25,background:"rgba(6,5,4,0.94)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"16px 20px",display:"flex",flexDirection:"column",gap:10}}>
          {history.map((msg,i)=>{
            if(msg.role==="system") return <div key={i} style={{textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.2)"}}>{msg.text}</div>;
            const isDoc=msg.role==="doctor"; const bc=getBubble(msg);
            return (
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:isDoc?"flex-end":"flex-start"}}>
                {!isDoc&&msg.speaker&&<div style={{fontSize:9,color:"rgba(255,255,255,0.25)",marginLeft:28,marginBottom:2}}>{msg.speaker==="mother"?"어머니 (직접)":"이수진 (통역)"}</div>}
                <div style={{display:"flex",justifyContent:isDoc?"flex-end":"flex-start",gap:8,alignItems:"flex-end"}}>
                  {!isDoc&&<div style={{width:20,height:20,borderRadius:"50%",background:EMOTION_META[msg.emotion]?.color||emotionMeta.color,flexShrink:0,opacity:0.55}}/>}
                  <div style={{maxWidth:"74%",padding:"8px 12px",borderRadius:isDoc?"11px 11px 2px 11px":"11px 11px 11px 2px",background:bc.bg,color:bc.color,fontSize:12,lineHeight:1.7}}>
                    {msg.text}
                    {msg.hint&&<div style={{fontStyle:"italic",fontSize:10,color:"rgba(200,185,160,0.45)",marginTop:5}}>{msg.hint}</div>}
                  </div>
                </div>
              </div>
            );
          })}
          {loading&&<div style={{display:"flex",gap:8,alignItems:"flex-end"}}><div style={{width:20,height:20,borderRadius:"50%",background:emotionMeta.color,opacity:0.55,flexShrink:0}}/><div style={{padding:"9px 13px",background:"rgba(255,255,255,0.08)",borderRadius:"11px 11px 11px 2px",display:"flex",gap:4}}>{[0,1,2].map(j=><div key={j} style={{width:4,height:4,borderRadius:"50%",background:"rgba(255,255,255,0.35)",animation:`ep_b 1s ease ${j*0.2}s infinite`}}/>)}</div></div>}
        </div>
      )}

      {/* Dialog + Input */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:10}}>
        {!showLog&&(
          <div style={{padding:"0 clamp(16px,6vw,100px) 10px",display:"flex",flexDirection:"column",gap:10,minHeight:90,justifyContent:"flex-end"}}>
            {visibleMsgs.map((msg,i)=>{
              const isDoc=msg.role==="doctor"; const bc=getBubble(msg);
              return (
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:isDoc?"flex-end":"flex-start"}}>
                  {!isDoc&&msg.speaker&&<div style={{fontSize:9,color:"rgba(255,255,255,0.25)",marginLeft:38,marginBottom:2}}>{msg.speaker==="mother"?"어머니 (직접)":"이수진 (통역)"}</div>}
                  <div style={{display:"flex",justifyContent:isDoc?"flex-end":"flex-start",alignItems:"flex-end",gap:10}}>
                    {!isDoc&&<div style={{width:28,height:28,borderRadius:"50%",background:EMOTION_META[msg.emotion]?.color||emotionMeta.color,flexShrink:0,opacity:0.65,boxShadow:`0 0 10px ${EMOTION_META[msg.emotion]?.color||emotionMeta.color}55`}}/>}
                    <div style={{maxWidth:"72%",padding:"12px 17px",borderRadius:isDoc?"15px 15px 4px 15px":"15px 15px 15px 4px",background:bc.bg,color:bc.color,fontSize:13.5,lineHeight:1.8,boxShadow:"0 3px 18px rgba(0,0,0,0.45)",backdropFilter:"blur(8px)"}}>
                      {msg.text}
                      {msg.hint&&<div style={{fontStyle:"italic",fontSize:11,color:"rgba(200,185,160,0.4)",marginTop:5}}>{msg.hint}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
            {loading&&<div style={{display:"flex",alignItems:"flex-end",gap:10}}><div style={{width:28,height:28,borderRadius:"50%",background:emotionMeta.color,opacity:0.65,flexShrink:0}}/><div style={{padding:"12px 17px",background:"rgba(245,238,218,0.95)",borderRadius:"15px 15px 15px 4px",display:"flex",gap:6,alignItems:"center"}}>{[0,1,2].map(j=><div key={j} style={{width:5,height:5,borderRadius:"50%",background:"#a09060",animation:`ep_b 1s ease ${j*0.22}s infinite`}}/>)}</div></div>}
          </div>
        )}

        <div style={{padding:"10px 20px 18px",background:"rgba(10,8,6,0.97)",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",gap:10,alignItems:"flex-end"}}>
          <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
            <button onClick={()=>setNotebookOpen(o=>!o)} style={{background:notebookOpen?"rgba(200,175,80,0.22)":"rgba(255,255,255,0.06)",border:`1px solid ${notebookOpen?"rgba(200,175,80,0.4)":"rgba(255,255,255,0.1)"}`,color:notebookOpen?"rgba(210,185,90,0.9)":"rgba(255,255,255,0.4)",padding:"7px 11px",cursor:"pointer",fontSize:11,fontFamily:"inherit",borderRadius:8}}>📓</button>
            <button onClick={()=>setShowLog(v=>!v)} style={{background:showLog?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",padding:"7px 11px",cursor:"pointer",fontSize:11,fontFamily:"inherit",borderRadius:8}}>📋</button>
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
            {ep.mechanics?.translator&&sessionFlags.daughter_suspicious&&(
              <button onClick={()=>setTranslatorDirect(d=>!d)} style={{alignSelf:"flex-start",background:translatorDirect?"rgba(130,90,160,0.2)":"rgba(60,140,120,0.15)",border:`1px solid ${translatorDirect?"rgba(130,90,160,0.4)":"rgba(60,140,120,0.3)"}`,color:translatorDirect?"rgba(180,140,210,0.9)":"rgba(100,180,160,0.9)",padding:"4px 10px",borderRadius:20,cursor:"pointer",fontSize:10,fontFamily:"inherit"}}>
                {translatorDirect?"⇄ 통역 통해서":"💬 어머니께 직접"}
              </button>
            )}
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend(input);}}}
              placeholder="무슨 말을 할까요...   ↵ Enter" disabled={loading} rows={2}
              style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:10,padding:"11px 14px",fontSize:13,fontFamily:"system-ui,sans-serif",lineHeight:1.65,color:"rgba(255,255,255,0.82)",outline:"none",resize:"none",caretColor:"#c0b070"}}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            <button onClick={()=>handleSend(input)} disabled={loading||!input.trim()} style={{background:(loading||!input.trim())?"rgba(255,255,255,0.06)":"rgba(64,82,52,0.9)",border:"none",color:(loading||!input.trim())?"rgba(255,255,255,0.2)":"#ccdac4",padding:"11px 17px",borderRadius:8,cursor:(loading||!input.trim())?"not-allowed":"pointer",fontSize:12,fontFamily:"inherit"}}>전송</button>
            {canEnd&&<button onClick={()=>onEnd({...sessionFlags, exchangeCount})} style={{background:"rgba(160,130,60,0.18)",border:"1px solid rgba(170,140,60,0.38)",color:"rgba(190,160,75,0.88)",padding:"11px 17px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(160,130,60,0.32)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(160,130,60,0.18)";}}>마치기</button>}
          </div>
        </div>
      </div>

      <NotebookPanel isOpen={notebookOpen} onClose={()=>setNotebookOpen(false)} epNum={ep.titleNum} preNotes={preNotes} userNotes={userNotes} onUserNotesChange={setUserNotes} articleText={ep.articleText} articleVisible={articleVisible}/>
      <style>{`@keyframes ep_b{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-5px);opacity:1}}@keyframes pulse2{0%,100%{opacity:0.7;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}@keyframes phoneWiggle{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-12deg)}75%{transform:rotate(12deg)}}@keyframes cardIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}@keyframes breatheRing{0%,100%{transform:scaleX(1);opacity:0.2}50%{transform:scaleX(1.12);opacity:0.35}}`}</style>
    </div>
  );
}
