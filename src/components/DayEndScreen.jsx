import { useState, useEffect } from "react";

export default function DayEndScreen({ ep, sessionSnap, onContinue }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), 100); return () => clearTimeout(t); }, []);

  const exchanges = sessionSnap?.exchangeCount || ep.minTurns || 5;
  const overTime = exchanges - (ep.minTurns || 5);
  const timeNote = overTime > 4
    ? "밖이 어두워져 있었다."
    : overTime > 1
    ? "오늘은 조금 늦었다."
    : "정시에 끝났다.";

  const isEP7 = ep.id === "EP7";

  return (
    <div style={{
      minHeight:"100vh", background:"#0e0c0a", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", fontFamily:"Georgia,serif",
      opacity:vis?1:0, transition:"opacity 1s ease",
    }}>
      <div style={{ textAlign:"center", maxWidth:300, padding:"0 24px" }}>
        <div style={{
          fontSize:8, letterSpacing:"0.5em", color:"#3a2e24", marginBottom:20,
        }}>DAY {ep.day}</div>

        <div style={{ width:200, height:1, background:"#2a2018", margin:"0 auto 28px" }} />

        <div style={{
          fontSize:10, letterSpacing:"0.15em", color:"#5a4a38", marginBottom:32,
        }}>{ep.subtitle}</div>

        <div style={{
          background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)",
          borderRadius:8, padding:"16px 20px", marginBottom:24, textAlign:"left",
        }}>
          <div style={{
            fontSize:8, letterSpacing:"0.3em", color:"rgba(255,255,255,0.2)",
            marginBottom:12,
          }}>오늘의 외래</div>

          {isEP7 ? (
            <>
              <PatientRow name={ep.patientA.name} age={ep.patientA.age} sex={ep.patientA.sex} />
              <PatientRow name={ep.patientB.name} age={ep.patientB.age} sex={ep.patientB.sex} />
            </>
          ) : ep.name && ep.age > 0 ? (
            <PatientRow name={ep.name} age={ep.age} sex={ep.sex} />
          ) : null}

          <div style={{ width:"100%", height:1, background:"rgba(255,255,255,0.04)", margin:"12px 0" }} />

          <div style={{
            fontSize:10, color:"rgba(255,255,255,0.2)", fontStyle:"italic",
          }}>{timeNote}</div>
        </div>

        {ep.getDayEndNarrative && (() => {
          const lines = ep.getDayEndNarrative(sessionSnap || {});
          if (!lines?.length) return null;
          return (
            <div style={{
              marginBottom: 24, textAlign: "left",
            }}>
              {lines.map((line, i) => (
                <div key={i} style={{
                  fontSize: 11, color: "rgba(255,255,255,0.28)",
                  fontFamily: "Georgia,serif", fontStyle: "italic",
                  lineHeight: 1.9, letterSpacing: "0.02em",
                }}>{line}</div>
              ))}
            </div>
          );
        })()}

        <div style={{
          opacity:vis?1:0, transition:`opacity 0.8s ease 0.6s`,
        }}>
          <button onClick={onContinue}
            style={{
              background:"none", border:"1px solid #3a2a18", color:"#6a5a40",
              padding:"10px 30px", cursor:"pointer", fontFamily:"Georgia,serif",
              fontSize:11, letterSpacing:"0.14em", transition:"all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#7a6a50"; e.currentTarget.style.color="#a09070"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="#3a2a18"; e.currentTarget.style.color="#6a5a40"; }}>
            계속
          </button>
        </div>
      </div>
    </div>
  );
}

function PatientRow({ name, age, sex }) {
  return (
    <div style={{
      display:"flex", justifyContent:"space-between", alignItems:"center",
      marginBottom:6,
    }}>
      <div>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", fontWeight:600 }}>{name}</span>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginLeft:8 }}>{age}세 {sex}성</span>
      </div>
      <span style={{ fontSize:9, color:"#78c878", letterSpacing:"0.08em" }}>완료</span>
    </div>
  );
}
