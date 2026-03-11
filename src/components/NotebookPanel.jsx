import { useState } from "react";

function HintSection({ hints, usedIntents, unlocked }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [showQuestions, setShowQuestions] = useState({});

  if (!hints || !hints.length || !unlocked) return null;

  return (
    <div style={{marginBottom:18}}>
      <div style={{fontFamily:"Georgia,serif",fontSize:9,letterSpacing:"0.25em",color:"#7a6a3a",marginBottom:10}}>진료 가이드</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {hints.map((h,i)=>{
          const used = !!(usedIntents && usedIntents[h.intent]);
          const isExpanded = expandedIdx===i;
          const questionsVisible = showQuestions[i];
          return (
            <div key={i} style={{background:used?"rgba(120,160,100,0.08)":"rgba(180,150,60,0.1)",border:`1px solid ${used?"rgba(120,160,100,0.2)":"rgba(180,150,60,0.25)"}`,borderRadius:7,overflow:"hidden"}}>
              <button onClick={()=>setExpandedIdx(isExpanded?null:i)}
                style={{width:"100%",background:"none",border:"none",cursor:"pointer",padding:"8px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",textAlign:"left"}}>
                <span style={{fontFamily:"Georgia,serif",fontSize:11,color:used?"#5a7a50":"#6a5a2a",fontWeight:600}}>
                  {isExpanded?"▾":"▸"} {h.category}
                </span>
                {!used&&<span style={{fontSize:9,color:"rgba(180,150,60,0.7)",fontStyle:"italic"}}>💡</span>}
                {used&&<span style={{fontSize:9,color:"rgba(120,160,100,0.6)"}}>✓</span>}
              </button>
              {isExpanded&&(
                <div style={{padding:"0 10px 10px"}}>
                  <div style={{fontFamily:"Georgia,serif",fontSize:10,lineHeight:1.9,color:"#4a3a1a",fontStyle:"italic",marginBottom:questionsVisible?8:0}}>{h.guide}</div>
                  {!questionsVisible&&h.questions&&(
                    <button onClick={()=>setShowQuestions(p=>({...p,[i]:true}))}
                      style={{background:"none",border:"none",cursor:"pointer",fontSize:9,color:"rgba(120,100,50,0.6)",fontFamily:"Georgia,serif",padding:"4px 0",textDecoration:"underline",textDecorationStyle:"dotted"}}>
                      예시 질문 보기
                    </button>
                  )}
                  {questionsVisible&&h.questions&&(
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      {h.questions.map((q,qi)=>(
                        <div key={qi} style={{fontFamily:"Georgia,serif",fontSize:10,color:"#5a4a2a",padding:"3px 8px",background:"rgba(255,255,255,0.3)",borderRadius:4,lineHeight:1.7}}>
                          "{q}"
                        </div>
                      ))}
                      <div style={{fontSize:8,color:"rgba(120,100,50,0.45)",fontStyle:"italic",marginTop:2}}>참고만 하세요 — 직접 표현해보세요</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function NotebookPanel({ isOpen, onClose, epNum, preNotes, userNotes, onUserNotesChange, articleText, articleVisible, hints, usedIntents, hintsUnlocked }) {
  return (
    <>
      {isOpen&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:49}}/>}
      <div style={{position:"fixed",top:0,right:0,height:"100%",width:252,background:"#f3eedd",borderLeft:"1px solid #c0b474",transform:isOpen?"translateX(0)":"translateX(100%)",transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)",zIndex:50,display:"flex",flexDirection:"column",boxShadow:isOpen?"-10px 0 40px rgba(0,0,0,0.3)":"none"}}>
        <div style={{padding:"16px 18px 12px",borderBottom:"1px solid #c0b474",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontFamily:"Georgia,serif",fontSize:9,letterSpacing:"0.3em",color:"#7a6a3a",marginBottom:4}}>전공의 수첩</div>
            <div style={{fontFamily:"Georgia,serif",fontSize:13,color:"#3a2a10",fontWeight:"bold"}}>{epNum}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#9a8a5a",fontSize:16,padding:0}}>✕</button>
        </div>
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>
          <div style={{width:24,background:"#f3eedd",borderRight:"2px solid #df8070",flexShrink:0}}/>
          <div style={{flex:1,overflowY:"auto",padding:"16px 18px 16px 12px"}}>
            <pre style={{fontFamily:"Georgia,serif",fontSize:11,lineHeight:"2.2",color:"#1a3a6a",whiteSpace:"pre-wrap",margin:"0 0 20px 0"}}>{preNotes}</pre>
            {articleVisible&&articleText&&(
              <div style={{marginBottom:18,padding:"10px 12px",background:"rgba(200,60,40,0.07)",border:"1px solid rgba(200,60,40,0.2)",borderRadius:6}}>
                <pre style={{fontFamily:"Georgia,serif",fontSize:10,lineHeight:"2",color:"#5a2a1a",whiteSpace:"pre-wrap",margin:0}}>{articleText}</pre>
              </div>
            )}
            <HintSection hints={hints} usedIntents={usedIntents} unlocked={hintsUnlocked}/>
            <div style={{borderTop:"1px dashed #b8a450",marginBottom:14}}/>
            <div style={{fontFamily:"Georgia,serif",fontSize:9,letterSpacing:"0.25em",color:"#7a6a3a",marginBottom:8}}>내 메모</div>
            <textarea value={userNotes} onChange={e=>onUserNotesChange(e.target.value)} placeholder="관찰한 것을 적어두세요..." style={{width:"100%",minHeight:120,background:"transparent",border:"none",outline:"none",fontFamily:"Georgia,serif",fontSize:11,lineHeight:"2.2",color:"#2a1a08",resize:"none",boxSizing:"border-box"}}/>
          </div>
        </div>
      </div>
    </>
  );
}
