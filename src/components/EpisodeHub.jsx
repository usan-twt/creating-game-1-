import { useState, useEffect } from "react";
import { EPISODE_LIST } from "../data/episodes";

export default function EpisodeHub({ storyFlags, onPlay }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), 80); return () => clearTimeout(t); }, []);

  // Find next uncompleted episode
  const nextEp = EPISODE_LIST.find(ep => !storyFlags[ep.completedFlag]);
  const allDone = !nextEp;
  const dayNum = nextEp ? nextEp.day : 10;
  const progress = EPISODE_LIST.filter(ep => storyFlags[ep.completedFlag]).length;

  const handleClick = () => {
    if (nextEp) onPlay(nextEp.id);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        minHeight: "100vh",
        background: "#0e0c0a",
        fontFamily: "Georgia, serif",
        opacity: vis ? 1 : 0,
        transition: "opacity 1.2s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: allDone ? "default" : "pointer",
        userSelect: "none",
      }}
    >
      {/* Title */}
      <div style={{
        fontSize: 11,
        letterSpacing: "0.6em",
        color: "#3a2e24",
        marginBottom: 20,
        opacity: vis ? 1 : 0,
        transition: "opacity 1.5s ease 0.3s",
      }}>
        INTERN
      </div>

      <div style={{
        width: 40,
        height: 1,
        background: "#3a2e24",
        margin: "0 auto 24px",
        opacity: vis ? 1 : 0,
        transition: "opacity 1.5s ease 0.5s",
      }} />

      <div style={{
        fontSize: 13,
        color: "#5a4a38",
        letterSpacing: "0.15em",
        marginBottom: 8,
        opacity: vis ? 1 : 0,
        transition: "opacity 1.5s ease 0.7s",
      }}>
        레지던트 1년차
      </div>

      <div style={{
        fontSize: 10,
        color: "#3a2e24",
        marginBottom: 64,
        opacity: vis ? 1 : 0,
        transition: "opacity 1.5s ease 0.9s",
      }}>
        오늘의 외래 환자
      </div>

      {/* Day / Progress indicator */}
      {!allDone ? (
        <div style={{
          opacity: vis ? 1 : 0,
          transition: "opacity 1.5s ease 1.1s",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: 10,
            letterSpacing: "0.3em",
            color: "rgba(255,255,255,0.15)",
            marginBottom: 8,
          }}>
            DAY {dayNum}
          </div>
          <div style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            marginBottom: 32,
          }}>
            {nextEp.subtitle}
          </div>

          {/* Progress dots */}
          <div style={{
            display: "flex",
            gap: 6,
            justifyContent: "center",
            marginBottom: 48,
          }}>
            {EPISODE_LIST.map((ep, i) => (
              <div
                key={ep.id}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: storyFlags[ep.completedFlag]
                    ? "rgba(120,200,120,0.5)"
                    : ep.id === nextEp.id
                      ? "rgba(255,255,255,0.5)"
                      : "rgba(255,255,255,0.1)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>

          <div style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.1em",
            animation: "pulse 2.5s ease-in-out infinite",
          }}>
            화면을 클릭하세요
          </div>
        </div>
      ) : (
        <div style={{
          opacity: vis ? 1 : 0,
          transition: "opacity 1.5s ease 1.1s",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.1em",
          }}>
            1년차가 끝났습니다.
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
