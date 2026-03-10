import { useState, useEffect, useRef } from "react";
import { EPISODE_LIST } from "../data/episodes";

/* ── EKG pulse line (Rhythm Doctor-inspired) ── */
function EkgLine({ animate }) {
  const w = 280, h = 48, mid = h / 2;
  // Flatline with one heartbeat pulse in the middle
  const pulse = `M0,${mid} L${w*0.35},${mid} L${w*0.40},${mid-14} L${w*0.44},${mid+18} L${w*0.48},${mid-22} L${w*0.52},${mid+8} L${w*0.56},${mid} L${w},${mid}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      {/* Base flatline (always visible, dim) */}
      <line x1={0} y1={mid} x2={w} y2={mid} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      {/* Pulse trace */}
      <path
        d={pulse}
        fill="none"
        stroke="rgba(180,140,100,0.3)"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="700"
        strokeDashoffset={animate ? "0" : "700"}
        style={{ transition: "stroke-dashoffset 2.5s ease-out" }}
      />
      {/* Glowing dot that traces the line */}
      {animate && (
        <circle r={2.5} fill="rgba(200,160,100,0.6)">
          <animateMotion dur="2.5s" fill="freeze" path={pulse} />
        </circle>
      )}
    </svg>
  );
}

/* ── Scene-setting lines (minimal, environmental) ── */
const SCENE_LINES = [
  "월요일 아침. 외래 진료실 불이 켜진다.",
  "화요일. 대기실에 이미 사람이 앉아 있다.",
  "수요일. 복도에 커피 향이 난다.",
  "목요일. 낯익은 이름이 차트에 올라와 있다.",
  "금요일 오전. 응급실에서 올라온 환자가 있다.",
  "월요일. 진료실 창 너머로 비가 내린다.",
  "화요일. 오늘은 환자가 두 명이다.",
  "수요일 오후. 조용한 진료실.",
  "목요일. 마지막 환자가 남아 있다.",
  "금요일. 1년차의 마지막 외래.",
];

export default function EpisodeHub({ storyFlags, onPlay }) {
  const [phase, setPhase] = useState(0); // 0: dark, 1: ekg, 2: text, 3: ready
  const timerRef = useRef(null);

  useEffect(() => {
    const timings = [300, 2800, 4200];
    let t1, t2, t3;
    t1 = setTimeout(() => setPhase(1), timings[0]);
    t2 = setTimeout(() => setPhase(2), timings[1]);
    t3 = setTimeout(() => setPhase(3), timings[2]);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const nextEp = EPISODE_LIST.find(ep => !storyFlags[ep.completedFlag]);
  const allDone = !nextEp;
  const progress = EPISODE_LIST.filter(ep => storyFlags[ep.completedFlag]).length;
  const sceneLine = SCENE_LINES[allDone ? 9 : progress];

  const handleClick = () => {
    if (nextEp && phase >= 2) onPlay(nextEp.id);
  };

  return (
    <div
      onClick={allDone ? undefined : handleClick}
      style={{
        minHeight: "100vh",
        background: "#0e0c0a",
        fontFamily: "Georgia, serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: allDone ? "default" : phase >= 2 ? "pointer" : "default",
        userSelect: "none",
        padding: "0 32px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient light — subtle warm gradient at top (morning light) */}
      <div style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "120%",
        height: "40%",
        background: "radial-gradient(ellipse at 50% 0%, rgba(60,45,25,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
        opacity: phase >= 1 ? 1 : 0,
        transition: "opacity 3s ease",
      }} />

      {/* Main content */}
      <div style={{ position: "relative", textAlign: "center" }}>

        {/* EKG line — the first thing that appears */}
        <div style={{
          marginBottom: 48,
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}>
          <EkgLine animate={phase >= 1} />
        </div>

        {/* Title — fades in after EKG traces */}
        <div style={{
          opacity: phase >= 2 ? 1 : 0,
          transition: "opacity 1.2s ease",
          marginBottom: 40,
        }}>
          <div style={{
            fontSize: 10,
            letterSpacing: "0.7em",
            color: "rgba(180,140,100,0.5)",
            marginBottom: 6,
          }}>
            INTERN
          </div>
          <div style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.18)",
            letterSpacing: "0.12em",
          }}>
            레지던트 1년차
          </div>
        </div>

        {/* Scene line — grounds you in a specific moment */}
        <div style={{
          opacity: phase >= 2 ? 1 : 0,
          transition: "opacity 1.5s ease 0.4s",
          marginBottom: 48,
        }}>
          <div style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.03em",
            lineHeight: "1.8",
          }}>
            {sceneLine}
          </div>
        </div>

        {/* Bottom: day + progress + prompt */}
        <div style={{
          opacity: phase >= 3 ? 1 : 0,
          transition: "opacity 1.2s ease",
        }}>
          {!allDone ? (
            <>
              {/* Progress dots */}
              <div style={{
                display: "flex",
                gap: 6,
                justifyContent: "center",
                marginBottom: 32,
              }}>
                {EPISODE_LIST.map((ep) => (
                  <div
                    key={ep.id}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: storyFlags[ep.completedFlag]
                        ? "rgba(180,140,100,0.45)"
                        : ep.id === nextEp.id
                          ? "rgba(255,255,255,0.4)"
                          : "rgba(255,255,255,0.07)",
                    }}
                  />
                ))}
              </div>

              <div style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.13)",
                letterSpacing: "0.15em",
                animation: "pulse 3s ease-in-out infinite",
              }}>
                아무 곳이나 클릭
              </div>
            </>
          ) : (
            <div style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.2)",
              letterSpacing: "0.1em",
            }}>
              외래가 끝났습니다.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
