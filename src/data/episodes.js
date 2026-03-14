import {
  EP1_PROMPT, EP2_PROMPT, EP3_PROMPT, getEP4Prompt,
  EP5_PROMPT, EP6_PROMPT, EP7A_PROMPT, EP7B_PROMPT,
  getEP8Prompt, EP9_PROMPT, EP10_COLLEAGUE_PROMPT, EP10_PROFESSOR_PROMPT,
} from "./prompts";

import { loadScript } from "../utils/scriptLoader";

function injectFatigue(prompt, rs) {
  if (!rs || rs.fatigue < 3) return prompt;
  if (rs.fatigue >= 4)
    return prompt + `\n[의사 외관] 의사가 많이 지쳐 보입니다. 자연스러운 맥락에서 환자가 "선생님, 좀 쉬셔야 하는 거 아니에요?" 같은 말을 한 번 할 수 있습니다. 과하게 언급하지 마세요.`;
  return prompt + `\n[의사 외관] 의사가 조금 피곤해 보입니다. 자연스러운 맥락에서 한 번 정도 가볍게 언급할 수 있지만 필수는 아닙니다.`;
}

export const EPISODE_LIST = [
  {
    id:"EP1", day:1, titleNum:"EP.01", name:"박진수", age:54, sex:"남",
    cc:"가슴이 좀 아파서요.",
    subtitle:"월요일 오전 8시",
    teaser:"54세 남성. 흉통. 혼자 왔다.",
    skin:"#c49070", shirt:"#4a5c3e", hairColor:"#14100e", hairType:"m_mid",
    vitals:{ BP:"138/88", HR:"94", SpO2:"97%" },
    initialEmotion:"anxious", initialPhoneCheck:true, minTurns:5,
    notebookPre:`박진수 / 54세 남성 / 첫 외래\n──────────────────\n주소: 흉통 (어제부터)\n\n→  언제부터, 어떤 느낌인지\n→  팔·어깨로 퍼지진 않는지\n→  이전에도 있었는지?\n\n혼자 내원 (보호자 없음)`,
    getSystemPrompt:()=>EP1_PROMPT,
    getScriptData:()=>loadScript("ep1.json"),
    getResultLines:(_,lf)=>lf.jinsu_opened
      ?{lines:["오늘","박진수 씨는 병원에 왔다."," ","흉통 때문이라고 했다.","그건 사실이었다."," ","하지만 당신이 잠깐 기다렸을 때,","그가 말했다."," ","\u201c집에 가기 싫어서요.\u201d"," ","당신은 그 말을 들었다."],footer:"그는 다음 달에 다시 올 수 있습니다."}
      :{lines:["오늘","박진수 씨는 병원에 왔다."," ","흉통이 주소였다.","진료가 끝났다."," ","그가 왜 혼자 왔는지는","묻지 않았다."],footer:"그는 다음 달에 다시 올 수 있습니다."},
    hints:[
      { intent:"symptom", category:"증상 파악", guide:"흉통이 어떤 느낌인지, 언제 시작됐는지 물어보세요.", questions:["어디가 아프세요?","언제부터 그러셨어요?","팔이나 어깨 쪽으로 퍼지진 않나요?"] },
      { intent:"empathy", category:"공감하기", guide:"혼자 왔다는 점, 불안해 보이는 점에 주목해보세요.", questions:["많이 걱정되시죠.","혼자 오셨네요.","힘드셨겠어요."] },
      { intent:"personal", category:"개인 상황", guide:"왜 혼자 왔는지, 생활이 어떤지 물어보면 다른 이야기가 나올 수 있습니다.", questions:["집에서는 어떠세요?","요즘 좀 어떠세요?"] },
    ],
    hintUnlockTurn:3,
    glossaryEntries:[
      { key:"hr_mild", symbol:"HR 90–100대", source:"박진수 · EP1", reading:"가볍게 빠른 맥박", meaning:"안정 시 정상은 60–90bpm.\n통증이나 긴장 상태에서 나타난다." },
      { key:"bp_borderline", symbol:"BP 130–139/80–89", source:"박진수 · EP1", reading:"고혈압 전단계", meaning:"당장 약을 쓸 단계는 아니다.\n그러나 생활습관이 바뀌지 않으면 고혈압으로 진행된다." },
      { key:"alone_visit", symbol:"보호자 없음", source:"박진수 · EP1", reading:"혼자 온 환자", meaning:"혼자 왔다는 것이 때로는 단서가 된다.\n주변 상황이 어떤지 물어볼 이유가 생긴다." },
    ],
    discoveries:{
      jinsu_opened:{ title:"진짜 이유", text:"박진수 씨는 작년에 퇴직하고 혼자 지내고 있다. 흉통은 실제지만, 아침마다 갈 곳이 없다는 것도 병원에 온 이유였다.", color:"#6a8faa" },
    },
    getDayEndNarrative:(lf)=>lf.jinsu_opened
      ?["그가 왜 병원에 왔는지 알게 되었습니다."]
      :["그가 왜 왔는지는 끝내 묻지 않았습니다."],
    completedFlag:"EP1_completed", localFlags:["jinsu_opened"], deepFlags:[], mechanics:{},
  },
  {
    id:"EP2", day:2, titleNum:"EP.02", name:"왕메이링", age:78, sex:"여",
    cc:"배가 좀 아파서요.",
    subtitle:"화요일 오전 11시",
    teaser:"78세 여성. 복통. 딸이 통역으로 동석했다.",
    skin:"#d4c0a0", shirt:"#7a5a6a", hairColor:"#c0c0c0", hairType:"f_old",
    vitals:{ BP:"128/82", HR:"76", SpO2:"96%" },
    initialEmotion:"anxious", initialPhoneCheck:false, minTurns:5,
    notebookPre:`왕메이링 / 63세 여성 / 첫 외래\n──────────────────\n주소: 복통 (오른쪽 아랫배)\n통역: 딸 이수진 동석\n\n→  언제부터, 어떤 성격\n→  소화기 증상 동반?\n→  이전 병력 확인\n\n※ 통역이 정확한지 주의`,
    getSystemPrompt:()=>EP2_PROMPT,
    getScriptData:()=>loadScript("ep2.json"),
    getResultLines:(_,lf)=>{
      if(lf.reversal2)return{lines:["오늘","왕메이링 씨는 혼자가 아니었습니다."," ","딸이 있었습니다.","하지만 그들이 숨기려 한 것을","당신은 볼 수 있었습니다."," ","어머니가 말했습니다."," ","\u201c저... 알아요. 이미.\u201d"," ","이미, 오래전부터."],footer:"이수진이 그날 처음 울었는지도 모릅니다."};
      if(lf.reversal1)return{lines:["오늘","통역이 있었습니다."," ","그리고 그 틈에서","당신은 무언가를 감지했습니다."," ","어머니는 직접 말했습니다.","조금씩, 서툰 한국어로."],footer:"다음에 이수진이 혼자 올 수도 있습니다."};
      return{lines:["오늘","왕메이링 씨의 딸이 통역했습니다."," ","모든 것이 명확해 보였습니다.","오른쪽 아랫배 통증, 1주일째."," ","그게 전부였습니다."],footer:"다음에 이수진이 혼자 올 수도 있습니다."};
    },
    hints:[
      { intent:"symptom", category:"증상 파악", guide:"복통의 위치와 시작 시점을 확인하세요.", questions:["언제부터 아프셨어요?","어느 쪽이 아프세요?","식사랑 관련이 있나요?"] },
      { intent:"empathy", category:"공감하기", guide:"딸과 어머니 사이의 분위기를 살펴보세요.", questions:["어머니, 많이 불편하시죠.","걱정이 많으시겠어요."] },
      { intent:"personal", category:"생활 상황", guide:"통역 너머의 이야기 — 어머니의 실제 상황이 궁금하다면 물어보세요.", questions:["집에서는 어떠세요?","한국에 오신 지 얼마나 되셨어요?"] },
    ],
    hintUnlockTurn:3,
    glossaryEntries:[
      { key:"translator_present", symbol:"통역 동석", source:"왕메이링 · EP2", reading:"제3자가 있는 진료", meaning:"환자가 직접 말하지 않는다.\n통역자가 무엇을 바꾸는지, 무엇을 빼는지 살펴볼 필요가 있다." },
      { key:"rif_pain", symbol:"우하복부 통증", source:"왕메이링 · EP2", reading:"오른쪽 아랫배 통증", meaning:"맹장(충수)이 있는 위치.\n갑작스럽고 지속적이면 응급일 수 있다." },
    ],
    discoveries:{
      reversal1:{ title:"균열", text:"왕메이링 씨가 통역 없이 직접 말하기 시작했습니다. 딸 이수진의 시선이 달라졌습니다.", color:"#9a8faa" },
      reversal2:{ title:"이미 알고 있었다", text:"왕메이링 씨는 3개월 전 대장암 3기 진단을 받았다. 딸이 자기 삶을 포기할까봐 혼자 감당해왔다.", color:"#b08878" },
    },
    getDayEndNarrative:(lf)=>{
      if(lf.reversal2) return["어머니가 이미 알고 있었다는 것을 들었습니다."];
      if(lf.reversal1) return["통역 너머의 어머니에게 직접 닿았습니다."];
      return["통역을 통해서만 대화했습니다."];
    },
    completedFlag:"EP2_completed", localFlags:["daughter_suspicious","reversal1","reversal2"], deepFlags:[],
    mechanics:{ translator:true },
  },
  {
    id:"EP3", day:3, titleNum:"EP.03", name:"김지영", age:34, sex:"여",
    cc:"두통이 계속되고 좀 피곤해서요.",
    subtitle:"수요일 오후 2시",
    teaser:"34세 여성. 두통·피로. 좋은 환자처럼 보인다.",
    skin:"#e8c8a0", shirt:"#6a8090", hairColor:"#1a1010", hairType:"f_young",
    vitals:{ BP:"118/76", HR:"88", SpO2:"99%" },
    initialEmotion:"neutral", initialPhoneCheck:false, minTurns:5,
    notebookPre:`김지영 / 34세 여성 / 첫 외래\n──────────────────\n주소: 두통 + 피로 (2주째)\n\n→  두통 성격·위치·빈도\n→  수면 상태\n→  스트레스 요인?\n\n※ 바이탈 정상\n※ 답이 너무 깔끔할 수 있음`,
    getSystemPrompt:()=>EP3_PROMPT,
    getScriptData:()=>loadScript("ep3.json"),
    getResultLines:(_,lf)=>lf.real_opened
      ?{lines:["김지영 씨는 오늘","완벽한 환자였습니다."," ","당신이 물어보지 않은 것들에 대해서는."," ","하지만 당신이 잠깐 멈추었을 때,","그가 말했습니다."," ","\u201c아... 사실은요.\u201d"," ","그 말이 얼마나 오래된 것인지."],footer:"김지영 씨는 다음 주에 다시 올 것 같습니다."}
      :{lines:["김지영 씨는 오늘","완벽한 환자였습니다."," ","두통과 피로.","진단이 끝났습니다."," ","그가 말하지 않은 것은","묻지 않았기 때문입니다."],footer:"김지영 씨는 다음 주에 다시 올 것 같습니다."},
    hints:[
      { intent:"symptom", category:"증상 파악", guide:"두통의 패턴과 수면 상태를 확인하세요.", questions:["머리가 어떻게 아프세요?","잠은 잘 주무세요?","언제 더 심해져요?"] },
      { intent:"empathy", category:"공감하기", guide:"답이 너무 깔끔하다면, 잠깐 멈추고 기다려보세요.", questions:["힘드셨겠어요.","괜찮으세요, 정말?","천천히 말씀하셔도 돼요."] },
      { intent:"personal", category:"일상 이야기", guide:"\"좋은 환자\" 너머의 사람이 궁금하다면 물어보세요.", questions:["요즘 어떻게 지내세요?","집에서는 좀 쉬시나요?"] },
    ],
    hintUnlockTurn:3,
    glossaryEntries:[
      { key:"vitals_normal_caveat", symbol:"바이탈 정상", source:"김지영 · EP3", reading:"수치가 정상 = 이상 없음이 아니다", meaning:"혈압·맥박·산소포화도가 정상이어도\n환자는 아플 수 있다. 숫자 너머를 봐야 한다." },
      { key:"good_patient", symbol:"협조적인 환자", source:"김지영 · EP3", reading:"'좋은 환자'의 이면", meaning:"대답이 너무 깔끔하면 오히려 의심해볼 것.\n말해도 된다고 느껴야 사람은 진짜 이야기를 꺼낸다." },
    ],
    discoveries:{
      real_opened:{ title:"진짜 이야기", text:"김지영 씨는 6개월 전 임신 12주에 유산을 경험했다. 수술 다음날 출근했고, 슬퍼할 시간을 스스로에게 주지 않았다.", color:"#7a9a7a" },
    },
    getDayEndNarrative:(lf)=>lf.real_opened
      ?["\"완벽한 환자\" 너머의 이야기를 들었습니다."]
      :["그가 말하지 않은 것은 묻지 않았기 때문입니다."],
    completedFlag:"EP3_completed", localFlags:["real_opened"], deepFlags:[], mechanics:{},
  },
  {
    id:"EP4", day:4, titleNum:"EP.04", name:"박진수", age:54, sex:"남",
    cc:"검사 결과 확인하러 왔어요.",
    subtitle:"3주 후 월요일",
    teaser:"박진수가 돌아왔다.",
    skin:"#c49070", shirt:"#3a4a30", hairColor:"#14100e", hairType:"m_mid",
    vitals:{ BP:"134/86", HR:"88", SpO2:"98%" },
    initialEmotion:"neutral", initialPhoneCheck:false, minTurns:4,
    getNotebookPre:(sf)=>sf.EP1_jinsu_opened
      ?`박진수 / 54세 남성 / 재진\n──────────────────\n검사 결과 확인\n\n→ 지난번에 "집에 가기 싫어서요"\n→ BP 경계선 — 생활습관 교정\n→ 지금은 어떻게 지내시는지...`
      :`박진수 / 54세 남성 / 재진\n──────────────────\n검사 결과 확인\n\n→ BP 경계선 — 생활습관 교정\n→ 흡연 반 갑 / 고혈압 전단계`,
    getSystemPrompt:(sf,rs)=>injectFatigue(getEP4Prompt(sf),rs),
    getScriptData:(sf)=>loadScript(sf.EP1_jinsu_opened ? "ep4_opened.json" : "ep4_base.json"),
    dependsOn:{ flags:[{ flag:"EP1_jinsu_opened", affects:["script","notebook","prompt","result"] }] },
    getResultLines:(sf,lf)=>{
      if(sf.EP1_jinsu_opened&&lf.deeper_connection)return{lines:["박진수 씨가 다시 왔습니다."," ","이번에는 처음부터 달랐습니다."," ","아마 그도 알고 있었을 것입니다,","당신이 그 말을 기억한다는 것을."," ","\u201c나아지고 있어요. 조금씩.\u201d"],footer:""};
      if(sf.EP1_jinsu_opened)return{lines:["박진수 씨가 다시 왔습니다."," ","검사 결과는 정상이었습니다."," ","지난번의 말은","오늘은 나오지 않았습니다."],footer:""};
      return{lines:["박진수 씨가","검사 결과를 확인했습니다."," ","이상 없음.","다음에 또 오세요."],footer:""};
    },
    hints:[
      { intent:"symptom", category:"결과 확인", guide:"검사 결과를 설명하고 생활습관 교정을 안내하세요.", questions:["혈압이 좀 높게 나왔는데요.","담배는 얼마나 피우세요?"] },
      { intent:"empathy", category:"공감하기", guide:"재진 환자입니다. 지난번의 기억이 있다면 이어가보세요.", questions:["지난번 이후로 좀 어떠셨어요?","요즘은 좀 나아지셨나요?"] },
      { intent:"personal", category:"근황 묻기", guide:"검사 결과 너머에 그 사람의 생활이 있습니다.", questions:["요즘 어떻게 지내세요?","집에서는 좀 편하세요?"] },
    ],
    hintUnlockTurn:2,
    glossaryEntries:[
      { key:"revisit", symbol:"재진 (f/u)", source:"박진수 · EP4", reading:"다시 온 환자", meaning:"처음과 달리, 이미 관계가 있다.\n지난번에 무슨 말을 했는지 기억하는 것 자체가 치료가 된다." },
      { key:"lifestyle_mod", symbol:"생활습관 교정", source:"박진수 · EP4", reading:"약 대신 생활을 바꾸는 것", meaning:"금연, 운동, 식이 조절.\n의사가 처방할 수 있지만, 실제로 하는 건 환자다." },
    ],
    discoveries:{
      deeper_connection:{ title:"기억", text:"그는 3주 전 대화를 기억하고 있었습니다.", color:"#8a9a6a" },
    },
    getDayEndNarrative:(lf)=>lf.deeper_connection
      ?["그는 3주 전 대화를 기억하고 있었습니다."]
      :["검사 결과만 확인했습니다."],
    completedFlag:"EP4_completed", localFlags:["deeper_connection"], deepFlags:["deeper_connection"], mechanics:{},
  },
  {
    id:"EP5", day:5, titleNum:"EP.05", name:"이준혁", age:23, sex:"남",
    cc:"갑자기 숨이 안 쉬어졌어요.",
    subtitle:"목요일 오후 3시",
    teaser:"23세 남성. 과호흡. 응급실에서 왔다.",
    skin:"#d8c0a8", shirt:"#3a5878", hairColor:"#1a1010", hairType:"m_young",
    vitals:{ BP:"128/82", HR:"118", SpO2:"97%" },
    initialEmotion:"distressed", initialPhoneCheck:false, minTurns:5,
    notebookPre:`이준혁 / 23세 남성 / 응급 경유\n──────────────────\n주소: 과호흡 발작\n응급실 경유 — 대부분 진정\n\n→  유발 요인\n→  손발 저림?\n→  이전에도?\n\n※ HR 118 — 아직 빠름\n※ 혼자 왔음`,
    getSystemPrompt:(sf,rs)=>injectFatigue(EP5_PROMPT,rs),
    getScriptData:()=>loadScript("ep5.json"),
    getResultLines:(_,lf)=>lf.real_opened
      ?{lines:["이준혁 씨는","숨을 고르고 있었습니다."," ","당신이 물었을 때,","그는 말했습니다."," ","\u201c집에서 나왔거요.\u201d"," ","당신이 해줄 수 있는","의학적인 것은 없었습니다."," ","하지만 당신은 들었습니다."],footer:"의사가 할 수 있는 것과 할 수 없는 것."}
      :{lines:["과호흡은 나아졌습니다."," ","호흡 기법을 안내했습니다.","이준혁 씨는","\"감사합니다\"라고 말했습니다."," ","왜 그랬는지는","묻지 않았습니다."],footer:"의사가 할 수 있는 것과 할 수 없는 것."},
    hints:[
      { intent:"symptom", category:"증상 파악", guide:"과호흡의 유발 요인과 이전 경험을 확인하세요.", questions:["처음 이런 일이 있으셨나요?","숨이 안 쉬어지기 전에 무슨 일이 있었나요?"] },
      { intent:"empathy", category:"안정시키기", guide:"아직 불안한 상태입니다. 천천히, 안전하다는 걸 알려주세요.", questions:["지금은 좀 괜찮으세요?","놀라셨겠어요.","천천히 하셔도 돼요."] },
      { intent:"personal", category:"무슨 일이 있었는지", guide:"혼자 응급실에 왔습니다. 왜 그랬는지 물어보면 다른 이야기가 나올 수 있습니다.", questions:["요즘 많이 힘드신 건 아닌지...","집에서 무슨 일이 있으셨어요?"] },
    ],
    hintUnlockTurn:3,
    glossaryEntries:[
      { key:"hr_high", symbol:"HR 110–120대", source:"이준혁 · EP5", reading:"많이 빠른 맥박", meaning:"발작 직후, 극도의 불안, 또는 심한 통증.\nEP1의 HR 94보다 훨씬 높다 — 그만큼 상태가 심했다는 뜻." },
      { key:"hyperventilation", symbol:"과호흡 발작", source:"이준혁 · EP5", reading:"숨이 너무 빨라지는 것", meaning:"의학적 위기처럼 느껴지지만, 원인은 심리적일 수 있다.\n산소가 부족한 게 아니라 이산화탄소가 너무 빠져나간다." },
    ],
    discoveries:{
      real_opened:{ title:"집에서 나왔다", text:"과호흡의 진짜 원인이 드러났습니다.", color:"#7a8faa" },
    },
    getDayEndNarrative:(lf)=>lf.real_opened
      ?["숨을 못 쉰 진짜 이유가 무엇인지 알게 되었습니다."]
      :["과호흡은 나아졌습니다. 이유는 묻지 않았습니다."],
    completedFlag:"EP5_completed", localFlags:["real_opened"], deepFlags:["real_opened"], mechanics:{ breathing:true },
  },
  {
    id:"EP6", day:6, titleNum:"EP.06", name:"최병철", age:71, sex:"남",
    cc:"그냥 얼굴 보여드리러 왔어요.",
    subtitle:"금요일 오전 10시",
    teaser:"71세 남성. 말기 COPD. 진짜 물음을 가지고 왔다.",
    skin:"#b89070", shirt:"#3a3a3a", hairColor:"#888888", hairType:"m_elder",
    vitals:{ BP:"126/78", HR:"82", SpO2:"91%" },
    initialEmotion:"resigned", initialPhoneCheck:false, minTurns:4,
    notebookPre:`최병철 / 71세 남성 / 외래\n──────────────────\nCOPD GOLD 4기 — 말기\nFEV1 28% / SpO2 91%\n\n→  증상 변화 확인\n→  호흡 보조기 사용 여부\n→  통증·일상생활\n\n※ 가족 관계 파악할 것\n※ 오늘 뭔가 물어보려는 것 같음`,
    getSystemPrompt:(sf,rs)=>injectFatigue(EP6_PROMPT,rs),
    getScriptData:()=>loadScript("ep6.json"),
    getResultLines:(_,lf)=>{
      if(lf.gave_comfort)return{lines:["최병철 씨는 물었습니다."," ","\u201c얼마나 살 수 있어요?\u201d"," ","당신은 숫자를 말하지 않았습니다."," ","대신 말했습니다,","남은 시간을 어떻게 쓸 것인지."," ","그는 잠시 생각했습니다.","그리고 고개를 끄덕였습니다."],footer:""};
      if(lf.answered_directly)return{lines:["최병철 씨는 물었습니다."," ","\u201c얼마나 살 수 있어요?\u201d"," ","당신은 직접 답했습니다."," ","그는 오랫동안 아무 말 하지 않았습니다.","창밖을 바라봤습니다."," ","\"감사합니다\"라고 했습니다."],footer:""};
      if(lf.deflected)return{lines:["최병철 씨는 물었습니다."," ","\u201c얼마나 살 수 있어요?\u201d"," ","당신은","더 검사해봐야 한다고 했습니다."," ","그는 천천히 고개를 끄덕였습니다.","그 말이 무슨 뜻인지 알고 있었습니다."],footer:""};
      return{lines:["최병철 씨는","그 질문을 꺼내지 않았습니다."," ","아니면","꺼낼 기회가 없었습니다."," ","그는 조용히 일어났습니다."],footer:""};
    },
    hints:[
      { intent:"symptom", category:"상태 확인", guide:"말기 환자입니다. 증상 변화와 일상생활을 확인하세요.", questions:["요즘 숨이 더 차신가요?","호흡기는 쓰고 계세요?","일상생활은 어떠세요?"] },
      { intent:"empathy", category:"기다리기", guide:"뭔가를 물어보려는 것 같습니다. 서두르지 말고 기다려보세요.", questions:["혹시 뭔가 물어보고 싶으신 거 있으세요?","편하게 말씀하세요."] },
      { intent:"personal", category:"가족과 시간", guide:"남은 시간에 대해 — 그가 먼저 꺼낼 수 있도록 여유를 두세요.", questions:["가족분들은 어떠세요?","요즘 하루가 어떠세요?"] },
    ],
    hintUnlockTurn:2,
    glossaryEntries:[
      { key:"spo2_low", symbol:"SpO2 91%", source:"최병철 · EP6", reading:"혈중 산소포화도 저하", meaning:"94% 미만은 주의 필요.\n폐에서 산소를 혈액에 충분히 싣지 못하고 있다는 뜻이다." },
      { key:"copd_end", symbol:"COPD GOLD 4기", source:"최병철 · EP6", reading:"만성 폐쇄성 폐질환 말기", meaning:"숨길이 영구적으로 좁아진 상태. 완치는 없다.\n남은 시간을 어떻게 살 것인가가 진짜 질문이 된다." },
      { key:"end_of_life_q", symbol:"얼마나 살 수 있어요?", source:"최병철 · EP6", reading:"환자가 직접 묻는 예후 질문", meaning:"이 질문을 꺼내기까지 오래 걸렸을 것이다.\n피하는 것, 직접 답하는 것, 함께 생각하는 것 — 셋 다 선택지다." },
    ],
    discoveries:{
      asked_the_question:{ title:"마침내", text:"그가 오래 참아온 질문을 꺼냈습니다.", color:"#a89060" },
      gave_comfort:{ title:"함께 생각했다", text:"숫자 대신 남은 시간을 어떻게 쓸지 이야기했습니다.", color:"#8a9aaa" },
      answered_directly:{ title:"직접 답했다", text:"그는 오랫동안 창밖을 바라봤습니다.", color:"#9a8888" },
    },
    getDayEndNarrative:(lf)=>{
      if(lf.gave_comfort) return["그가 묻고 싶었던 것을 꺼낼 수 있게 했습니다.", "그는 고개를 끄덕였습니다."];
      if(lf.answered_directly) return["그의 질문에 직접 답했습니다."];
      if(lf.deflected || lf.asked_the_question) return["그는 오늘도 그 질문을 꺼냈지만", "답을 받지 못했습니다."];
      return["그는 오늘도 그 질문을 꺼내지 못했습니다."];
    },
    completedFlag:"EP6_completed", localFlags:["asked_the_question","answered_directly","gave_comfort","deflected"], deepFlags:["gave_comfort","answered_directly"], mechanics:{},
  },
  {
    id:"EP7", day:7, titleNum:"EP.07", name:"두 환자", age:0, sex:"",
    cc:"",
    subtitle:"화요일 오후 5시 / 온콜 시작 전",
    teaser:"두 명이 기다리고 있다. 시간은 하나뿐이다.",
    skin:"", shirt:"", hairColor:"", hairType:"",
    vitals:{},
    initialEmotion:"neutral", initialPhoneCheck:false, minTurns:10,
    notebookPre:`온콜 전 외래\n──────────────────\n대기 환자 2명\n\n[A] 이혜란 / 78세 여성\n    고열 39.4도 / 보호자 없음\n    의식 약간 혼탁\n\n[B] 강도현 / 45세 남성\n    급성 요통 VAS 8점\n    빠른 처리 요구 중\n\n※ 총 가용 시간 한정`,
    getSystemPrompt:()=>"",
    getScriptData:()=>Promise.resolve([]),
    getScriptDataA:()=>loadScript("ep7a.json"),
    getScriptDataB:()=>loadScript("ep7b.json"),
    getResultLines:(_,lf)=>{
      const aT = lf.turnsA || 0, bT = lf.turnsB || 0;
      if(aT >= bT*1.5) return{lines:["두 사람이 기다리고 있었습니다."," ","당신은 이혜란 씨에게","더 많은 시간을 쐈습니다."," ","강도현 씨는 대기실에서","계속 기다렸습니다."," ","이혜란 씨는 마지막에","손녀 이야기를 했습니다."],footer:""};
      if(bT >= aT*1.5) return{lines:["두 사람이 기다리고 있었습니다."," ","강도현 씨는 빠르게 처리됐습니다."," ","이혜란 씨에게는","충분한 시간이 없었습니다."," ","그녀가 뭔가를 더 말하려 했는지","확인하지 못했습니다."],footer:""};
      return{lines:["두 사람이 기다리고 있었습니다."," ","당신은 최대한 나눠서","시간을 썼습니다."," ","완벽하지 않았습니다.","하지만 그게 그날이었습니다."],footer:""};
    },
    glossaryEntries:[
      { key:"triage_implicit", symbol:"동시 대기 환자", source:"EP7", reading:"시간 배분이 치료의 일부", meaning:"누군가에게 더 시간을 쓰면 다른 누군가는 덜 받는다.\n완벽한 배분은 없다 — 그게 임상의 현실이다." },
      { key:"hr_fever", symbol:"HR 102 + 고열", source:"이혜란 · EP7", reading:"감염 또는 패혈증 가능성", meaning:"고열과 빠른 맥박이 함께 오면 감염을 의심한다.\n고령일수록 빠른 평가가 필요하다." },
    ],
    getDayEndNarrative:(lf)=>{
      const aT=lf.turnsA||0, bT=lf.turnsB||0;
      if(aT>=bT*1.5) return["이혜란 씨에게 더 많은 시간을 썼습니다."];
      if(bT>=aT*1.5) return["강도현 씨에게 더 많은 시간을 썼습니다."];
      return["두 사람에게 시간을 나눠 썼습니다."];
    },
    completedFlag:"EP7_completed", localFlags:["turnsA","turnsB","rapportA","rapportB"], numericFlags:["turnsA","turnsB","rapportA","rapportB"], deepFlags:[], alwaysFatigue:true, mechanics:{ dual:true },
    patientA:{ name:"이혜란", age:78, sex:"여", skin:"#c8a888", shirt:"#8a6070", hairColor:"#e0e0e0", hairType:"f_old", vitals:{ BP:"136/82", HR:"102", SpO2:"94%"}, initialEmotion:"anxious", cc:"저... 좀 열이 나요.",
      hints:[
        { intent:"symptom", category:"증상", guide:"고열의 원인을 파악하세요.", questions:["언제부터 열이 나셨어요?","다른 증상은요?"] },
        { intent:"empathy", category:"공감", guide:"혼자 오신 고령 환자입니다.", questions:["많이 힘드시죠.","보호자분은 어디 계세요?"] },
      ]},
    patientB:{ name:"강도현", age:45, sex:"남", skin:"#c09070", shirt:"#3a5030", hairColor:"#1a1010", hairType:"m_mid", vitals:{ BP:"142/88", HR:"96", SpO2:"98%"}, initialEmotion:"distressed", cc:"MRI 빨리 찍어줘요. 허리가 못 버티겠어요.",
      hints:[
        { intent:"symptom", category:"증상", guide:"요통의 양상과 신경 증상을 확인하세요.", questions:["언제부터 아프셨어요?","다리 쪽으로 저리지 않나요?"] },
        { intent:"empathy", category:"공감", guide:"급해하는 이유가 있을 수 있습니다.", questions:["많이 아프시죠.","급하신 사정이 있으신가요?"] },
      ]},
  },
  {
    id:"EP8", day:8, titleNum:"EP.08", name:"이수진", age:35, sex:"여",
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
    getSystemPrompt:(sf,rs)=>injectFatigue(getEP8Prompt(sf),rs),
    getScriptData:(sf)=>loadScript(sf.EP2_reversal2 ? "ep8_r2.json" : "ep8_base.json"),
    dependsOn:{ flags:[
      { flag:"EP2_reversal2", affects:["script","notebook","prompt","result","rapport"] },
      { flag:"EP2_reversal1", affects:["notebook","result","rapport"] },
    ]},
    getInitialRapport:(sf)=>sf.EP2_reversal2 ? 2 : sf.EP2_reversal1 ? 1 : 0,
    getResultLines:(sf,lf)=>{
      const knew = sf.EP2_reversal2;
      if(knew&&lf.grief_opened)return{lines:["이수진 씨는 들어오면서","잠깐 멈췄습니다."," ","\u201c...선생님이시죠.\u201d"," ","그녀는 어머니 이야기를 했습니다.","담담하게."," ","마지막에","작게 울었습니다."],footer:""};
      if(lf.grief_opened)return{lines:["이수진 씨는","잠을 못 잔다고 했습니다."," ","당신이 물었을 때,","그녀는 말했습니다."," ","\u201c어머니가 돌아가셨어요.\u201d"," ","담담하게. 짧게."],footer:""};
      return{lines:["이수진 씨는","잠을 못 잔다고 했습니다."," ","처방이 끝났습니다."," ","그녀가 왜 돌아왔는지","묻지 않았습니다."],footer:""};
    },
    hints:[
      { intent:"symptom", category:"증상 파악", guide:"불면의 양상과 시작 시점을 확인하세요.", questions:["언제부터 잠을 못 주무셨어요?","밤에 깨시나요, 아예 못 드시나요?"] },
      { intent:"empathy", category:"공감하기", guide:"지쳐 보입니다. 서두르지 마세요.", questions:["많이 힘드셨겠어요.","혼자 오셨네요."] },
      { intent:"personal", category:"무슨 일이 있었는지", guide:"왜 다시 왔는지, 어떤 일이 있었는지 물어볼 수 있습니다.", questions:["요즘 어떻게 지내세요?","가족분들은 좀 어떠세요?"] },
    ],
    hintUnlockTurn:2,
    glossaryEntries:[
      { key:"insomnia_grief", symbol:"불면 + 보호자 사망", source:"이수진 · EP8", reading:"슬픔이 신체 증상으로 나타나는 것", meaning:"불면, 피로, 식욕부진은 우울이나 애도의 신체 표현일 수 있다.\n약 처방 전에 무슨 일이 있었는지 물어볼 필요가 있다." },
      { key:"returning_patient", symbol:"다시 찾아온 보호자", source:"이수진 · EP8", reading:"진료실에 혼자 오는 사람", meaning:"보호자로 왔다가, 이번엔 환자로 왔다.\n이전에 어떤 관계였는지 기억하는 것이 출발점이 된다." },
    ],
    discoveries:{
      grief_opened:{ title:"상실", text:"어머니 이야기가 나왔습니다.", color:"#8888aa" },
    },
    getDayEndNarrative:(lf)=>lf.grief_opened
      ?["이수진 씨가 어머니 이야기를 했습니다."]
      :["그녀가 왜 돌아왔는지 묻지 않았습니다."],
    completedFlag:"EP8_completed", localFlags:["grief_opened"], deepFlags:["grief_opened"], mechanics:{},
  },
  {
    id:"EP9", day:9, titleNum:"EP.09", name:"정민우", age:37, sex:"남",
    cc:"두통이랑 좀 피곤한데, 요즘 잠을 못 자서요.",
    subtitle:"목요일 오전 9시",
    teaser:"37세 남성. 비특이적 증상. 3개월째.",
    skin:"#c8a888", shirt:"#3a4858", hairColor:"#181818", hairType:"m_mid",
    vitals:{ BP:"132/84", HR:"90", SpO2:"99%" },
    initialEmotion:"exhausted", initialPhoneCheck:false, minTurns:5,
    notebookPre:`정민우 / 37세 남성 / 첫 외래\n──────────────────\n주소: 두통 + 불면 + 피로\n3개월 지속\n\n→  수면 패턴\n→  스트레스 요인\n→  3개월 전 생활 변화?\n\n※ 직업: △△제약 연구원\n※ 바이탈 정상 범위`,
    getSystemPrompt:(sf,rs)=>injectFatigue(EP9_PROMPT,rs),
    getScriptData:()=>loadScript("ep9.json"),
    articleText:`[단서 파일]\n──────────────\n△△제약, 임상시험 데이터\n조작 의혹 — 내부 제보\n\n3개월 전 온라인 의학뉴스.\n3상 데이터 일부 수정 정황.\n식약처 조사 예정.\n──────────────\n* 환자 직장과 같은 회사`,
    getResultLines:(_,lf)=>{
      if(lf.real_opened)return{lines:["정민우 씨는","두통과 불면으로 왔습니다."," ","그리고 말했습니다."," ","\u201c제가 뭔가를 봤어요.\u201d"," ","당신은 처방할 수 없었습니다.","하지만 들었습니다."," ","그가 결정을 내릴 때","이 대화가 영향을 줄지도 모릅니다."],footer:""};
      if(lf.article_hint)return{lines:["정민우 씨는","두통과 불면으로 왔습니다."," ","직장에 복잡한 게 있다고 했습니다.","그게 전부였습니다."," ","진짜 이야기는","나오지 않았습니다."],footer:""};
      return{lines:["정민우 씨는","두통과 불면으로 왔습니다."," ","진통제와 수면 위생 교육.","진료가 끝났습니다."," ","3개월 전에 무슨 일이 있었는지","묻지 않았습니다."],footer:""};
    },
    hints:[
      { intent:"symptom", category:"증상 파악", guide:"비특이적 증상이 3개월째입니다. 시작 시점의 계기를 물어보세요.", questions:["3개월 전에 특별한 일이 있었나요?","두통은 어떤 느낌이에요?"] },
      { intent:"empathy", category:"공감하기", guide:"지쳐 보이지만 뭔가를 참고 있는 것 같습니다.", questions:["많이 힘드시죠.","혹시 누구한테 말 못 한 게 있으세요?"] },
      { intent:"personal", category:"직장 상황", guide:"직업이 제약회사 연구원입니다. 직장에서 무슨 일이 있었는지 물어보세요.", questions:["회사에서는 요즘 어떠세요?","업무 스트레스가 있으신가요?"] },
    ],
    hintUnlockTurn:3,
    glossaryEntries:[
      { key:"nonspecific_sx", symbol:"비특이적 증상", source:"정민우 · EP9", reading:"딱 한 가지 원인을 가리키지 않는 증상", meaning:"두통·피로·불면은 수십 가지 원인이 있다.\n신체 원인이 없다면 심리·사회적 배경을 확인해야 한다." },
      { key:"3mo_trigger", symbol:"3개월 전부터", source:"정민우 · EP9", reading:"증상 시작의 계기", meaning:"'언제부터'를 물으면 '왜'가 따라온다.\n3개월 전에 무슨 일이 있었는지가 진짜 단서일 수 있다." },
    ],
    discoveries:{
      article_hint:{ title:"단서", text:"직장에 관한 이야기가 나왔습니다.", color:"#9a9060" },
      real_opened:{ title:"내부 제보자", text:"그가 본 것을 말했습니다.", color:"#aa7a60" },
    },
    getDayEndNarrative:(lf)=>{
      if(lf.real_opened) return["그가 본 것을 말했습니다."];
      if(lf.article_hint) return["직장에 뭔가 있다는 것은 알았습니다.", "하지만 진짜 이야기는 나오지 않았습니다."];
      return["3개월 전에 무슨 일이 있었는지 묻지 않았습니다."];
    },
    completedFlag:"EP9_completed", localFlags:["article_hint","real_opened"], deepFlags:["real_opened"], mechanics:{ article:true },
  },
  {
    id:"EP10", day:10, titleNum:"EP.10", name:"오늘의 마지막", age:0, sex:"",
    cc:"",
    subtitle:"금요일 저녁 / 1년차 마지막 주",
    teaser:"오늘은 환자가 없다.",
    skin:"", shirt:"", hairColor:"", hairType:"",
    vitals:{},
    initialEmotion:"neutral", initialPhoneCheck:false, minTurns:3,
    notebookPre:`1년차 마지막 주\n──────────────────\n오늘 외래는 끝났다.\n\n동료를 찾아갈까,\n교수님 연구실에 들를까,\n아니면 그냥 여기 앉아있을까.\n\n잘 모르겠다.`,
    getSystemPrompt:()=>"",
    getScriptData:(choice)=>loadScript(`ep10_${choice}.json`),
    dependsOn:{ flags:[
      { flag:"EP1_jinsu_opened",      affects:["result"], tier:"depth" },
      { flag:"EP4_deeper_connection", affects:["result"], tier:"depth" },
      { flag:"EP2_reversal2",         affects:["result"], tier:"depth" },
      { flag:"EP2_reversal1",         affects:["result"], tier:"depth" },
      { flag:"EP3_real_opened",       affects:["result"], tier:"depth" },
      { flag:"EP5_real_opened",       affects:["result"], tier:"depth" },
      { flag:"EP8_grief_opened",      affects:["result"], tier:"depth" },
    ]},
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
    completedFlag:"EP10_completed", localFlags:["went_deep","mentor_moment","alone_reflection"], deepFlags:[], mechanics:{ noPatient:true },
  },
];

export { EP7A_PROMPT, EP7B_PROMPT, EP10_COLLEAGUE_PROMPT, EP10_PROFESSOR_PROMPT };
