import { useState, useCallback } from "react";
import { EPISODE_LIST } from "./data/episodes";
import EpisodeHub from "./components/EpisodeHub";
import IntroScreen from "./components/IntroScreen";
import ResultScreen from "./components/ResultScreen";
import GameScreen from "./components/GameScreen";
import DualGameScreen from "./components/DualGameScreen";
import EP10Screen from "./components/EP10Screen";

export default function App() {
  const [storyFlags, setStoryFlags] = useState({
    EP1_completed:false, EP1_jinsu_opened:false,
    EP2_completed:false, EP2_daughter_suspicious:false, EP2_reversal1:false, EP2_reversal2:false,
    EP3_completed:false, EP3_real_opened:false,
    EP4_completed:false, EP4_deeper_connection:false,
    EP5_completed:false, EP5_real_opened:false,
    EP6_completed:false, EP6_asked_the_question:false, EP6_answered_directly:false, EP6_gave_comfort:false, EP6_deflected:false,
    EP7_completed:false,
    EP8_completed:false, EP8_grief_opened:false,
    EP9_completed:false, EP9_article_hint:false, EP9_real_opened:false,
    EP10_completed:false,
  });

  const [phase,       setPhase]       = useState("hub");
  const [currentEpId, setCurrentEpId] = useState(null);
  const [sessionSnap, setSessionSnap] = useState({});

  const ep = currentEpId ? EPISODE_LIST.find(e=>e.id===currentEpId) : null;

  const handlePlay = useCallback((epId)=>{setCurrentEpId(epId);setPhase("intro");},[]);
  const handleStart = useCallback(()=>setPhase("game"),[]);

  const handleEnd = useCallback((localFlags)=>{
    const epDef = EPISODE_LIST.find(e=>e.id===currentEpId);
    const updates = { [epDef.completedFlag]: true };
    epDef.localFlags.forEach(flag=>{
      if(localFlags[flag]) updates[`${epDef.id}_${flag}`]=true;
    });
    if(epDef.id==="EP7") {
      if(localFlags.turnsA!==undefined) updates.EP7_turnsA=localFlags.turnsA;
      if(localFlags.turnsB!==undefined) updates.EP7_turnsB=localFlags.turnsB;
    }
    setStoryFlags(p=>({...p,...updates}));
    setSessionSnap(localFlags);
    setPhase("result");
  },[currentEpId]);

  const handleContinue = useCallback(()=>{setCurrentEpId(null);setPhase("hub");},[]);

  if(phase==="hub")    return <EpisodeHub storyFlags={storyFlags} onPlay={handlePlay}/>;
  if(phase==="intro")  return <IntroScreen ep={ep} onStart={handleStart}/>;
  if(phase==="result") return <ResultScreen ep={ep} storyFlags={storyFlags} sessionFlags={sessionSnap} onContinue={handleContinue}/>;

  if(ep.mechanics?.dual)      return <DualGameScreen ep={ep} storyFlags={storyFlags} onEnd={handleEnd}/>;
  if(ep.mechanics?.noPatient) return <EP10Screen ep={ep} storyFlags={storyFlags} onEnd={handleEnd}/>;
  return <GameScreen ep={ep} storyFlags={storyFlags} onEnd={handleEnd}/>;
}
