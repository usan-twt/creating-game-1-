import { useState, useRef, useCallback } from "react";

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export default function useGameLogic(systemPrompt) {
  const [emotion,       setEmotion]       = useState("neutral");
  const [talking,       setTalking]       = useState(false);
  const [history,       setHistory]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [rapportLevel,  setRapportLevel]  = useState(0);
  const [sessionFlags,  setSessionFlags]  = useState({});
  const apiMsgRef   = useRef([]);
  const rapportRef  = useRef(0);
  const talkTimer   = useRef(null);

  const send = useCallback(async(text, extraCtx="") => {
    if(!text.trim()||loading) return null;
    setLoading(true);
    setHistory(p=>[...p,{role:"doctor",text}]);
    const rapport = rapportRef.current;
    const ctx = `[rapport_level: ${rapport}]${extraCtx}\n의사: ${text}`;
    const newMsgs = [...apiMsgRef.current, {role:"user",content:ctx}];
    clearTimeout(talkTimer.current);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json","x-api-key":API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,system:systemPrompt,messages:newMsgs}),
      });
      if(!res.ok) throw new Error();
      const data = await res.json();
      const raw = data.content?.[0]?.text??"";
      let parsed={emotion:"neutral",text:"...",rapport_change:0,flag_trigger:"none"};
      try{const m=raw.match(/\{[\s\S]*\}/);parsed=JSON.parse(m?m[0]:raw);}catch{}
      const nr=Math.max(0,Math.min(5,rapport+(parsed.rapport_change||0)));
      rapportRef.current=nr; setRapportLevel(nr);
      setEmotion(parsed.emotion||"neutral");
      const flag=parsed.flag_trigger;
      if(flag&&flag!=="none") setSessionFlags(p=>({...p,[flag]:true}));
      apiMsgRef.current=[...newMsgs,{role:"assistant",content:parsed.text}];
      setTalking(true);
      setHistory(p=>[...p,{role:"patient",text:parsed.text,emotion:parsed.emotion,speaker:parsed.speaker,hint:parsed.hint}]);
      talkTimer.current=setTimeout(()=>setTalking(false),2200);
      return parsed;
    } catch {
      setHistory(p=>[...p,{role:"system",text:"연결에 문제가 생겼어요."}]);
      return null;
    } finally { setLoading(false); }
  },[loading, systemPrompt]);

  return { emotion, setEmotion, talking, setTalking, history, setHistory, loading, rapportLevel, setRapportLevel, sessionFlags, setSessionFlags, send, rapportRef, talkTimer };
}
