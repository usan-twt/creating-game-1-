export default function RapportBar({ level }) {
  const max=5;
  const color=level>=3?"#78c878":level>=2?"#e2a84b":"#c8b0a0";
  const label=level>=4?"깊은 신뢰":level>=3?"신뢰 형성":level>=2?"조금 열림":level>=1?"경계 중":"닫혀있음";
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontSize:9,letterSpacing:"0.2em",color:"rgba(255,255,255,0.35)"}}>라포</span>
        <span style={{fontSize:10,color,fontWeight:700}}>{label}</span>
      </div>
      <div style={{display:"flex",gap:2}}>
        {Array.from({length:max}).map((_,i)=>(
          <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<level?color:"rgba(255,255,255,0.1)",transition:"background 0.4s ease"}}/>
        ))}
      </div>
    </div>
  );
}
