import { useState, useEffect } from "react";

export default function InterludeScreen({ interlude, storyFlags, residentState, onContinue }) {
  const [vis, setVis] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setVis(true), 100);
    const t2 = setTimeout(() => setShowChoices(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const content = interlude.getContent(storyFlags, residentState);

  const handleChoice = (choice) => {
    onContinue(choice.effects || {});
  };

  return (
    <div style={{
      minHeight:"100vh", background:"#0e0c0a", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", fontFamily:"Georgia,serif",
      opacity:vis?1:0, transition:"opacity 0.8s ease",
    }}>
      <div style={{ textAlign:"center", maxWidth:360, padding:"0 24px" }}>
        {/* Location */}
        <div style={{
          fontSize:9, letterSpacing:"0.4em", color:"#3a2e24", marginBottom:24,
        }}>{interlude.location.toUpperCase()}</div>

        {/* Speaker */}
        <div style={{ marginBottom:32 }}>
          <div style={{
            fontSize:14, color:"rgba(255,255,255,0.6)", marginBottom:4,
          }}>{interlude.speaker}</div>
          <div style={{
            fontSize:10, color:"rgba(255,255,255,0.2)",
          }}>{interlude.speakerDesc}</div>
        </div>

        {/* Dialogue lines */}
        <div style={{
          background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)",
          borderRadius:10, padding:"20px 24px", marginBottom:28, textAlign:"left",
        }}>
          {content.lines.map((line, i) => (
            <div key={i} style={{
              fontSize:12.5, color: line === "..." ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.65)",
              lineHeight:2.2,
              opacity:vis?1:0,
              transition:`opacity 0.7s ease ${0.3 + i * 0.2}s`,
            }}>{line}</div>
          ))}
        </div>

        {/* Choices */}
        {showChoices && (
          <div style={{
            display:"flex", flexDirection:"column", gap:10,
            opacity:showChoices?1:0, transition:"opacity 0.6s ease",
          }}>
            {content.choices.map((choice, i) => (
              <button key={i} onClick={() => handleChoice(choice)}
                style={{
                  background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                  borderRadius:8, padding:"12px 18px", cursor:"pointer",
                  fontFamily:"Georgia,serif", fontSize:12, color:"rgba(255,255,255,0.5)",
                  textAlign:"left", transition:"all 0.2s", lineHeight:1.6,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.09)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                }}>
                {choice.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
