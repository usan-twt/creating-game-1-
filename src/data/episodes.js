import {
  EP1_PROMPT, EP2_PROMPT, EP3_PROMPT, getEP4Prompt,
  EP5_PROMPT, EP6_PROMPT, EP7A_PROMPT, EP7B_PROMPT,
  getEP8Prompt, EP9_PROMPT, EP10_COLLEAGUE_PROMPT, EP10_PROFESSOR_PROMPT,
} from "./prompts";

export const EPISODE_LIST = [
  {
    id:"EP1", titleNum:"EP.01", name:"박진수", age:54, sex:"남",
    cc:"가슴이 좀 아파서요.",
    subtitle:"월요일 오전 8시",
    teaser:"54세 남성. 흉통. 혼자 왔다.",
    skin:"#c49070", shirt:"#4a5c3e", hairColor:"#14100e", hairType:"m_mid",
    vitals:{ BP:"138/88", HR:"94", SpO2:"97%" },
    initialEmotion:"anxious", initialPhoneCheck:true, minTurns:5,
    notebookPre:`박진수 / 54세 남성 / 첫 외래\n──────────────────\n주소: 흉통 (어제부터)\n\n→  언제부터, 어떤 느낌인지\n→  팔·어깨로 퍼지진 않는지\n→  이전에도 있었는지?\n\n혼자 내원 (보호자 없음)`,
    getSystemPrompt:()=>EP1_PROMPT,
    getResultLines:(_,lf)=>lf.jinsu_opened
      ?{lines:["오늘","박진수 씨는 병원에 왔다."," ","흉통 때문이라고 했다.","그건 사실이었다."," ","하지만 당신이 잠깐 기다렸을 때,","그가 말했다."," ","\u201c집에 가기 싫어서요.\u201d"," ","당신은 그 말을 들었다."],footer:"그는 다음 달에 다시 올 수 있습니다."}
      :{lines:["오늘","박진수 씨는 병원에 왔다."," ","흉통이 주소였다.","진료가 끝났다."," ","그가 왜 혼자 왔는지는","묻지 않았다."],footer:"그는 다음 달에 다시 올 수 있습니다."},
    completedFlag:"EP1_completed", localFlags:["jinsu_opened"], mechanics:{},
  },
  {
    id:"EP2", titleNum:"EP.02", name:"왕메이링", age:63, sex:"여",
    cc:"배가 좀 아파서요.",
    subtitle:"화요일 오전 11시",
    teaser:"63세 여성. 복통. 딸이 동석했다.",
    skin:"#d4c0a0", shirt:"#7a5a6a", hairColor:"#c0c0c0", hairType:"f_old",
    vitals:{ BP:"128/82", HR:"76", SpO2:"96%" },
    initialEmotion:"anxious", initialPhoneCheck:false, minTurns:5,
    notebookPre:`왕메이링 / 63세 여성 / 첫 외래\n──────────────────\n주소: 복통 (오른쪽 아랫배)\n통역: 딸 이수진 동석\n\n→  언제부터, 어떤 성격\n→  소화기 증상 동반?\n→  이전 병력 확인\n\n※ 통역이 정확한지 주의`,
    getSystemPrompt:()=>EP2_PROMPT,
    getResultLines:(_,lf)=>{
      if(lf.reversal2)return{lines:["오늘","왕메이링 씨는 혼자가 아니었습니다."," ","딸이 있었습니다.","하지만 그들이 숨기려 한 것을","당신은 볼 수 있었습니다."," ","어머니가 말했습니다."," ","\u201c저... 알아요. 이미.\u201d"," ","이미, 오래전부터."],footer:"이수진이 그날 처음 울었는지도 모릅니다."};
      if(lf.reversal1)return{lines:["오늘","통역이 있었습니다."," ","그리고 그 틈에서","당신은 무언가를 감지했습니다."," ","어머니는 직접 말했습니다.","조금씩, 서툰 한국어로."],footer:"다음에 이수진이 혼자 올 수도 있습니다."};
      return{lines:["오늘","왕메이링 씨의 딸이 통역했습니다."," ","모든 것이 명확해 보였습니다.","오른쪽 아랫배 통증, 1주일째."," ","그게 전부였습니다."],footer:"다음에 이수진이 혼자 올 수도 있습니다."};
    },
    completedFlag:"EP2_completed", localFlags:["daughter_suspicious","reversal1","reversal2"],
    mechanics:{ translator:true },
  },
  {
    id:"EP3", titleNum:"EP.03", name:"김지영", age:34, sex:"여",
    cc:"두통이 계속되고 좀 피곤해서요.",
    subtitle:"수요일 오후 2시",
    teaser:"34세 여성. 두통·피로. 좋은 환자처럼 보인다.",
    skin:"#e8c8a0", shirt:"#6a8090", hairColor:"#1a1010", hairType:"f_young",
    vitals:{ BP:"118/76", HR:"88", SpO2:"99%" },
    initialEmotion:"neutral", initialPhoneCheck:false, minTurns:5,
    notebookPre:`김지영 / 34세 여성 / 첫 외래\n──────────────────\n주소: 두통 + 피로 (2주째)\n\n→  두통 성격·위치·빈도\n→  수면 상태\n→  스트레스 요인?\n\n※ 바이탈 정상\n※ 답이 너무 깔끔할 수 있음`,
    getSystemPrompt:()=>EP3_PROMPT,
    getResultLines:(_,lf)=>lf.real_opened
      ?{lines:["김지영 씨는 오늘","완벽한 환자였습니다."," ","당신이 물어보지 않은 것들에 대해서는."," ","하지만 당신이 잠깐 멈추었을 때,","그가 말했습니다."," ","\u201c아... 사실은요.\u201d"," ","그 말이 얼마나 오래된 것인지."],footer:"김지영 씨는 다음 주에 다시 올 것 같습니다."}
      :{lines:["김지영 씨는 오늘","완벽한 환자였습니다."," ","두통과 피로.","진단이 끝났습니다."," ","그가 말하지 않은 것은","묻지 않았기 때문입니다."],footer:"김지영 씨는 다음 주에 다시 올 것 같습니다."},
    completedFlag:"EP3_completed", localFlags:["real_opened"], mechanics:{},
  },
  {
    id:"EP4", titleNum:"EP.04", name:"박진수", age:54, sex:"남",
    cc:"검사 결과 확인하러 왔어요.",
    subtitle:"3주 후 월요일",
    teaser:"박진수가 돌아왔다.",
    skin:"#c49070", shirt:"#3a4a30", hairColor:"#14100e", hairType:"m_mid",
    vitals:{ BP:"134/86", HR:"88", SpO2:"98%" },
    initialEmotion:"neutral", initialPhoneCheck:false, minTurns:4,
    getNotebookPre:(sf)=>sf.EP1_jinsu_opened
      ?`박진수 / 54세 남성 / 재진\n──────────────────\n검사 결과 확인\n\n→ 지난번에 "집에 가기 싫어서요"\n→ BP 경계선 — 생활습관 교정\n→ 지금은 어떻게 지내시는지...`
      :`박진수 / 54세 남성 / 재진\n──────────────────\n검사 결과 확인\n\n→ BP 경계선 — 생활습관 교정\n→ 흡연 반 갑 / 고혈압 전단계`,
    getSystemPrompt:(sf)=>getEP4Prompt(sf),
    getResultLines:(sf,lf)=>{
      if(sf.EP1_jinsu_opened&&lf.deeper_connection)return{lines:["박진수 씨가 다시 왔습니다."," ","이번에는 처음부터 달랐습니다."," ","아마 그도 알고 있었을 것입니다,","당신이 그 말을 기억한다는 것을."," ","\u201c나아지고 있어요. 조금씩.\u201d"],footer:""};
      if(sf.EP1_jinsu_opened)return{lines:["박진수 씨가 다시 왔습니다."," ","검사 결과는 정상이었습니다."," ","지난번의 말은","오늘은 나오지 않았습니다."],footer:""};
      return{lines:["박진수 씨가","검사 결과를 확인했습니다."," ","이상 없음.","다음에 또 오세요."],footer:""};
    },
    completedFlag:"EP4_completed", localFlags:["deeper_connection"], mechanics:{},
  },
  {
    id:"EP5", titleNum:"EP.05", name:"이준혁", age:23, sex:"남",
    cc:"갑자기 숨이 안 쉬어졌어요.",
    subtitle:"목요일 오후 3시",
    teaser:"23세 남성. 과호흡. 응급실에서 왔다.",
    skin:"#d8c0a8", shirt:"#3a5878", hairColor:"#1a1010", hairType:"m_young",
    vitals:{ BP:"128/82", HR:"118", SpO2:"97%" },
    initialEmotion:"distressed", initialPhoneCheck:false, minTurns:5,
    notebookPre:`이준혁 / 23세 남성 / 응급 경유\n──────────────────\n주소: 과호흡 발작\n응급실 경유 — 대부분 진정\n\n→  유발 요인\n→  손발 저림?\n→  이전에도?\n\n※ HR 118 — 아직 빠름\n※ 혼자 왔음`,
    getSystemPrompt:()=>EP5_PROMPT,
    getResultLines:(_,lf)=>lf.real_opened
      ?{lines:["이준혁 씨는","숨을 고르고 있었습니다."," ","당신이 물었을 때,","그는 말했습니다."," ","\u201c집에서 나왔거요.\u201d"," ","당신이 해줄 수 있는","의학적인 것은 없었습니다."," ","하지만 당신은 들었습니다."],footer:"의사가 할 수 있는 것과 할 수 없는 것."}
      :{lines:["과호흡은 나아졌습니다."," ","호흡 기법을 안내했습니다.","이준혁 씨는","\"감사합니다\"라고 말했습니다."," ","왜 그랬는지는","묻지 않았습니다."],footer:"의사가 할 수 있는 것과 할 수 없는 것."},
    completedFlag:"EP5_completed", localFlags:["real_opened"], mechanics:{ breathing:true },
  },
  {
    id:"EP6", titleNum:"EP.06", name:"최병철", age:71, sex:"남",
    cc:"그냥 얼굴 보여드리러 왔어요.",
    subtitle:"금요일 오전 10시",
    teaser:"71세 남성. 말기 COPD. 진짜 물음을 가지고 왔다.",
    skin:"#b89070", shirt:"#3a3a3a", hairColor:"#888888", hairType:"m_elder",
    vitals:{ BP:"126/78", HR:"82", SpO2:"91%" },
    initialEmotion:"resigned", initialPhoneCheck:false, minTurns:4,
    notebookPre:`최병철 / 71세 남성 / 외래\n──────────────────\nCOPD GOLD 4기 — 말기\nFEV1 28% / SpO2 91%\n\n→  증상 변화 확인\n→  호흡 보조기 사용 여부\n→  통증·일상생활\n\n※ 가족 관계 파악할 것\n※ 오늘 뭔가 물어보려는 것 같음`,
    getSystemPrompt:()=>EP6_PROMPT,
    getResultLines:(_,lf)=>{
      if(lf.gave_comfort)return{lines:["최병철 씨는 물었습니다."," ","\u201c얼마나 살 수 있어요?\u201d"," ","당신은 숫자를 말하지 않았습니다."," ","대신 말했습니다,","남은 시간을 어떻게 쓸 것인지."," ","그는 잠시 생각했습니다.","그리고 고개를 끄덕였습니다."],footer:""};
      if(lf.answered_directly)return{lines:["최병철 씨는 물었습니다."," ","\u201c얼마나 살 수 있어요?\u201d"," ","당신은 직접 답했습니다."," ","그는 오랫동안 아무 말 하지 않았습니다.","창밖을 바라봤습니다."," ","\"감사합니다\"라고 했습니다."],footer:""};
      if(lf.deflected)return{lines:["최병철 씨는 물었습니다."," ","\u201c얼마나 살 수 있어요?\u201d"," ","당신은","더 검사해봐야 한다고 했습니다."," ","그는 천천히 고개를 끄덕였습니다.","그 말이 무슨 뜻인지 알고 있었습니다."],footer:""};
      return{lines:["최병철 씨는","그 질문을 꺼내지 않았습니다."," ","아니면","꺼낼 기회가 없었습니다."," ","그는 조용히 일어났습니다."],footer:""};
    },
    completedFlag:"EP6_completed", localFlags:["asked_the_question","answered_directly","gave_comfort","deflected"], mechanics:{},
  },
  {
    id:"EP7", titleNum:"EP.07", name:"두 환자", age:0, sex:"",
    cc:"",
    subtitle:"화요일 오후 5시 / 온콜 시작 전",
    teaser:"두 명이 기다리고 있다. 시간은 하나뿐이다.",
    skin:"", shirt:"", hairColor:"", hairType:"",
    vitals:{},
    initialEmotion:"neutral", initialPhoneCheck:false, minTurns:10,
    notebookPre:`온콜 전 외래\n──────────────────\n대기 환자 2명\n\n[A] 이혜란 / 78세 여성\n    고열 39.4도 / 보호자 없음\n    의식 약간 혼탁\n\n[B] 강도현 / 45세 남성\n    급성 요통 VAS 8점\n    빠른 처리 요구 중\n\n※ 총 가용 시간 한정`,
    getSystemPrompt:()=>"",
    getResultLines:(_,lf)=>{
      const aT = lf.turnsA || 0, bT = lf.turnsB || 0;
      if(aT >= bT*1.5) return{lines:["두 사람이 기다리고 있었습니다."," ","당신은 이혜란 씨에게","더 많은 시간을 쐈습니다."," ","강도현 씨는 대기실에서","계속 기다렸습니다."," ","이혜란 씨는 마지막에","손녀 이야기를 했습니다."],footer:""};
      if(bT >= aT*1.5) return{lines:["두 사람이 기다리고 있었습니다."," ","강도현 씨는 빠르게 처리됐습니다."," ","이혜란 씨에게는","충분한 시간이 없었습니다."," ","그녀가 뭔가를 더 말하려 했는지","확인하지 못했습니다."],footer:""};
      return{lines:["두 사람이 기다리고 있었습니다."," ","당신은 최대한 나눠서","시간을 썼습니다."," ","완벽하지 않았습니다.","하지만 그게 그날이었습니다."],footer:""};
    },
    completedFlag:"EP7_completed", localFlags:["turnsA","turnsB","rapportA","rapportB"], mechanics:{ dual:true },
    patientA:{ name:"이혜란", age:78, sex:"여", skin:"#c8a888", shirt:"#8a6070", hairColor:"#e0e0e0", hairType:"f_old", vitals:{ BP:"136/82", HR:"102", SpO2:"94%"}, initialEmotion:"anxious", cc:"저... 좀 열이 나요." },
    patientB:{ name:"강도현", age:45, sex:"남", skin:"#c09070", shirt:"#3a5030", hairColor:"#1a1010", hairType:"m_mid", vitals:{ BP:"142/88", HR:"96", SpO2:"98%"}, initialEmotion:"distressed", cc:"MRI 빨리 찍어줘요. 허리가 못 버티겠어요." },
  },
  {
    id:"EP8", titleNum:"EP.08", name:"이수진", age:35, sex:"여",
    cc:"잠을 좀 못 자고 있어서요.",
    subtitle:"어느 수요일",
    teaser:"이수진이 다시 왔다. 이번에는 혼자.",
    skin:"#e0c8a8", shirt:"#5a6878", hairColor:"#1a1010", hairType:"f_young",
    vitals:{ BP:"124/80", HR:"86", SpO2:"99%" },
    initialEmotion:"exhausted", initialPhoneCheck:false, minTurns:4,
    getNotebookPre:(sf)=>sf.EP2_reversal2
      ?`이수진 / 35세 여성\n──────────────────\n※ EP2 어머니(왕메이링)\n   "저... 알아요. 이미." 그날\n   이수진이 처음 운 날이었다\n\n→ 어머니는 6주 전 돌아가셨다\n→ 오늘 처음 다시 왔다\n→ 뭘 물어봐야 할까...`
      :sf.EP2_reversal1
      ?`이수진 / 35세 여성\n──────────────────\n※ EP2에서 어머니에게\n   직접 대화하게 해줬던 환자 딸\n\n→ 어머니 돌아가셨을 것 같음\n→ 잠 못 잠`
      :`이수진 / 35세 여성\n──────────────────\n주소: 불면, 피로\n\n→ 언제부터\n→ 스트레스 요인\n→ 가족·직장 상황`,
    getSystemPrompt:(sf)=>getEP8Prompt(sf),
    getResultLines:(sf,lf)=>{
      const knew = sf.EP2_reversal2;
      if(knew&&lf.grief_opened)return{lines:["이수진 씨는 들어오면서","잠깐 멈췄습니다."," ","\u201c...선생님이시죠.\u201d"," ","그녀는 어머니 이야기를 했습니다.","담담하게."," ","마지막에","작게 울었습니다."],footer:""};
      if(lf.grief_opened)return{lines:["이수진 씨는","잠을 못 잔다고 했습니다."," ","당신이 물었을 때,","그녀는 말했습니다."," ","\u201c어머니가 돌아가셨어요.\u201d"," ","담담하게. 짧게."],footer:""};
      return{lines:["이수진 씨는","잠을 못 잔다고 했습니다."," ","처방이 끝났습니다."," ","그녀가 왜 돌아왔는지","묻지 않았습니다."],footer:""};
    },
    completedFlag:"EP8_completed", localFlags:["grief_opened"], mechanics:{},
  },
  {
    id:"EP9", titleNum:"EP.09", name:"정민우", age:37, sex:"남",
    cc:"두통이랑 좀 피곤한데, 요즘 잠을 못 자서요.",
    subtitle:"목요일 오전 9시",
    teaser:"37세 남성. 비특이적 증상. 3개월째.",
    skin:"#c8a888", shirt:"#3a4858", hairColor:"#181818", hairType:"m_mid",
    vitals:{ BP:"132/84", HR:"90", SpO2:"99%" },
    initialEmotion:"exhausted", initialPhoneCheck:false, minTurns:5,
    notebookPre:`정민우 / 37세 남성 / 첫 외래\n──────────────────\n주소: 두통 + 불면 + 피로\n3개월 지속\n\n→  수면 패턴\n→  스트레스 요인\n→  3개월 전 생활 변화?\n\n※ 직업: △△제약 연구원\n※ 바이탈 정상 범위`,
    getSystemPrompt:()=>EP9_PROMPT,
    articleText:`[단서 파일]\n──────────────\n△△제약, 임상시험 데이터\n조작 의혹 — 내부 제보\n\n3개월 전 온라인 의학뉴스.\n3상 데이터 일부 수정 정황.\n식약처 조사 예정.\n──────────────\n* 환자 직장과 같은 회사`,
    getResultLines:(_,lf)=>{
      if(lf.real_opened)return{lines:["정민우 씨는","두통과 불면으로 왔습니다."," ","그리고 말했습니다."," ","\u201c제가 뭔가를 봤어요.\u201d"," ","당신은 처방할 수 없었습니다.","하지만 들었습니다."," ","그가 결정을 내릴 때","이 대화가 영향을 줄지도 모릅니다."],footer:""};
      if(lf.article_hint)return{lines:["정민우 씨는","두통과 불면으로 왔습니다."," ","직장에 복잡한 게 있다고 했습니다.","그게 전부였습니다."," ","진짜 이야기는","나오지 않았습니다."],footer:""};
      return{lines:["정민우 씨는","두통과 불면으로 왔습니다."," ","진통제와 수면 위생 교육.","진료가 끝났습니다."," ","3개월 전에 무슨 일이 있었는지","묻지 않았습니다."],footer:""};
    },
    completedFlag:"EP9_completed", localFlags:["article_hint","real_opened"], mechanics:{ article:true },
  },
  {
    id:"EP10", titleNum:"EP.10", name:"오늘의 마지막", age:0, sex:"",
    cc:"",
    subtitle:"금요일 저녁 / 1년차 마지막 주",
    teaser:"오늘은 환자가 없다.",
    skin:"", shirt:"", hairColor:"", hairType:"",
    vitals:{},
    initialEmotion:"neutral", initialPhoneCheck:false, minTurns:3,
    notebookPre:`1년차 마지막 주\n──────────────────\n오늘 외래는 끝났다.\n\n동료를 찾아갈까,\n교수님 연구실에 들를까,\n아니면 그냥 여기 앉아있을까.\n\n잘 모르겠다.`,
    getSystemPrompt:()=>"",
    getResultLines:(sf,lf)=>{
      const ep1ok = sf.EP1_jinsu_opened||sf.EP4_deeper_connection;
      const ep2ok = sf.EP2_reversal2||sf.EP2_reversal1;
      const ep3ok = sf.EP3_real_opened;
      const ep5ok = sf.EP5_real_opened;
      const ep8ok = sf.EP8_grief_opened;
      const depth = [ep1ok,ep2ok,ep3ok,ep5ok,ep8ok].filter(Boolean).length;
      if(depth>=3)return{lines:["1년이 지났습니다."," ","당신은 많은 것을 들었습니다.","말해지지 않은 것들을."," ","흉통 뒤의 부부,","통역 너머의 어머니,","완벽한 환자의 침묵."," ","그것이 무엇인지","아직 이름은 없습니다."," ","하지만 당신은","그것을 찾는 법을 배웠습니다."],footer:"레지던트 2년차가 됩니다."};
      if(depth>=1)return{lines:["1년이 지났습니다."," ","몇 번은","당신이 조금 더 오래 앉아있었습니다."," ","그게 달라졌습니다."," ","조금."],footer:"레지던트 2년차가 됩니다."};
      return{lines:["1년이 지났습니다."," ","많은 환자들이 왔다 갔습니다."," ","진단이 끝났고","처방이 나갔습니다."," ","당신은 잘 했습니다."],footer:"레지던트 2년차가 됩니다."};
    },
    completedFlag:"EP10_completed", localFlags:["went_deep","mentor_moment","alone_reflection"], mechanics:{ noPatient:true },
  },
];

export { EP7A_PROMPT, EP7B_PROMPT, EP10_COLLEAGUE_PROMPT, EP10_PROFESSOR_PROMPT };
