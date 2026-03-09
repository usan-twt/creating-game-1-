export default function NotebookPanel({ isOpen, onClose, epNum, preNotes, userNotes, onUserNotesChange, articleText, articleVisible }) {
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
            <div style={{borderTop:"1px dashed #b8a450",marginBottom:14}}/>
            <div style={{fontFamily:"Georgia,serif",fontSize:9,letterSpacing:"0.25em",color:"#7a6a3a",marginBottom:8}}>내 메모</div>
            <textarea value={userNotes} onChange={e=>onUserNotesChange(e.target.value)} placeholder="관찰한 것을 적어두세요..." style={{width:"100%",minHeight:120,background:"transparent",border:"none",outline:"none",fontFamily:"Georgia,serif",fontSize:11,lineHeight:"2.2",color:"#2a1a08",resize:"none",boxSizing:"border-box"}}/>
          </div>
        </div>
      </div>
    </>
  );
}
