import { useState, useEffect } from "react";

export default function DiscoveryFlash({ discovery, onDone }) {
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVis(true), 50);
    const t2 = setTimeout(() => setVis(false), 2800);
    const t3 = setTimeout(() => onDone?.(), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      pointerEvents: "none",
    }}>
      <div style={{
        textAlign: "center",
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        padding: "24px 36px",
        background: "rgba(10,8,6,0.88)",
        border: `1px solid ${discovery.color}55`,
        borderRadius: 12,
        backdropFilter: "blur(20px)",
        maxWidth: 280,
        boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 30px ${discovery.color}18`,
      }}>
        <div style={{
          fontSize: 8, letterSpacing: "0.55em", color: discovery.color,
          marginBottom: 10, fontFamily: "Georgia,serif", opacity: 0.8,
        }}>DISCOVERED</div>
        <div style={{
          width: 32, height: 1, background: `${discovery.color}40`,
          margin: "0 auto 14px",
        }} />
        <div style={{
          fontSize: 15, color: "rgba(255,255,255,0.88)", fontFamily: "Georgia,serif",
          marginBottom: 10, fontWeight: 600, lineHeight: 1.4,
        }}>{discovery.title}</div>
        <div style={{
          fontSize: 12, color: "rgba(255,255,255,0.48)", lineHeight: 1.75,
          fontFamily: "Georgia,serif",
        }}>{discovery.text}</div>
      </div>
    </div>
  );
}
