import { useState, useEffect } from "react";
import { EPISODE_LIST } from "../data/episodes";

/* ── Thematic epigraphs by progress ── */
const EPIGRAPHS = [
  // Day 1 — first patient ever
  {
    line: "환자는 아픈 곳을 말하러 온다.\n하지만 가끔, 말하지 못한 것이 더 아프다.",
    sub: "첫 번째 외래가 시작됩니다.",
  },
  // Day 2
  {
    line: "듣는다는 건 시간이 드는 일이다.\n그리고 시간은, 이곳에서 가장 부족한 것이다.",
    sub: null,
  },
  // Day 3
  {
    line: "어떤 말은 한 번 꺼내면 주워 담을 수 없다.\n그래서 사람들은 두통이라고 말한다.",
    sub: null,
  },
  // Day 4
  {
    line: "다시 만난다는 건\n지난번에 못 다 한 이야기가 있다는 뜻이다.",
    sub: null,
  },
  // Day 5
  {
    line: "숨이 멎을 것 같다고 말하는 사람에게\n괜찮다고 말하는 것은 쉽다.\n진짜 괜찮냐고 묻는 것은 어렵다.",
    sub: null,
  },
  // Day 6
  {
    line: "솔직하게 말해달라는 환자 앞에서\n의사도 처음으로 말문이 막힌다.",
    sub: null,
  },
  // Day 7
  {
    line: "두 사람이 동시에 아플 때,\n당신은 누구의 말을 먼저 들을 것인가.",
    sub: null,
  },
  // Day 8
  {
    line: "슬픔은 병이 아니다.\n하지만 슬픈 사람도 병원에 온다.",
    sub: null,
  },
  // Day 9
  {
    line: "어떤 환자는 비밀을 가지고 들어온다.\n의사가 할 수 있는 건 — 그 무게를 잠시 나눠 드는 것이다.",
    sub: null,
  },
  // Day 10
  {
    line: "1년이 지났다.\n당신은 얼마나 들었는가.",
    sub: null,
  },
];

export default function EpisodeHub({ storyFlags, onPlay }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), 80); return () => clearTimeout(t); }, []);

  // Find next uncompleted episode
  const nextEp = EPISODE_LIST.find(ep => !storyFlags[ep.completedFlag]);
  const allDone = !nextEp;
  const progress = EPISODE_LIST.filter(ep => storyFlags[ep.completedFlag]).length;
  const epigraph = EPIGRAPHS[allDone ? 9 : progress];

  const handleClick = () => {
    if (nextEp) onPlay(nextEp.id);
  };

  return (
    <div
      onClick={allDone ? undefined : handleClick}
      style={{
        minHeight: "100vh",
        background: "#0e0c0a",
        fontFamily: "Georgia, serif",
        opacity: vis ? 1 : 0,
        transition: "opacity 1.4s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: allDone ? "default" : "pointer",
        userSelect: "none",
        padding: "0 32px",
      }}
    >
      {/* Title block */}
      <div style={{
        opacity: vis ? 1 : 0,
        transition: "opacity 1.8s ease 0.2s",
        textAlign: "center",
        marginBottom: 56,
      }}>
        <div style={{
          fontSize: 10,
          letterSpacing: "0.7em",
          color: "#3a2e24",
          marginBottom: 18,
        }}>
          INTERN
        </div>
        <div style={{
          width: 32,
          height: 1,
          background: "#3a2e24",
          margin: "0 auto",
        }} />
      </div>

      {/* Epigraph — the heart of the screen */}
      <div style={{
        opacity: vis ? 1 : 0,
        transition: "opacity 2s ease 0.8s",
        textAlign: "center",
        maxWidth: 360,
        marginBottom: 56,
      }}>
        <div style={{
          fontSize: 13,
          lineHeight: "2.2",
          color: "rgba(255,255,255,0.45)",
          letterSpacing: "0.04em",
          whiteSpace: "pre-line",
        }}>
          {epigraph.line}
        </div>
      </div>

      {/* Bottom section */}
      <div style={{
        opacity: vis ? 1 : 0,
        transition: "opacity 1.8s ease 1.6s",
        textAlign: "center",
      }}>
        {!allDone ? (
          <>
            {/* Day info */}
            <div style={{
              fontSize: 9,
              letterSpacing: "0.4em",
              color: "rgba(255,255,255,0.12)",
              marginBottom: 6,
            }}>
              DAY {nextEp.day}
            </div>
            <div style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              marginBottom: 28,
            }}>
              {epigraph.sub || nextEp.subtitle}
            </div>

            {/* Progress dots */}
            <div style={{
              display: "flex",
              gap: 6,
              justifyContent: "center",
              marginBottom: 36,
            }}>
              {EPISODE_LIST.map((ep) => (
                <div
                  key={ep.id}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: storyFlags[ep.completedFlag]
                      ? "rgba(120,200,120,0.45)"
                      : ep.id === nextEp.id
                        ? "rgba(255,255,255,0.45)"
                        : "rgba(255,255,255,0.08)",
                    transition: "background 0.3s",
                  }}
                />
              ))}
            </div>

            <div style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.15)",
              letterSpacing: "0.15em",
              animation: "pulse 3s ease-in-out infinite",
            }}>
              화면을 클릭하세요
            </div>
          </>
        ) : (
          <div style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            lineHeight: "2",
            letterSpacing: "0.06em",
          }}>
            1년차가 끝났습니다.
          </div>
        )}
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
