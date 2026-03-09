import { useState, useEffect, useRef } from "react";
import { EP10_COLLEAGUE_PROMPT, EP10_PROFESSOR_PROMPT } from "../data/episodes";
import NotebookPanel from "./NotebookPanel";

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export default function EP10Screen({ ep, storyFlags, onEnd }) {
  const [choice,      setChoice]      = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [turnCount,   setTurnCount]   = useState(0);
  const [sessionFlags,setSessionFlags]= useState({});
  const [notebookOpen,setNotebookOpen]= useState(false);
  const [userNotes,   setUserNotes]   = useState("");
  const [vis,         setVis]         = useState(false);
  const apiMsgRef  = useRef([]);
  const inputRef   = useRef(null);
  const logRef     = useRef(null);

  useEffect(()=>{const t=setTimeout(()=>setVis(true),80);return()=>clearTimeout(t);},[]);
  useEffect(()=>{if(logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},[messages,loading]);

  const systemPrompt = choice==="colleague" ? EP10_COLLEAGUE_PROMPT : choice==="professor" ? EP10_PROFESSOR_PROMPT : "";
  const choiceName = choice==="colleague"?"박세진 (동기)":choice==="professor"?"김철수 교수님":"(혼자)";

  const handleChoose = (c) => {
    setChoice(c);
    if(c==="alone") return;
    const opening = c==="colleague" ? "어, 왔어? 나 지금 진짜 녹초야. 앉아." : "(논문에서 눈을 들며) 응, 뭐야. 들어와.";
    setTimeout(()=>{ setMessages([{role:"other",text:opening}]); },400);
  };

  const handleSend = async(text) => {
    if(!text.trim()||loading) return;
    setInput(""); setLoading(true); setTurnCount(p=>p+1);
    setMessages(p=>[...p,{role:"self",text}]);
    const newMsgs=[...apiMsgRef.current,{role:"user",content:`[turn: ${turnCount+1}]\n나: ${text}`}];
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:350,system:systemPrompt,messages:newMsgs})});
      if(!res.ok) throw new Error();
      const data=await res.json();
      const raw=data.content?.[0]?.text??"";
      let parsed={emotion:"neutral",text:"...",flag_trigger:"none"};
      try{const m=raw.match(/\{[\s\S]*\}/);parsed=JSON.parse(m?m[0]:raw);}catch{}
      if(parsed.flag_trigger&&parsed.flag_trigger!=="none") setSessionFlags(p=>({...p,[parsed.flag_trigger]:true}));
      apiMsgRef.current=[...newMsgs,{role:"assistant",content:parsed.text}];
      setMessages(p=>[...p,{role:"other",text:parsed.text}]);
    }catch{
      setMessages(p=>[...p,{role:"system",text:"연결에 문제가 생겼어요."}]);
    }finally{
      setLoading(false);
      setTimeout(()=>inputRef.current?.focus(),50);
    }
  };

  const canEnd = turnCount>=ep.minTurns || choice==="alone";

  // Before choice
  if(!choice) return (
    <div style={{minHeight:"100vh",background:"#0e0c0a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",opacity:vis?1:0,transition:"opacity 1s ease"}}>
      <div style={{textAlign:"center",maxWidth:420,padding:"0 24px"}}>
        <div style={{fontSize:9,letterSpacing:"0.5em",color:"#4a3a2a",marginBottom:20}}>INTERN</div>
        <div style={{width:36,height:1,background:"#4a3a28",margin:"0 auto 24px"}}/>
        <div style={{fontSize:30,color:"#e0d4c0",marginBottom:8,letterSpacing:"0.06em"}}>EP.10</div>
        <div style={{fontSize:14,color:"#a09070",marginBottom:10,fontStyle:"italic"}}>금요일 저녁</div>
        <div style={{fontSize:11,color:"#5a4a38",lineHeight:2.4,marginBottom:48}}>1년차 마지막 주.<br/>오늘 외래가 끝났다.<br/>어디로 갈까.</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[
            {key:"colleague",label:"동기 찾아가기",sub:"박세진, 라운지에 있을 것 같다"},
            {key:"professor",label:"교수님 연구실",sub:"마지막으로 인사를 드리고 싶다"},
            {key:"alone",label:"그냥 여기 있기",sub:"잠깐 혼자 있어도 괜찮을 것 같다"},
          ].map(opt=>(
            <button key={opt.key} onClick={()=>handleChoose(opt.key)}
              style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"14px 20px",cursor:"pointer",fontFamily:"Georgia,serif",transition:"all 0.2s",textAlign:"left"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.09)";e.currentTarget.style.borderColor="rgba(255,255,255,0.18)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";}}>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.75)",marginBottom:3}}>{opt.label}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.28)"}}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Alone
  if(choice==="alone") {
    const completedCount = Object.keys(storyFlags).filter(k=>k.endsWith("_completed")&&storyFlags[k]).length;
    const openedCount = [storyFlags.EP1_jinsu_opened,storyFlags.EP2_reversal2||storyFlags.EP2_reversal1,storyFlags.EP3_real_opened,storyFlags.EP5_real_opened,storyFlags.EP8_grief_opened].filter(Boolean).length;
    const reflections = [
      "외래가 끝났다.",
      " ",
      completedCount>=8 ? "1년 동안 많은 사람을 만났다." : "몇 명을 만났다.",
      " ",
      openedCount>=3 ? "몇 번은, 들을 수 있었던 것 같다." : openedCount>=1 ? "한 번은, 무언가를 들었던 것 같다." : "그냥 지나간 것들이 많다.",
      " ",
      "창밖이 어두워졌다.",
      " ",
      "내년에도 이 창문은 똑같을 것 같다.",
    ];
    return (
      <div style={{minHeight:"100vh",background:"#0e0c0a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif"}}>
        <div style={{textAlign:"center",maxWidth:280,padding:"0 24px"}}>
          {reflections.map((line,i)=>(
            <div key={i} style={{fontSize:12,color:"#847060",lineHeight:2.2,minHeight:line===" "?14:"auto",opacity:vis?1:0,transition:`opacity 0.9s ease ${0.3+i*0.25}s`}}>{line===" "?"\u00a0":line}</div>
          ))}
          <div style={{marginTop:48,opacity:vis?1:0,transition:`opacity 0.8s ease ${0.3+reflections.length*0.25+0.4}s`}}>
            <button onClick={()=>onEnd({alone_reflection:true})}
              style={{background:"none",border:"1px solid #3a2a18",color:"#6a5a40",padding:"10px 30px",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:11,letterSpacing:"0.14em"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#7a6a50";e.currentTarget.style.color="#a09070";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#3a2a18";e.currentTarget.style.color="#6a5a40";}}>
              일어나기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation
  return (
    <div style={{height:"100vh",background:"#0e0c0a",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{flex:1,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:choice==="colleague"?"linear-gradient(170deg,#1a1820 0%,#0e0c0a 100%)":"linear-gradient(170deg,#18201a 0%,#0e0c0a 100%)"}}/>
        <div style={{position:"absolute",top:"20%",left:"50%",transform:"translateX(-50%)",width:300,height:200,borderRadius:"50%",background:choice==="colleague"?"rgba(80,70,120,0.08)":"rgba(60,90,70,0.08)",filter:"blur(40px)"}}/>
        <div style={{position:"absolute",top:24,left:0,right:0,textAlign:"center"}}>
          <span style={{fontFamily:"Georgia,serif",fontSize:9,letterSpacing:"0.4em",color:"rgba(255,255,255,0.18)"}}>{choice==="colleague"?"레지던트 라운지":"교수 연구실"}</span>
        </div>

        <div ref={logRef} style={{position:"absolute",inset:0,overflowY:"auto",padding:"60px clamp(20px,8vw,120px) 20px",display:"flex",flexDirection:"column",gap:16,justifyContent:"flex-end"}}>
          {messages.map((msg,i)=>{
            if(msg.role==="system") return <div key={i} style={{textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.2)"}}>{msg.text}</div>;
            const isSelf=msg.role==="self";
            return (
              <div key={i} style={{display:"flex",justifyContent:isSelf?"flex-end":"flex-start",alignItems:"flex-end",gap:10}}>
                {!isSelf&&<div style={{width:32,height:32,borderRadius:"50%",background:choice==="colleague"?"rgba(80,70,120,0.6)":"rgba(60,90,70,0.6)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{choice==="colleague"?"👤":"👨‍⚕️"}</div>}
                <div>
                  {!isSelf&&<div style={{fontSize:9,color:"rgba(255,255,255,0.25)",marginBottom:4,letterSpacing:"0.05em"}}>{choiceName}</div>}
                  <div style={{maxWidth:"68vw",padding:"12px 16px",borderRadius:isSelf?"14px 14px 4px 14px":"14px 14px 14px 4px",background:isSelf?"rgba(64,82,52,0.88)":"rgba(255,255,255,0.08)",color:isSelf?"#ccdac4":"rgba(255,255,255,0.82)",fontSize:13,lineHeight:1.75,backdropFilter:"blur(8px)",boxShadow:"0 2px 14px rgba(0,0,0,0.4)"}}>{msg.text}</div>
                </div>
              </div>
            );
          })}
          {loading&&<div style={{display:"flex",alignItems:"flex-end",gap:10}}><div style={{width:32,height:32,borderRadius:"50%",background:"rgba(80,70,120,0.6)",flexShrink:0}}/><div style={{padding:"12px 16px",background:"rgba(255,255,255,0.08)",borderRadius:"14px 14px 14px 4px",display:"flex",gap:5}}>{[0,1,2].map(j=><div key={j} style={{width:5,height:5,borderRadius:"50%",background:"rgba(255,255,255,0.35)",animation:`ep_b 1s ease ${j*0.2}s infinite`}}/>)}</div></div>}
        </div>
      </div>

      <div style={{padding:"10px 20px 18px",background:"rgba(10,8,6,0.97)",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",gap:10,alignItems:"flex-end"}}>
        <button onClick={()=>setNotebookOpen(o=>!o)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",padding:"7px 11px",cursor:"pointer",fontSize:11,fontFamily:"inherit",borderRadius:8,flexShrink:0}}>📓</button>
        <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend(input);}}}
          placeholder={`${choiceName.split(" ")[0]}에게...   ↵ Enter`} disabled={loading} rows={2}
          style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:10,padding:"11px 14px",fontSize:13,fontFamily:"system-ui,sans-serif",lineHeight:1.65,color:"rgba(255,255,255,0.82)",outline:"none",resize:"none",caretColor:"#c0b070"}}/>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          <button onClick={()=>handleSend(input)} disabled={loading||!input.trim()} style={{background:(loading||!input.trim())?"rgba(255,255,255,0.06)":"rgba(64,82,52,0.9)",border:"none",color:(loading||!input.trim())?"rgba(255,255,255,0.2)":"#ccdac4",padding:"11px 17px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>전송</button>
          {canEnd&&<button onClick={()=>onEnd({...sessionFlags,choice})} style={{background:"rgba(160,130,60,0.18)",border:"1px solid rgba(170,140,60,0.38)",color:"rgba(190,160,75,0.88)",padding:"11px 17px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(160,130,60,0.32)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(160,130,60,0.18)";}}>나가기</button>}
        </div>
      </div>

      <NotebookPanel isOpen={notebookOpen} onClose={()=>setNotebookOpen(false)} epNum={ep.titleNum} preNotes={ep.notebookPre} userNotes={userNotes} onUserNotesChange={setUserNotes}/>
      <style>{`@keyframes ep_b{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-5px);opacity:1}}@keyframes pulse2{0%,100%{opacity:0.7;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}`}</style>
    </div>
  );
}
