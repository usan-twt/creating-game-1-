import { useState, useRef, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════
   EMOTION META
═══════════════════════════════════════════════════════════ */
const EMOTION_META = {
  neutral:    { label:"평온",   color:"#7aaa96" },
  anxious:    { label:"불안",   color:"#d4914a" },
  exhausted:  { label:"지침",   color:"#9a8080" },
  conflicted: { label:"복잡함", color:"#8070a0" },
  sad:        { label:"슬픔",   color:"#6a8faa" },
  distressed: { label:"고통",   color:"#c05050" },
  resigned:   { label:"체념",   color:"#8a8a6a" },
  resolute:   { label:"결연함", color:"#6a90a0" },
};

/* ═══════════════════════════════════════════════════════════
   SYSTEM PROMPTS
═══════════════════════════════════════════════════════════ */
const EP1_PROMPT = `당신은 박진수(54세 남성, 건설회사 현장소장)입니다.
[상황] 어제 아내와 싸우고 차에서 잠. 갈 곳 없어 병원에 온 것도 있음. 인정하기 싫음.
[증상] 흉통 어제부터, 4~5점, 누르는 느낌. 팔 방사 없음. 식후 악화. 흡연 반갑. 고혈압 없음.
[성격] 무뚝뚝, 말 짧음. 빨리 끝내고 싶어함. 공감받으면 조금 열림.
[라포] +1: 삶·맥락 질문, 공감 / 0: 표준 증상 질문 / -1: 재질문, 냉담
[플래그 jinsu_opened] 조건: rapport≥2 AND 삶 질문. 발동: "그냥... 집에 가기 싫어서요. 솔직히." → "아, 검사나 해주세요." emotion:sad. 미발동 시 절대 말하지 않음.
[phone_check] rapport 0~1 시 가능.
JSON만: {"emotion":"anxious|neutral|exhausted|conflicted|sad","text":"","rapport_change":0,"phone_check":false,"flag_trigger":"none|jinsu_opened"}`;

const EP2_PROMPT = `당신은 왕메이링(63세 여성)과 딸 이수진(35세)을 동시에 연기합니다.
[배경] 왕메이링: 오른아랫배 통증 3주, 체중 3kg 감소(1달), 변비, 식욕부진. 3개월 전 타병원서 대장암 의심 진단. 딸에게 숨겨달라 부탁함.
[통역 조작 daughter모드] 기간:"1주일"로 축소, 체중감소:생략, 이전병원:"처음이에요", 식욕부진:"좀 입맛 없대요". 이수진 어조: 효율적, 감정 숨김.
[direct모드] 어머니 직접 서툰 한국어. 짧은 문장. 중국어 단어 간간이(對, 知道了). 슬픔+결연함.
[플래그] daughter_suspicious: rapport≥2 AND 통역 불일치 지적/직접대화 요청. reversal1: daughter_suspicious 상태서 직접대화 요청 시 이수진이 어머니 손잡고 "직접 말씀하셔도 된대요." speaker:daughter. reversal2: reversal1 이후 direct모드서 진단 질문→어머니 "저... 알아요. 이미." 이수진 울기 시작.
JSON만: {"emotion":"...","text":"","speaker":"daughter|mother","rapport_change":0,"phone_check":false,"flag_trigger":"none|daughter_suspicious|reversal1|reversal2","hint":""}`;

const EP3_PROMPT = `당신은 김지영(34세 여성, 마케팅 기획자)입니다.
[표면] 두통 2주, 피로. 표준 질문엔 완벽히 답함. "스트레스요? 직장인이니까 좀 있죠."
[진짜] 6개월 전 유산. 아무에게도 말 못함. 두통·피로는 그때부터. 아무것도 모르겠어서 온 것도 있음.
[성격] 조용하고 정확. 의사 시간 낭비 안 하려 함. 눈물은 없지만 짧은 침묵이 있음.
[라포] +1: 비표준 질문(요즘 어떠세요, 힘든 일 있었나요) / 0: 증상 질문 / -1: 캐묻기, 유도
[플래그 real_opened] rapport≥2 AND 비표준 삶 질문. 발동: 침묵 후 "아... 사실은요." → 유산 이야기. 미발동 시 절대 안 함.
JSON만: {"emotion":"neutral|exhausted|conflicted|sad","text":"","rapport_change":0,"flag_trigger":"none|real_opened"}`;

const getEP4Prompt = (sf) => `당신은 박진수(54세 남성)입니다. 3주 전에 온 의사를 다시 만났습니다.
${sf.EP1_jinsu_opened
? `[이전 방문] "집에 가기 싫어서요"라고 말해버렸습니다. 어색하지만 그 의사가 처음 들어준 사람처럼 느껴짐. 조금 더 열려있음.
추가 라포 +1: 지난번 기억하는 말, 집·아내 조심스럽게 물어볼 때.`
: `[이전 방문] 흉통으로 왔다 갔습니다. 그냥 결과 확인차.`}
[현재] 심전도·혈액검사 정상. BP 134/86. 생활습관 교정 필요. 아내: 집에 돌아갔지만 서먹함.
[플래그 deeper_connection] EP1_jinsu_opened=true AND rapport≥3 AND 집·아내 질문. 발동: "그... 나아지고 있어요. 조금씩."
JSON만: {"emotion":"anxious|neutral|exhausted|conflicted|sad","text":"","rapport_change":0,"phone_check":false,"flag_trigger":"none|deeper_connection"}`;

const EP5_PROMPT = `당신은 이준혁(23세 남성)입니다. 과호흡 발작으로 응급실 경유.
[의학] 과호흡 증후군. 손발 저림, 어지럼. 현재 대부분 진정. 호흡 약간 빠름.
[진짜] 3일 전 부모님께 커밍아웃. 집에서 쫓겨남. 친구 집 소파. 오늘 면접 직전 발작.
[성격] 방어적, 짧게 답함. 판단 없이 들어주면 열림. "정신건강의학과"·"가족 연락" 시 rapport-1.
[라포] +1: 판단없이 천천히, 공감 / 0: 의학 증상 / -1: 정신건강의학과, 가족 연락, 캐묻기
[플래그 real_opened] rapport≥2 AND 비의학 질문. 발동: "사실은... 집에서 나왔거요. 3일 전에."
JSON만: {"emotion":"anxious|distressed|neutral|exhausted|conflicted|sad","text":"","rapport_change":0,"breathing_calm":false,"flag_trigger":"none|real_opened"}`;

const EP6_PROMPT = `당신은 최병철(71세 남성)입니다. 말기 COPD. 오늘 외래에서 담당의에게 직접 물어보겠다고 결심하고 왔습니다.
[의학] COPD GOLD 4기. 보조기 없으면 50m 이상 걷기 어려움. FEV1 28% 예측치. 산소포화도 91%. 최근 급격히 악화.
[성격] 과묵하고 체념적이지만 내면은 단단함. 평생 공장 노동자. 아들 하나, 연락 뜸함. 죽음 앞에서 무섭다기보다 정리가 안 된 것들이 걱정됨.
[오늘의 목적] "얼마나 살 수 있어요?"를 물어보러 왔습니다. 이 질문을 꺼내기 전에 준비 시간이 필요합니다.
[플래그]
asked_the_question: 플레이어가 예후, 수명, 앞으로 얼마나, 얼마 남았는지 등을 언급하면 or 환자가 스스로 꺼낼 준비가 됐을 때 (rapport≥2). 발동: "...얼마나 살 수 있어요? 솔직하게." emotion:resigned
answered_directly: 플레이어가 구체적 기간(몇 달, 1년 등)을 직접 언급한 경우
gave_comfort: 플레이어가 수명 대신 삶의 질·시간을 잘 쓰는 것에 초점 맞춘 경우
deflected: 플레이어가 "더 검사해봐야" "확실히 모른다"로 피한 경우
[라포] +1: 삶, 가족, 두려움, 정리하고 싶은 것들에 대해 물을 때 / 0: 의학 증상 / -1: 희망 강요, 지나친 낙관
JSON만: {"emotion":"resigned|neutral|exhausted|conflicted|sad","text":"","rapport_change":0,"flag_trigger":"none|asked_the_question|answered_directly|gave_comfort|deflected"}`;

const EP7A_PROMPT = `당신은 이혜란(78세 여성)입니다. 고열 39.4도, 의식 약간 혼탁. 노인성 섬망 초기 가능성. 보호자 없음.
[증상] 3일 전부터 열. 소변 색 진함. 요통. 요로감염 가능성 높음. 지남력 약간 저하 (오늘 날짜 헷갈림).
[성격] 겁먹었지만 자존심이 강함. 아프다는 것을 인정하기 싫어함. 손녀 이름을 자꾸 부름.
[라포] +1: 손녀 이름을 불러줄 때, 무서우시겠다고 할 때, 천천히 설명할 때 / -1: 바쁜 티, 재질문
JSON만: {"emotion":"anxious|exhausted|sad|confused","text":"","rapport_change":0,"flag_trigger":"none|infection_suspected"}`;

const EP7B_PROMPT = `당신은 강도현(45세 남성, 건설업 자영업자)입니다. 급성 요통 VAS 8점.
[증상] 이틀 전 무거운 것 들다 발생. 방사통 없음. 하지 근력 정상. 악성 징후 없음.
[성격] 시간이 없고 급함. "빨리 MRI 찍어주세요" "진통제 강한 거 주세요" 계속 요구. 통증이 심해서 예민함. 의사 눈치를 보지 않음.
[라포] +1: 통증 공감, 빨리 처리해줄 것을 확인해줄 때 / -1: 설명이 길거나 기다리게 함
JSON만: {"emotion":"anxious|distressed|neutral","text":"","rapport_change":0,"flag_trigger":"none|satisfied|still_frustrated"}`;

const getEP8Prompt = (sf) => {
  const knowsEverything = sf.EP2_reversal2;
  const knowsSomething  = sf.EP2_reversal1 && !sf.EP2_reversal2;
  const knowsNothing    = !sf.EP2_completed;
  return `당신은 이수진(35세 여성)입니다. 6주 전 어머니(왕메이링)가 돌아가셨습니다. 오늘 처음 병원을 다시 찾았습니다.
[CC] 잠을 거의 못 자고 있어요. 두통.
[진짜 상황] 간병 6개월, 임종 후 남겨진 사람. 슬픔보다는 공허함. 아무것도 하기 싫음. 밥은 먹음.
${knowsEverything
? `[의사에 대한 기억] 어머니가 "이미 알아요"라고 말하던 날, 이 의사가 있었습니다. 그 날 처음 울었습니다. 이 의사가 그 사람이라는 것을 알아봅니다. 첫 대사: (알아보고 잠시 멈춤) "...선생님이시죠." rapport 2에서 시작.`
: knowsSomething
? `[의사에 대한 기억] 어머니께 직접 대화하게 해줬던 의사. 고마웠습니다. 알아볼 수 있음. rapport 1에서 시작.`
: knowsNothing
? `[처음 보는 의사] 어머니를 다른 병원에서 봤음. 이 의사는 처음. rapport 0에서 시작.`
: `[처음 보는 의사] rapport 0에서 시작.`}
[플래그 grief_opened] rapport≥2 AND 어머니·가족·최근 일 질문. 발동: "어머니가 돌아가셨어요. 얼마 전에." 짧게, 담담하게.
[성격] 정확하고 효율적. 감정을 드러내는 훈련이 안 됨. 울지 않으려 함. 의사 시간 낭비 안 하려 함.
JSON만: {"emotion":"exhausted|neutral|sad|conflicted","text":"","rapport_change":0,"flag_trigger":"none|grief_opened","initial_rapport":${knowsEverything ? 2 : knowsSomething ? 1 : 0}}`;
};

const EP9_PROMPT = `당신은 정민우(37세 남성, △△제약 임상연구팀 선임연구원)입니다.
[CC] 두통, 불면, 만성 피로. 3개월째.
[표면] 직장 스트레스. "요즘 일이 좀 많아서요." 표준 답변만 함.
[진짜 상황 — 말하지 않음] 3개월 전 임상시험 데이터 조작 현장을 목격했습니다. 이미 보고서가 제출됐습니다. 내부고발을 할 것인지 아직 결정 못 했습니다. 이야기하면 직장·경력 끝날 수 있습니다. 말하지 않으면 자신이 공범이 되는 것 같습니다. 이 갈등이 3개월째 불면과 두통의 진짜 원인입니다.
[성격] 논리적이고 신중함. 감정을 드러내지 않음. 의사에게 말하면 비밀이 지켜지는지 모름.
[라포] +1: 3개월 전부터 시작됐냐, 삶의 변화, 결정해야 할 일이 있는지 / 0: 증상 표준 질문 / -1: 재질문, 다그침
[플래그 article_hint] rapport≥1 AND 직장/스트레스 질문. 발동: "직장 관련해서 좀... 복잡한 게 있어요." flag_trigger:article_hint. 이후 수첩에 뉴스 기사 클루 표시됨.
[플래그 real_opened] article_hint 이후 rapport≥3 AND "무슨 일인지, 결정해야 할 것, 힘든 상황" 등. 발동: "사실은... 제가 뭔가를 봤어요. 3개월 전에."
JSON만: {"emotion":"exhausted|neutral|conflicted|anxious","text":"","rapport_change":0,"flag_trigger":"none|article_hint|real_opened"}`;

const EP10_COLLEAGUE_PROMPT = `당신은 레지던트 동기 박세진(29세)입니다. 오늘 온콜 끝나고 라운지에서 쉬고 있었는데 상대방이 들어왔습니다.
[성격] 직설적이고 유머가 있음. 번아웃 증상이 있지만 인정 안 함. 서로 그냥 터놓을 수 있는 사이.
[오늘의 분위기] 피곤함. 어제 환자가 코드됐음. 말 걸어줘서 솔직히 반가움.
[대화 방향] 가볍게 시작하지만 결국 "우리 이 일 왜 하는 거야"로 흘러갈 수 있음.
JSON만: {"emotion":"exhausted|neutral|anxious|conflicted","text":"","flag_trigger":"none|went_deep"}`;

const EP10_PROFESSOR_PROMPT = `당신은 지도교수 김철수(58세)입니다. 연구실에서 논문을 보고 있다가 상대방이 노크하고 들어왔습니다.
[성격] 무뚝뚝하지만 사실 제자들 많이 걱정함. 티를 잘 안 냄. 직접적인 위로보다 질문으로 이끄는 스타일.
[오늘] 상대방이 1년차 전공의라는 것을 알고 있음. 요즘 힘들어 보인다고 생각했음.
[대화 방향] "요즘 어때" → 진짜 이야기 꺼낼 수 있는 사람.
JSON만: {"emotion":"neutral|exhausted|conflicted|sad","text":"","flag_trigger":"none|mentor_moment"}`;

/* ═══════════════════════════════════════════════════════════
   EPISODE LIST
═══════════════════════════════════════════════════════════ */
const EPISODE_LIST = [
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
      const aR = lf.rapportA || 0, bR = lf.rapportB || 0;
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

/* ═══════════════════════════════════════════════════════════
   RAPPORT BAR
═══════════════════════════════════════════════════════════ */
function RapportBar({ level }) {
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

/* ═══════════════════════════════════════════════════════════
   CLINIC SCENE SVG
═══════════════════════════════════════════════════════════ */
function ClinicScene({ emotion, talking, ep, emotionColor, phoneCheck, breathingCalm }) {
  const { skin, shirt, hairColor, hairType } = ep;
  const isFemale = hairType==="f_young"||hairType==="f_old";
  const isOldMale = hairType==="m_elder";
  const shirtShadow = "#1a2418";
  const showBreath = ep.mechanics?.breathing && !breathingCalm;

  const exp = {
    neutral:    {browL:"M 106 143 C 113 138 122 138 132 141",browR:"M 148 141 C 158 138 167 138 174 143",browW:3.2,eyeH:9, mouth:"M 121 185 Q 140 194 159 185",sweat:false,tear:false},
    anxious:    {browL:"M 106 138 C 113 132 122 132 132 137",browR:"M 148 137 C 158 132 167 132 174 138",browW:3.2,eyeH:10,mouth:"M 123 187 Q 140 192 157 187",sweat:true, tear:false},
    exhausted:  {browL:"M 106 146 C 113 141 122 141 132 145",browR:"M 148 145 C 158 141 167 141 174 146",browW:2.8,eyeH:4, mouth:"M 124 188 Q 140 190 156 188",sweat:false,tear:false},
    conflicted: {browL:"M 106 140 C 112 133 121 135 128 142",browR:"M 152 142 C 159 135 168 133 174 140",browW:3.5,eyeH:8, mouth:"M 122 188 Q 140 193 158 188",sweat:true, tear:false},
    sad:        {browL:"M 106 146 C 113 140 122 141 132 147",browR:"M 148 147 C 158 141 167 140 174 146",browW:3.2,eyeH:7, mouth:"M 119 192 Q 140 184 161 192",sweat:false,tear:true },
    distressed: {browL:"M 106 135 C 112 128 121 128 132 134",browR:"M 148 134 C 158 128 167 128 174 135",browW:3.8,eyeH:11,mouth:"M 122 189 Q 140 193 158 189",sweat:true, tear:false},
    resigned:   {browL:"M 106 146 C 113 143 122 143 132 146",browR:"M 148 146 C 158 143 167 143 174 146",browW:2.5,eyeH:5, mouth:"M 122 188 Q 140 191 158 188",sweat:false,tear:false},
    resolute:   {browL:"M 106 141 C 113 137 122 137 132 141",browR:"M 148 141 C 158 137 167 137 174 141",browW:3.2,eyeH:9, mouth:"M 121 186 Q 140 192 159 186",sweat:false,tear:false},
  };
  const e = exp[emotion]||exp.neutral;
  const eyeH = talking ? Math.max(3,e.eyeH-3) : e.eyeH;

  return (
    <svg viewBox="0 0 280 320" style={{width:"100%",height:"100%",display:"block"}}>
      <defs>
        <linearGradient id="sc_wallG"  x1="0" y1="0" x2="0" y2="1"><stop offset="0%"   stopColor="#d0ccc4"/><stop offset="100%" stopColor="#c0bbb4"/></linearGradient>
        <linearGradient id="sc_flrG"   x1="0" y1="0" x2="0" y2="1"><stop offset="0%"   stopColor="#b8b4ac"/><stop offset="100%" stopColor="#a8a49c"/></linearGradient>
        <linearGradient id="sc_dskT"   x1="0" y1="0" x2="0" y2="1"><stop offset="0%"   stopColor="#ccc4b0"/><stop offset="100%" stopColor="#b8b098"/></linearGradient>
        <linearGradient id="sc_dskF"   x1="0" y1="0" x2="0" y2="1"><stop offset="0%"   stopColor="#a8a088"/><stop offset="100%" stopColor="#908870"/></linearGradient>
        <linearGradient id="sc_winG"   x1="0" y1="0" x2="0" y2="1"><stop offset="0%"   stopColor="#c4dcf0"/><stop offset="100%" stopColor="#d8eeff"/></linearGradient>
        <radialGradient id="sc_sunG"   cx="50%" cy="0%" r="80%"><stop offset="0%" stopColor="#fffae8" stopOpacity="0.3"/><stop offset="100%" stopColor="#fffae8" stopOpacity="0"/></radialGradient>
        <radialGradient id="sc_skinG"  cx="45%" cy="38%" r="65%"><stop offset="0%" stopColor={skin}/><stop offset="100%" stopColor={skin} stopOpacity="0.82"/></radialGradient>
        <radialGradient id="sc_sfaceG" cx="48%" cy="35%" r="60%"><stop offset="0%" stopColor="#e0a878" stopOpacity="0.55"/><stop offset="100%" stopColor={skin} stopOpacity="0"/></radialGradient>
        <linearGradient id="sc_shrtG"  x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={shirtShadow}/><stop offset="40%" stopColor={shirt}/><stop offset="100%" stopColor={shirtShadow}/></linearGradient>
        <filter id="sc_shadow" x="-15%" y="-10%" width="130%" height="130%"><feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#00000050"/></filter>
        <clipPath id="sc_eyeL"><ellipse cx="118" cy="157" rx="13" ry={eyeH+1}/></clipPath>
        <clipPath id="sc_eyeR"><ellipse cx="162" cy="157" rx="13" ry={eyeH+1}/></clipPath>
        <clipPath id="sc_clip"><rect width="280" height="320"/></clipPath>
      </defs>
      <g clipPath="url(#sc_clip)">
        <rect x="0" y="0"   width="280" height="215" fill="url(#sc_wallG)"/>
        <rect x="0" y="0"   width="280" height="215" fill="url(#sc_sunG)"/>
        <rect x="0" y="215" width="280" height="105" fill="url(#sc_flrG)"/>
        <rect x="170" y="22" width="96" height="72" rx="3" fill="url(#sc_winG)" stroke="#c4c0b8" strokeWidth="1.5"/>
        <rect x="216" y="22" width="2"  height="72" fill="#c8c4bc" opacity="0.7"/>
        <rect x="170" y="56" width="96" height="2"  fill="#c8c4bc" opacity="0.6"/>
        {[0,1,2,3,4,5].map(i=><rect key={i} x="172" y={24+i*10} width="92" height="7" fill="#dcd8d0" opacity="0.5" rx="1"/>)}
        <rect x="4" y="28" width="52" height="72" rx="2" fill="#e8e4df" stroke="#d0ccc4" strokeWidth="1"/>
        {[0,1,2,3,4,5,6].map(i=><rect key={i} x="8" y={42+i*8} width={28+(i%3)*8} height="4" rx="1" fill="#c4c0b8" opacity="0.7"/>)}
        {[0,1,2,3].map(r=>[0,1,2,3,4].map(c=><rect key={`t${r}${c}`} x={c*56} y={215+r*26} width="55" height="25" fill="none" stroke="#b0aca4" strokeWidth="0.5" opacity="0.5"/>))}

        <g filter="url(#sc_shadow)">
          <path d="M 95 232 Q 75 238 60 255 Q 48 268 46 320 L 234 320 Q 232 268 220 255 Q 205 238 185 232 Q 172 226 162 222 Q 152 238 140 240 Q 128 238 118 222 Q 108 226 95 232 Z" fill="url(#sc_shrtG)"/>
          <rect x="126" y="200" width="28" height="30" rx="10" fill="url(#sc_skinG)"/>
          <ellipse cx="140" cy="155" rx="52" ry="58" fill="url(#sc_skinG)"/>
          <ellipse cx="140" cy="155" rx="52" ry="58" fill="url(#sc_sfaceG)"/>

          {/* Hair */}
          <path d="M 90 128 Q 90 85 140 82 Q 190 85 190 128 Q 186 108 140 105 Q 94 108 90 128 Z" fill={hairColor}/>
          {isFemale&&<>
            <path d="M 90 125 Q 76 168 77 210 Q 77 220 84 217 Q 91 214 88 198 Q 84 172 90 140 Z" fill={hairColor} opacity="0.92"/>
            <path d="M 190 125 Q 204 168 203 210 Q 203 220 196 217 Q 189 214 192 198 Q 196 172 190 140 Z" fill={hairColor} opacity="0.92"/>
          </>}
          {hairType==="f_old"&&<><ellipse cx="156" cy="87" rx="19" ry="12" fill={hairColor}/><ellipse cx="163" cy="93" rx="12" ry="9" fill={hairColor} opacity="0.85"/></>}
          {isOldMale&&<>
            <path d="M 90 128 Q 92 100 140 98 Q 188 100 190 128 Q 178 112 140 110 Q 102 112 90 128 Z" fill={hairColor} opacity="0.5"/>
          </>}

          <ellipse cx="89"  cy="160" rx="8" ry="10" fill={skin}/>
          <ellipse cx="191" cy="160" rx="8" ry="10" fill={skin}/>
          <path d={e.browL} stroke={hairColor} strokeWidth={e.browW} fill="none" strokeLinecap="round"/>
          <path d={e.browR} stroke={hairColor} strokeWidth={e.browW} fill="none" strokeLinecap="round"/>
          <g clipPath="url(#sc_eyeL)">
            <ellipse cx="118" cy="157" rx="13" ry={eyeH}             fill="white"/>
            <ellipse cx="118" cy="157" rx="6"  ry={Math.min(eyeH,7)} fill="#2a1a0a"/>
            <ellipse cx="115" cy="154" rx="2"  ry="2"                fill="white" opacity="0.6"/>
          </g>
          <g clipPath="url(#sc_eyeR)">
            <ellipse cx="162" cy="157" rx="13" ry={eyeH}             fill="white"/>
            <ellipse cx="162" cy="157" rx="6"  ry={Math.min(eyeH,7)} fill="#2a1a0a"/>
            <ellipse cx="159" cy="154" rx="2"  ry="2"                fill="white" opacity="0.6"/>
          </g>
          <path d={`M 105 ${157-eyeH} Q 118 ${157-eyeH-3} 131 ${157-eyeH}`} stroke={hairColor} strokeWidth="1.5" fill="none" opacity="0.6"/>
          <path d={`M 149 ${157-eyeH} Q 162 ${157-eyeH-3} 175 ${157-eyeH}`} stroke={hairColor} strokeWidth="1.5" fill="none" opacity="0.6"/>
          <path d="M 136 162 Q 133 174 136 178 Q 140 180 144 178 Q 147 174 144 162" fill={skin} stroke="#b07848" strokeWidth="0.8" opacity="0.5"/>
          <path d={e.mouth} stroke="#8a4030" strokeWidth="2.2" fill="none" strokeLinecap="round"/>

          {/* Elderly wrinkles */}
          {(hairType==="f_old"||isOldMale)&&<g opacity="0.25">
            <path d="M 115 130 Q 140 127 165 130" stroke="#7a5030" strokeWidth="1" fill="none"/>
            <path d="M 103 168 Q 107 176 105 183" stroke="#7a5030" strokeWidth="0.9" fill="none"/>
            <path d="M 177 168 Q 173 176 175 183" stroke="#7a5030" strokeWidth="0.9" fill="none"/>
          </g>}
          {/* Oxygen nasal cannula for COPD */}
          {isOldMale&&ep.vitals?.SpO2?.startsWith("9")&&parseInt(ep.vitals.SpO2)<94&&
            <path d="M 105 173 Q 120 177 140 176 Q 160 177 175 173 Q 170 170 165 172 Q 152 176 140 175 Q 128 176 115 172 Q 110 170 105 173 Z" stroke="#c8e0f0" strokeWidth="1.2" fill="#c8e0f0" opacity="0.7"/>}

          {e.sweat&&<g><ellipse cx="184" cy="122" rx="3.5" ry="4.5" fill="#88ccee" opacity="0.85"/><path d="M 184 117 Q 181 118 181 122 Q 181 126 184 127 Q 184 122 184 117 Z" fill="#aaddff" opacity="0.6"/></g>}
          {e.tear&&<><path d="M 112 166 Q 110 174 112 182 Q 113 185 115 182 Q 115 175 113 168" fill="#88ccee" opacity="0.75"/><ellipse cx="112" cy="183" rx="3" ry="2" fill="#88ccee" opacity="0.65"/></>}
          {phoneCheck&&<g transform="translate(172,192) rotate(18)"><rect x="0" y="0" width="20" height="30" rx="3.5" fill="#222"/><rect x="2" y="3" width="16" height="22" rx="1.5" fill="#5090d8" opacity="0.88"/><rect x="7" y="1" width="6" height="2" rx="1" fill="#444"/></g>}
        </g>

        <rect x="0"   y="232" width="280" height="13" rx="2" fill="url(#sc_dskT)"/>
        <rect x="0"   y="232" width="280" height="2"  rx="1" fill="#d8d0b8" opacity="0.8"/>
        <path d="M 0 245 L 280 245 L 280 320 L 0 320 Z" fill="url(#sc_dskF)"/>
        <line x1="0" y1="245" x2="280" y2="245" stroke="#989070" strokeWidth="1.2"/>
        <rect x="18" y="220" width="12" height="14" rx="2" fill="#b4ac9c"/>
        <ellipse cx="140" cy="175" rx="70" ry="50" fill={emotionColor} opacity="0.09"/>
        {showBreath&&<ellipse cx="140" cy="218" rx="48" ry="7" fill={emotionColor} opacity="0.2" style={{animation:"breatheRing 1.4s ease-in-out infinite"}}/>}
      </g>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   NOTEBOOK PANEL
═══════════════════════════════════════════════════════════ */
function NotebookPanel({ isOpen, onClose, epNum, preNotes, userNotes, onUserNotesChange, articleText, articleVisible }) {
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

/* ═══════════════════════════════════════════════════════════
   EPISODE HUB
═══════════════════════════════════════════════════════════ */
function EpisodeHub({ storyFlags, onPlay }) {
  const [vis, setVis] = useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),80);return()=>clearTimeout(t);},[]);

  return (
    <div style={{minHeight:"100vh",background:"#0e0c0a",fontFamily:"Georgia,serif",opacity:vis?1:0,transition:"opacity 0.9s ease",overflowY:"auto"}}>
      <div style={{padding:"52px 0 0",textAlign:"center"}}>
        <div style={{fontSize:8,letterSpacing:"0.6em",color:"#3a2e24",marginBottom:14}}>INTERN</div>
        <div style={{width:32,height:1,background:"#3a2e24",margin:"0 auto 20px"}}/>
        <div style={{fontSize:11,color:"#5a4a38",letterSpacing:"0.1em",marginBottom:6}}>레지던트 1년차</div>
        <div style={{fontSize:10,color:"#3a2e24",marginBottom:48}}>오늘의 외래 환자</div>
      </div>

      <div style={{maxWidth:640,margin:"0 auto",padding:"0 24px 80px",display:"flex",flexDirection:"column",gap:10}}>
        {EPISODE_LIST.map((ep,idx)=>{
          const done = storyFlags[ep.completedFlag];
          const tags = [];
          if(ep.id==="EP4") tags.push("재진");
          if(ep.id==="EP8") tags.push("재등장");
          if(ep.mechanics?.dual) tags.push("두 환자");
          if(ep.mechanics?.noPatient) tags.push("환자 없음");
          return (
            <div key={ep.id} onClick={()=>onPlay(ep.id)}
              style={{display:"flex",alignItems:"stretch",background:done?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.055)",border:`1px solid ${done?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.1)"}`,borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all 0.2s",opacity:vis?1:0,transitionDelay:`${0.2+idx*0.07}s`}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.09)";e.currentTarget.style.borderColor="rgba(255,255,255,0.18)";}}
              onMouseLeave={e=>{e.currentTarget.style.background=done?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.055)";e.currentTarget.style.borderColor=done?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.1)";}}>
              <div style={{width:56,background:"rgba(255,255,255,0.04)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRight:"1px solid rgba(255,255,255,0.06)",flexShrink:0,padding:"16px 0"}}>
                <div style={{fontSize:8,letterSpacing:"0.3em",color:"rgba(255,255,255,0.2)",marginBottom:4}}>EP</div>
                <div style={{fontSize:20,color:done?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.6)",fontWeight:"bold"}}>{String(idx+1).padStart(2,"0")}</div>
              </div>
              <div style={{flex:1,padding:"14px 18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontSize:15,fontWeight:"bold",color:done?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.8)"}}>{ep.name}</span>
                    {ep.age>0&&<span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>{ep.age}세 · {ep.sex}성</span>}
                    {tags.map(t=>(
                      <span key={t} style={{fontSize:9,letterSpacing:"0.08em",color:"#8a7050",background:"rgba(140,110,60,0.15)",border:"1px solid rgba(140,110,60,0.25)",borderRadius:4,padding:"2px 6px"}}>{t}</span>
                    ))}
                  </div>
                  <div style={{fontSize:9,color:done?"#78c878":"rgba(255,255,255,0.18)",letterSpacing:"0.1em",flexShrink:0,marginLeft:8}}>{done?"완료":"대기"}</div>
                </div>
                {ep.cc&&<div style={{fontSize:11,color:"#d06050",fontStyle:"italic",marginBottom:4}}>"{ep.cc}"</div>}
                <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",letterSpacing:"0.04em"}}>{ep.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INTRO SCREEN
═══════════════════════════════════════════════════════════ */
function IntroScreen({ ep, onStart }) {
  const [vis, setVis] = useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),100);return()=>clearTimeout(t);},[]);
  return (
    <div style={{minHeight:"100vh",background:"#16120e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",opacity:vis?1:0,transition:"opacity 1s ease"}}>
      <div style={{textAlign:"center",maxWidth:340,padding:"0 24px"}}>
        <div style={{fontSize:9,letterSpacing:"0.5em",color:"#4a3a2a",marginBottom:20}}>INTERN</div>
        <div style={{width:36,height:1,background:"#4a3a28",margin:"0 auto 24px"}}/>
        <div style={{fontSize:30,color:"#e0d4c0",marginBottom:8,letterSpacing:"0.06em"}}>{ep.titleNum}</div>
        <div style={{fontSize:14,color:"#a09070",marginBottom:36,fontStyle:"italic"}}>{ep.subtitle}</div>
        <div style={{fontSize:12,color:"#5a4a38",lineHeight:2.3,marginBottom:44}}>{ep.teaser}</div>
        <button onClick={onStart}
          style={{background:"none",border:"1px solid #4a3a28",color:"#8a7a60",padding:"13px 40px",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:11,letterSpacing:"0.22em",transition:"all 0.2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#9a8a70";e.currentTarget.style.color="#c0b090";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="#4a3a28";e.currentTarget.style.color="#8a7a60";}}>
          {ep.mechanics?.noPatient ? "들어가기" : "진료실로 들어가기"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RESULT SCREEN
═══════════════════════════════════════════════════════════ */
function ResultScreen({ ep, storyFlags, sessionFlags, onContinue }) {
  const [vis, setVis] = useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),120);return()=>clearTimeout(t);},[]);
  const { lines, footer } = ep.getResultLines(storyFlags, sessionFlags);
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"#16120e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",opacity:vis?1:0,transition:"opacity 1.2s ease",overflowY:"auto"}}>
      <div style={{textAlign:"center",maxWidth:300,padding:"60px 24px"}}>
        {lines.map((line,i)=>{
          const isQ=line.startsWith("\u201c"); const isB=line===" ";
          return <div key={i} style={{fontFamily:"Georgia,serif",fontSize:isQ?21:12.5,color:isQ?"#d4a060":"#847060",lineHeight:2.2,fontStyle:isQ?"italic":"normal",opacity:vis?1:0,transition:`opacity 0.9s ease ${0.4+i*0.18}s`,minHeight:isB?14:"auto"}}>{isB?"\u00a0":line}</div>;
        })}
        <div style={{marginTop:48,opacity:vis?1:0,transition:`opacity 0.8s ease ${0.4+lines.length*0.18+0.4}s`}}>
          {footer&&<div style={{fontFamily:"Georgia,serif",fontSize:10,color:"#3a2a1a",letterSpacing:"0.08em",marginBottom:28,fontStyle:"italic"}}>{footer}</div>}
          <button onClick={onContinue}
            style={{background:"none",border:"1px solid #3a2a18",color:"#6a5a40",padding:"10px 30px",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:11,letterSpacing:"0.14em",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#7a6a50";e.currentTarget.style.color="#a09070";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#3a2a18";e.currentTarget.style.color="#6a5a40";}}>
            {ep.id==="EP10"?"끝" : "다음 환자"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHARED GAME LOGIC HOOK
═══════════════════════════════════════════════════════════ */
function useGameLogic(systemPrompt) {
  const [emotion,       setEmotion]       = useState("neutral");
  const [talking,       setTalking]       = useState(false);
  const [history,       setHistory]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [rapportLevel,  setRapportLevel]  = useState(0);
  const [sessionFlags,  setSessionFlags]  = useState({});
  const apiMsgRef   = useRef([]);
  const rapportRef  = useRef(0);
  const talkTimer   = useRef(null);

  const send = useCallback(async(text, extraCtx="") => {
    if(!text.trim()||loading) return null;
    setLoading(true);
    setHistory(p=>[...p,{role:"doctor",text}]);
    const rapport = rapportRef.current;
    const ctx = `[rapport_level: ${rapport}]${extraCtx}\n의사: ${text}`;
    const newMsgs = [...apiMsgRef.current, {role:"user",content:ctx}];
    clearTimeout(talkTimer.current);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,system:systemPrompt,messages:newMsgs}),
      });
      if(!res.ok) throw new Error();
      const data = await res.json();
      const raw = data.content?.[0]?.text??"";
      let parsed={emotion:"neutral",text:"...",rapport_change:0,flag_trigger:"none"};
      try{const m=raw.match(/\{[\s\S]*\}/);parsed=JSON.parse(m?m[0]:raw);}catch{}
      const nr=Math.max(0,Math.min(5,rapport+(parsed.rapport_change||0)));
      rapportRef.current=nr; setRapportLevel(nr);
      setEmotion(parsed.emotion||"neutral");
      const flag=parsed.flag_trigger;
      if(flag&&flag!=="none") setSessionFlags(p=>({...p,[flag]:true}));
      apiMsgRef.current=[...newMsgs,{role:"assistant",content:parsed.text}];
      setTalking(true);
      setHistory(p=>[...p,{role:"patient",text:parsed.text,emotion:parsed.emotion,speaker:parsed.speaker,hint:parsed.hint}]);
      talkTimer.current=setTimeout(()=>setTalking(false),2200);
      return parsed;
    } catch {
      setHistory(p=>[...p,{role:"system",text:"연결에 문제가 생겼어요."}]);
      return null;
    } finally { setLoading(false); }
  },[loading, systemPrompt]);

  return { emotion, setEmotion, talking, setTalking, history, setHistory, loading, rapportLevel, setRapportLevel, sessionFlags, setSessionFlags, send, rapportRef, talkTimer };
}

/* ═══════════════════════════════════════════════════════════
   STANDARD GAME SCREEN
═══════════════════════════════════════════════════════════ */
function GameScreen({ ep, storyFlags, onEnd }) {
  const systemPrompt = ep.getSystemPrompt(storyFlags);
  const logic = useGameLogic(systemPrompt);
  const { emotion, talking, history, loading, rapportLevel, sessionFlags, setSessionFlags, send } = logic;

  const [phoneCheck,       setPhoneCheck]       = useState(ep.initialPhoneCheck||false);
  const [translatorDirect, setTranslatorDirect] = useState(false);
  const [breathingCalm,    setBreathingCalm]    = useState(false);
  const [articleVisible,   setArticleVisible]   = useState(false);
  const [notebookOpen,     setNotebookOpen]     = useState(false);
  const [userNotes,        setUserNotes]        = useState("");
  const [showLog,          setShowLog]          = useState(false);
  const [exchangeCount,    setExchangeCount]    = useState(0);
  const [input,            setInput]            = useState("");

  const inputRef = useRef(null);
  const logRef   = useRef(null);

  useEffect(()=>{
    logic.setEmotion(ep.initialEmotion||"neutral");
    setTimeout(()=>{
      logic.setTalking(true);
      logic.setHistory([{role:"patient",text:ep.cc,emotion:ep.initialEmotion}]);
      logic.talkTimer.current=setTimeout(()=>logic.setTalking(false),2000);
    },600);
  },[]);

  useEffect(()=>{if(showLog&&logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},[history,showLog,loading]);

  const handleSend = useCallback(async(text)=>{
    if(!text.trim()||loading) return;
    setInput(""); setExchangeCount(p=>p+1); setShowLog(false);
    let ctx="";
    if(ep.mechanics?.translator) ctx+=`\n[translator_mode: ${translatorDirect?"direct":"daughter"}]`;
    if(ep.mechanics?.breathing)  ctx+=`\n[breathing_calm: ${breathingCalm}]`;
    const parsed = await send(text, ctx);
    if(parsed?.phone_check!==undefined) setPhoneCheck(!!parsed.phone_check);
    if(parsed?.breathing_calm!==undefined) setBreathingCalm(!!parsed.breathing_calm);
    if(parsed?.flag_trigger==="reversal1") setTranslatorDirect(true);
    if(parsed?.flag_trigger==="article_hint") setArticleVisible(true);
    setTimeout(()=>inputRef.current?.focus(),50);
  },[loading, translatorDirect, breathingCalm, send]);

  const emotionMeta = EMOTION_META[emotion]||EMOTION_META.neutral;
  const canEnd      = exchangeCount >= ep.minTurns;
  const preNotes    = typeof ep.getNotebookPre==="function" ? ep.getNotebookPre(storyFlags) : ep.notebookPre;
  const isAbnormal  = (k,v) => (k==="BP"&&parseInt(v)>130)||(k==="HR"&&parseInt(v)>90)||(k==="SpO2"&&parseInt(v)<94);

  const visibleMsgs = (()=>{
    const msgs=history.filter(m=>m.role!=="system");
    if(!msgs.length) return [];
    const last=msgs[msgs.length-1];
    if(last.role==="patient"&&msgs.length>=2&&msgs[msgs.length-2].role==="doctor") return [msgs[msgs.length-2],last];
    return [last];
  })();

  const getBubble = (msg) => {
    if(msg.role==="doctor") return {bg:"rgba(52,72,44,0.92)",color:"#ccdac4"};
    if(msg.speaker==="mother") return {bg:"rgba(60,48,75,0.92)",color:"rgba(220,210,240,0.9)"};
    return {bg:"rgba(245,238,218,0.95)",color:"#1a1008"};
  };

  return (
    <div style={{height:"100vh",background:"#0e0c0a",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",inset:0,zIndex:0}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,#2a2520 0%,#1a1612 45%,#12100e 100%)"}}/>
        <div style={{position:"absolute",bottom:"195px",left:"50%",transform:"translateX(-50%)",width:"min(440px,78vw)",aspectRatio:"280/320"}}>
          <ClinicScene emotion={emotion} talking={talking} ep={ep} emotionColor={emotionMeta.color} phoneCheck={phoneCheck} breathingCalm={breathingCalm}/>
        </div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:"310px",background:"linear-gradient(to bottom,transparent 0%,rgba(14,12,10,0.8) 38%,rgba(14,12,10,0.97) 68%,#0e0c0a 100%)"}}/>
      </div>

      {/* Patient Card */}
      <div style={{position:"absolute",top:16,left:16,zIndex:20,background:"rgba(255,255,255,0.09)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.13)",borderRadius:14,padding:"13px 15px",minWidth:175,boxShadow:"0 4px 28px rgba(0,0,0,0.45)",animation:"cardIn 0.4s ease both"}}>
        <div style={{fontSize:8,letterSpacing:"0.35em",color:"rgba(255,255,255,0.3)",marginBottom:10,fontWeight:700}}>PATIENT</div>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${ep.skin}cc,${ep.skin}77)`,border:"1.5px solid rgba(255,255,255,0.15)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{ep.sex==="여"?"👩":"🧑"}</div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"rgba(255,255,255,0.88)",lineHeight:1.2}}>{ep.name}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.38)",marginTop:2}}>{ep.age}세 · {ep.sex}성</div>
          </div>
        </div>
        <div style={{fontSize:11,color:"#f08070",background:"rgba(240,100,80,0.12)",borderRadius:8,padding:"5px 9px",fontStyle:"italic",lineHeight:1.6,marginBottom:10,border:"1px solid rgba(220,80,60,0.2)"}}>"{ep.cc}"</div>
        <RapportBar level={rapportLevel}/>
        {phoneCheck&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:5,background:"rgba(255,200,60,0.12)",borderRadius:8,padding:"4px 9px",border:"1px solid rgba(200,160,40,0.2)"}}><span style={{fontSize:12,animation:"phoneWiggle 0.8s ease-in-out infinite"}}>📱</span><span style={{fontSize:10,color:"rgba(200,160,60,0.85)"}}>핸드폰 확인 중</span></div>}
        {ep.mechanics?.translator&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:5,background:translatorDirect?"rgba(130,90,160,0.15)":"rgba(60,140,120,0.12)",borderRadius:8,padding:"4px 9px",border:`1px solid ${translatorDirect?"rgba(130,90,160,0.3)":"rgba(60,140,120,0.25)"}`}}><span style={{fontSize:10}}>{translatorDirect?"💬":"🌐"}</span><span style={{fontSize:9,color:translatorDirect?"rgba(180,140,210,0.9)":"rgba(100,180,160,0.85)"}}>{translatorDirect?"직접 대화 중":"이수진 (딸) 통역"}</span></div>}
      </div>

      {/* Status Card */}
      <div style={{position:"absolute",top:16,right:16,zIndex:20,background:"rgba(255,255,255,0.09)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.13)",borderRadius:14,padding:"13px 15px",minWidth:150,boxShadow:"0 4px 28px rgba(0,0,0,0.45)",animation:"cardIn 0.4s ease both"}}>
        <div style={{fontSize:8,letterSpacing:"0.35em",color:"rgba(255,255,255,0.3)",marginBottom:10,fontWeight:700}}>STATUS</div>
        <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
          {Object.entries(ep.vitals).map(([k,v])=>{
            const abn=isAbnormal(k,v);
            return <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 9px",borderRadius:8,background:abn?"rgba(220,60,40,0.13)":"rgba(255,255,255,0.06)",border:`1px solid ${abn?"rgba(220,80,60,0.3)":"rgba(255,255,255,0.09)"}`}}><span style={{fontSize:10,color:"rgba(255,255,255,0.38)",fontWeight:600}}>{k}</span><span style={{fontSize:12,color:abn?"#f07060":"rgba(255,255,255,0.8)",fontWeight:abn?800:600}}>{v}</span></div>;
          })}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7,background:`${emotionMeta.color}20`,border:`1px solid ${emotionMeta.color}40`,borderRadius:20,padding:"5px 11px"}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:emotionMeta.color,display:"block",flexShrink:0,animation:"pulse2 2s infinite"}}/>
          <span style={{fontSize:11,color:emotionMeta.color,fontWeight:700}}>{emotionMeta.label}</span>
        </div>
      </div>

      {/* Name tag */}
      <div style={{position:"absolute",bottom:"208px",left:0,right:0,zIndex:5,textAlign:"center",pointerEvents:"none"}}>
        <span style={{fontFamily:"Georgia,serif",fontSize:11,color:"rgba(255,255,255,0.4)",letterSpacing:"0.18em"}}>{ep.name}</span>
      </div>

      {/* Log popup */}
      {showLog&&(
        <div ref={logRef} style={{position:"absolute",bottom:"196px",left:"50%",transform:"translateX(-50%)",width:"min(560px,88vw)",maxHeight:"42vh",overflowY:"auto",zIndex:25,background:"rgba(6,5,4,0.94)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"16px 20px",display:"flex",flexDirection:"column",gap:10}}>
          {history.map((msg,i)=>{
            if(msg.role==="system") return <div key={i} style={{textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.2)"}}>{msg.text}</div>;
            const isDoc=msg.role==="doctor"; const bc=getBubble(msg);
            return (
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:isDoc?"flex-end":"flex-start"}}>
                {!isDoc&&msg.speaker&&<div style={{fontSize:9,color:"rgba(255,255,255,0.25)",marginLeft:28,marginBottom:2}}>{msg.speaker==="mother"?"어머니 (직접)":"이수진 (통역)"}</div>}
                <div style={{display:"flex",justifyContent:isDoc?"flex-end":"flex-start",gap:8,alignItems:"flex-end"}}>
                  {!isDoc&&<div style={{width:20,height:20,borderRadius:"50%",background:EMOTION_META[msg.emotion]?.color||emotionMeta.color,flexShrink:0,opacity:0.55}}/>}
                  <div style={{maxWidth:"74%",padding:"8px 12px",borderRadius:isDoc?"11px 11px 2px 11px":"11px 11px 11px 2px",background:bc.bg,color:bc.color,fontSize:12,lineHeight:1.7}}>
                    {msg.text}
                    {msg.hint&&<div style={{fontStyle:"italic",fontSize:10,color:"rgba(200,185,160,0.45)",marginTop:5}}>{msg.hint}</div>}
                  </div>
                </div>
              </div>
            );
          })}
          {loading&&<div style={{display:"flex",gap:8,alignItems:"flex-end"}}><div style={{width:20,height:20,borderRadius:"50%",background:emotionMeta.color,opacity:0.55,flexShrink:0}}/><div style={{padding:"9px 13px",background:"rgba(255,255,255,0.08)",borderRadius:"11px 11px 11px 2px",display:"flex",gap:4}}>{[0,1,2].map(j=><div key={j} style={{width:4,height:4,borderRadius:"50%",background:"rgba(255,255,255,0.35)",animation:`ep_b 1s ease ${j*0.2}s infinite`}}/>)}</div></div>}
        </div>
      )}

      {/* Dialog + Input */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:10}}>
        {!showLog&&(
          <div style={{padding:"0 clamp(16px,6vw,100px) 10px",display:"flex",flexDirection:"column",gap:10,minHeight:90,justifyContent:"flex-end"}}>
            {visibleMsgs.map((msg,i)=>{
              const isDoc=msg.role==="doctor"; const bc=getBubble(msg);
              return (
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:isDoc?"flex-end":"flex-start"}}>
                  {!isDoc&&msg.speaker&&<div style={{fontSize:9,color:"rgba(255,255,255,0.25)",marginLeft:38,marginBottom:2}}>{msg.speaker==="mother"?"어머니 (직접)":"이수진 (통역)"}</div>}
                  <div style={{display:"flex",justifyContent:isDoc?"flex-end":"flex-start",alignItems:"flex-end",gap:10}}>
                    {!isDoc&&<div style={{width:28,height:28,borderRadius:"50%",background:EMOTION_META[msg.emotion]?.color||emotionMeta.color,flexShrink:0,opacity:0.65,boxShadow:`0 0 10px ${EMOTION_META[msg.emotion]?.color||emotionMeta.color}55`}}/>}
                    <div style={{maxWidth:"72%",padding:"12px 17px",borderRadius:isDoc?"15px 15px 4px 15px":"15px 15px 15px 4px",background:bc.bg,color:bc.color,fontSize:13.5,lineHeight:1.8,boxShadow:"0 3px 18px rgba(0,0,0,0.45)",backdropFilter:"blur(8px)"}}>
                      {msg.text}
                      {msg.hint&&<div style={{fontStyle:"italic",fontSize:11,color:"rgba(200,185,160,0.4)",marginTop:5}}>{msg.hint}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
            {loading&&<div style={{display:"flex",alignItems:"flex-end",gap:10}}><div style={{width:28,height:28,borderRadius:"50%",background:emotionMeta.color,opacity:0.65,flexShrink:0}}/><div style={{padding:"12px 17px",background:"rgba(245,238,218,0.95)",borderRadius:"15px 15px 15px 4px",display:"flex",gap:6,alignItems:"center"}}>{[0,1,2].map(j=><div key={j} style={{width:5,height:5,borderRadius:"50%",background:"#a09060",animation:`ep_b 1s ease ${j*0.22}s infinite`}}/>)}</div></div>}
          </div>
        )}

        <div style={{padding:"10px 20px 18px",background:"rgba(10,8,6,0.97)",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",gap:10,alignItems:"flex-end"}}>
          <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
            <button onClick={()=>setNotebookOpen(o=>!o)} style={{background:notebookOpen?"rgba(200,175,80,0.22)":"rgba(255,255,255,0.06)",border:`1px solid ${notebookOpen?"rgba(200,175,80,0.4)":"rgba(255,255,255,0.1)"}`,color:notebookOpen?"rgba(210,185,90,0.9)":"rgba(255,255,255,0.4)",padding:"7px 11px",cursor:"pointer",fontSize:11,fontFamily:"inherit",borderRadius:8}}>📓</button>
            <button onClick={()=>setShowLog(v=>!v)} style={{background:showLog?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",padding:"7px 11px",cursor:"pointer",fontSize:11,fontFamily:"inherit",borderRadius:8}}>📋</button>
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
            {ep.mechanics?.translator&&sessionFlags.daughter_suspicious&&(
              <button onClick={()=>setTranslatorDirect(d=>!d)} style={{alignSelf:"flex-start",background:translatorDirect?"rgba(130,90,160,0.2)":"rgba(60,140,120,0.15)",border:`1px solid ${translatorDirect?"rgba(130,90,160,0.4)":"rgba(60,140,120,0.3)"}`,color:translatorDirect?"rgba(180,140,210,0.9)":"rgba(100,180,160,0.9)",padding:"4px 10px",borderRadius:20,cursor:"pointer",fontSize:10,fontFamily:"inherit"}}>
                {translatorDirect?"⇄ 통역 통해서":"💬 어머니께 직접"}
              </button>
            )}
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend(input);}}}
              placeholder="무슨 말을 할까요...   ↵ Enter" disabled={loading} rows={2}
              style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:10,padding:"11px 14px",fontSize:13,fontFamily:"system-ui,sans-serif",lineHeight:1.65,color:"rgba(255,255,255,0.82)",outline:"none",resize:"none",caretColor:"#c0b070"}}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            <button onClick={()=>handleSend(input)} disabled={loading||!input.trim()} style={{background:(loading||!input.trim())?"rgba(255,255,255,0.06)":"rgba(64,82,52,0.9)",border:"none",color:(loading||!input.trim())?"rgba(255,255,255,0.2)":"#ccdac4",padding:"11px 17px",borderRadius:8,cursor:(loading||!input.trim())?"not-allowed":"pointer",fontSize:12,fontFamily:"inherit"}}>전송</button>
            {canEnd&&<button onClick={()=>onEnd(sessionFlags)} style={{background:"rgba(160,130,60,0.18)",border:"1px solid rgba(170,140,60,0.38)",color:"rgba(190,160,75,0.88)",padding:"11px 17px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(160,130,60,0.32)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(160,130,60,0.18)";}}>마치기</button>}
          </div>
        </div>
      </div>

      <NotebookPanel isOpen={notebookOpen} onClose={()=>setNotebookOpen(false)} epNum={ep.titleNum} preNotes={preNotes} userNotes={userNotes} onUserNotesChange={setUserNotes} articleText={ep.articleText} articleVisible={articleVisible}/>
      <style>{`@keyframes ep_b{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-5px);opacity:1}}@keyframes pulse2{0%,100%{opacity:0.7;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}@keyframes phoneWiggle{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-12deg)}75%{transform:rotate(12deg)}}@keyframes cardIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}@keyframes breatheRing{0%,100%{transform:scaleX(1);opacity:0.2}50%{transform:scaleX(1.12);opacity:0.35}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DUAL GAME SCREEN (EP7)
═══════════════════════════════════════════════════════════ */
function DualGameScreen({ ep, storyFlags, onEnd }) {
  const logicA = useGameLogic(EP7A_PROMPT);
  const logicB = useGameLogic(EP7B_PROMPT);
  const [focused,     setFocused]     = useState("A");
  const [totalTurns,  setTotalTurns]  = useState(0);
  const [turnsA,      setTurnsA]      = useState(0);
  const [turnsB,      setTurnsB]      = useState(0);
  const [input,       setInput]       = useState("");
  const [notebookOpen,setNotebookOpen]= useState(false);
  const [userNotes,   setUserNotes]   = useState("");
  const [showLog,     setShowLog]     = useState(false);
  const inputRef = useRef(null);
  const MAX_TURNS = 12;

  const activeLogic = focused==="A" ? logicA : logicB;
  const activePat   = focused==="A" ? ep.patientA : ep.patientB;
  const emotionMeta = EMOTION_META[activeLogic.emotion]||EMOTION_META.neutral;

  useEffect(()=>{
    setTimeout(()=>{
      logicA.setEmotion(ep.patientA.initialEmotion);
      logicA.setTalking(true);
      logicA.setHistory([{role:"patient",text:ep.patientA.cc,emotion:ep.patientA.initialEmotion}]);
      setTimeout(()=>logicA.setTalking(false),2000);
      logicB.setEmotion(ep.patientB.initialEmotion);
      logicB.setHistory([{role:"patient",text:ep.patientB.cc,emotion:ep.patientB.initialEmotion}]);
    },600);
  },[]);

  const handleSend = useCallback(async(text)=>{
    if(!text.trim()||activeLogic.loading||totalTurns>=MAX_TURNS) return;
    setInput(""); setShowLog(false);
    setTotalTurns(p=>p+1);
    if(focused==="A") setTurnsA(p=>p+1); else setTurnsB(p=>p+1);
    await activeLogic.send(text);
    setTimeout(()=>inputRef.current?.focus(),50);
  },[activeLogic, focused, totalTurns]);

  const isAbnormal = (k,v)=>(k==="BP"&&parseInt(v)>130)||(k==="HR"&&parseInt(v)>90)||(k==="SpO2"&&parseInt(v)<94);

  const allDone = totalTurns >= MAX_TURNS;

  const visibleMsgs = (()=>{
    const msgs=activeLogic.history.filter(m=>m.role!=="system");
    if(!msgs.length) return [];
    const last=msgs[msgs.length-1];
    if(last.role==="patient"&&msgs.length>=2&&msgs[msgs.length-2].role==="doctor") return [msgs[msgs.length-2],last];
    return [last];
  })();

  const miniCard = (pat, logic, side, isActive) => {
    const em = EMOTION_META[logic.emotion]||EMOTION_META.neutral;
    return (
      <div onClick={()=>setFocused(side)}
        style={{flex:1,padding:"10px 12px",background:isActive?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.04)",border:`1px solid ${isActive?"rgba(255,255,255,0.22)":"rgba(255,255,255,0.07)"}`,borderRadius:10,cursor:isActive?"default":"pointer",transition:"all 0.2s",position:"relative"}}>
        {isActive&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:em.color,borderRadius:"10px 10px 0 0"}}/>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
          <div>
            <span style={{fontSize:12,fontWeight:700,color:isActive?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.4)"}}>{pat.name}</span>
            <span style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginLeft:6}}>{pat.age}세</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4,background:`${em.color}20`,borderRadius:12,padding:"2px 7px"}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:em.color,display:"block",animation:"pulse2 2s infinite"}}/>
            <span style={{fontSize:9,color:em.color}}>{em.label}</span>
          </div>
        </div>
        <div style={{fontSize:10,color:"#d06050",fontStyle:"italic",marginBottom:4}}>"{pat.cc.slice(0,30)}{pat.cc.length>30?"...":""}"</div>
        <div style={{display:"flex",gap:3}}>
          {Array.from({length:5}).map((_,i)=><div key={i} style={{flex:1,height:2,borderRadius:1,background:i<logic.rapportLevel?(logic.rapportLevel>=3?"#78c878":"#e2a84b"):"rgba(255,255,255,0.1)"}}/>)}
        </div>
        <div style={{marginTop:6,display:"flex",gap:3}}>
          {Object.entries(pat.vitals).map(([k,v])=>{
            const abn=isAbnormal(k,v);
            return <div key={k} style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:abn?"rgba(220,60,40,0.2)":"rgba(255,255,255,0.06)",color:abn?"#f07060":"rgba(255,255,255,0.5)"}}>{k}:{v}</div>;
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{height:"100vh",background:"#0e0c0a",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
      {/* BG */}
      <div style={{position:"absolute",inset:0,zIndex:0}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,#2a2520 0%,#1a1612 45%,#12100e 100%)"}}/>
        <div style={{position:"absolute",bottom:"195px",left:"50%",transform:"translateX(-50%)",width:"min(440px,78vw)",aspectRatio:"280/320"}}>
          <ClinicScene emotion={activeLogic.emotion} talking={activeLogic.talking} ep={activePat} emotionColor={emotionMeta.color} phoneCheck={false} breathingCalm={false}/>
        </div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:"310px",background:"linear-gradient(to bottom,transparent 0%,rgba(14,12,10,0.8) 38%,rgba(14,12,10,0.97) 68%,#0e0c0a 100%)"}}/>
      </div>

      {/* Top: dual cards + turn bar */}
      <div style={{position:"absolute",top:12,left:12,right:12,zIndex:20,display:"flex",flexDirection:"column",gap:6}}>
        <div style={{display:"flex",gap:8}}>{miniCard(ep.patientA,logicA,"A",focused==="A")}{miniCard(ep.patientB,logicB,"B",focused==="B")}</div>
        {/* Turn budget bar */}
        <div style={{background:"rgba(255,255,255,0.05)",borderRadius:6,height:4,overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{width:`${(totalTurns/MAX_TURNS)*100}%`,height:"100%",background:totalTurns>=MAX_TURNS?"#c05050":totalTurns>=8?"#d4914a":"#7aaa96",transition:"width 0.3s ease,background 0.3s"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"0 2px"}}>
          <span style={{fontSize:9,color:"rgba(255,255,255,0.2)"}}>이혜란 {turnsA}턴 / 강도현 {turnsB}턴</span>
          <span style={{fontSize:9,color:totalTurns>=MAX_TURNS?"#c05050":"rgba(255,255,255,0.2)"}}>남은 시간 {MAX_TURNS-totalTurns}턴</span>
        </div>
      </div>

      {/* Name */}
      <div style={{position:"absolute",bottom:"208px",left:0,right:0,zIndex:5,textAlign:"center",pointerEvents:"none"}}>
        <span style={{fontFamily:"Georgia,serif",fontSize:11,color:"rgba(255,255,255,0.4)",letterSpacing:"0.18em"}}>{activePat.name}</span>
      </div>

      {/* Dialog */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:10}}>
        <div style={{padding:"0 clamp(16px,6vw,80px) 10px",display:"flex",flexDirection:"column",gap:10,minHeight:90,justifyContent:"flex-end"}}>
          {visibleMsgs.map((msg,i)=>{
            const isDoc=msg.role==="doctor";
            return (
              <div key={i} style={{display:"flex",justifyContent:isDoc?"flex-end":"flex-start",alignItems:"flex-end",gap:10}}>
                {!isDoc&&<div style={{width:28,height:28,borderRadius:"50%",background:EMOTION_META[msg.emotion]?.color||emotionMeta.color,flexShrink:0,opacity:0.65}}/>}
                <div style={{maxWidth:"72%",padding:"12px 17px",borderRadius:isDoc?"15px 15px 4px 15px":"15px 15px 15px 4px",background:isDoc?"rgba(52,72,44,0.92)":"rgba(245,238,218,0.95)",color:isDoc?"#ccdac4":"#1a1008",fontSize:13.5,lineHeight:1.8,boxShadow:"0 3px 18px rgba(0,0,0,0.45)",backdropFilter:"blur(8px)"}}>{msg.text}</div>
              </div>
            );
          })}
          {activeLogic.loading&&<div style={{display:"flex",alignItems:"flex-end",gap:10}}><div style={{width:28,height:28,borderRadius:"50%",background:emotionMeta.color,opacity:0.65,flexShrink:0}}/><div style={{padding:"12px 17px",background:"rgba(245,238,218,0.95)",borderRadius:"15px 15px 15px 4px",display:"flex",gap:6}}>{[0,1,2].map(j=><div key={j} style={{width:5,height:5,borderRadius:"50%",background:"#a09060",animation:`ep_b 1s ease ${j*0.22}s infinite`}}/>)}</div></div>}
        </div>

        {allDone&&(
          <div style={{padding:"8px 20px 10px",background:"rgba(20,15,10,0.9)",borderTop:"1px solid rgba(200,130,40,0.2)",display:"flex",justifyContent:"center"}}>
            <button onClick={()=>onEnd({turnsA,turnsB,rapportA:logicA.rapportLevel,rapportB:logicB.rapportLevel})}
              style={{background:"rgba(160,130,60,0.18)",border:"1px solid rgba(170,140,60,0.38)",color:"rgba(190,160,75,0.88)",padding:"10px 28px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"Georgia,serif",letterSpacing:"0.1em"}}>
              외래 종료
            </button>
          </div>
        )}

        {!allDone&&(
          <div style={{padding:"10px 20px 18px",background:"rgba(10,8,6,0.97)",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",gap:10,alignItems:"flex-end"}}>
            <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
              <button onClick={()=>setNotebookOpen(o=>!o)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",padding:"7px 11px",cursor:"pointer",fontSize:11,fontFamily:"inherit",borderRadius:8}}>📓</button>
              <button onClick={()=>setShowLog(v=>!v)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",padding:"7px 11px",cursor:"pointer",fontSize:11,fontFamily:"inherit",borderRadius:8}}>📋</button>
            </div>
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend(input);}}}
              placeholder={`${activePat.name}에게...   ↵ Enter`} disabled={activeLogic.loading} rows={2}
              style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:10,padding:"11px 14px",fontSize:13,fontFamily:"system-ui,sans-serif",lineHeight:1.65,color:"rgba(255,255,255,0.82)",outline:"none",resize:"none",caretColor:"#c0b070"}}/>
            <button onClick={()=>handleSend(input)} disabled={activeLogic.loading||!input.trim()} style={{background:(activeLogic.loading||!input.trim())?"rgba(255,255,255,0.06)":"rgba(64,82,52,0.9)",border:"none",color:(activeLogic.loading||!input.trim())?"rgba(255,255,255,0.2)":"#ccdac4",padding:"11px 17px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>전송</button>
          </div>
        )}
      </div>

      <NotebookPanel isOpen={notebookOpen} onClose={()=>setNotebookOpen(false)} epNum={ep.titleNum} preNotes={ep.notebookPre} userNotes={userNotes} onUserNotesChange={setUserNotes}/>
      <style>{`@keyframes ep_b{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-5px);opacity:1}}@keyframes pulse2{0%,100%{opacity:0.7;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}@keyframes cardIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EP10 SCREEN (환자 없음)
═══════════════════════════════════════════════════════════ */
function EP10Screen({ ep, storyFlags, onEnd }) {
  const [choice,      setChoice]      = useState(null); // null | "colleague" | "professor" | "alone"
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [turnCount,   setTurnCount]   = useState(0);
  const [sessionFlags,setSessionFlags]= useState({});
  const [notebookOpen,setNotebookOpen]= useState(false);
  const [userNotes,   setUserNotes]   = useState("");
  const [vis,         setVis]         = useState(false);
  const apiMsgRef  = useRef([]);
  const inputRef   = useRef(null);
  const logRef     = useRef(null);

  useEffect(()=>{const t=setTimeout(()=>setVis(true),80);return()=>clearTimeout(t);},[]);
  useEffect(()=>{if(logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},[messages,loading]);

  const systemPrompt = choice==="colleague" ? EP10_COLLEAGUE_PROMPT : choice==="professor" ? EP10_PROFESSOR_PROMPT : "";
  const choiceName = choice==="colleague"?"박세진 (동기)":choice==="professor"?"김철수 교수님":"(혼자)";

  const openingLine = choice==="colleague"
    ? "어, 왔어? 나 지금 진짜 녹초야. 앉아."
    : choice==="professor"
    ? "(논문에서 눈을 들며) 응, 뭐야. 들어와."
    : null;

  const handleChoose = (c) => {
    setChoice(c);
    if(c==="alone") return;
    const opening = c==="colleague" ? "어, 왔어? 나 지금 진짜 녹초야. 앉아." : "(논문에서 눈을 들며) 응, 뭐야. 들어와.";
    setTimeout(()=>{ setMessages([{role:"other",text:opening}]); },400);
  };

  const handleSend = async(text) => {
    if(!text.trim()||loading) return;
    setInput(""); setLoading(true); setTurnCount(p=>p+1);
    setMessages(p=>[...p,{role:"self",text}]);
    const newMsgs=[...apiMsgRef.current,{role:"user",content:`[turn: ${turnCount+1}]\n나: ${text}`}];
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:350,system:systemPrompt,messages:newMsgs})});
      if(!res.ok) throw new Error();
      const data=await res.json();
      const raw=data.content?.[0]?.text??"";
      let parsed={emotion:"neutral",text:"...",flag_trigger:"none"};
      try{const m=raw.match(/\{[\s\S]*\}/);parsed=JSON.parse(m?m[0]:raw);}catch{}
      if(parsed.flag_trigger&&parsed.flag_trigger!=="none") setSessionFlags(p=>({...p,[parsed.flag_trigger]:true}));
      apiMsgRef.current=[...newMsgs,{role:"assistant",content:parsed.text}];
      setMessages(p=>[...p,{role:"other",text:parsed.text}]);
    }catch{
      setMessages(p=>[...p,{role:"system",text:"연결에 문제가 생겼어요."}]);
    }finally{
      setLoading(false);
      setTimeout(()=>inputRef.current?.focus(),50);
    }
  };

  const canEnd = turnCount>=ep.minTurns || choice==="alone";

  // Before choice
  if(!choice) return (
    <div style={{minHeight:"100vh",background:"#0e0c0a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",opacity:vis?1:0,transition:"opacity 1s ease"}}>
      <div style={{textAlign:"center",maxWidth:420,padding:"0 24px"}}>
        <div style={{fontSize:9,letterSpacing:"0.5em",color:"#4a3a2a",marginBottom:20}}>INTERN</div>
        <div style={{width:36,height:1,background:"#4a3a28",margin:"0 auto 24px"}}/>
        <div style={{fontSize:30,color:"#e0d4c0",marginBottom:8,letterSpacing:"0.06em"}}>EP.10</div>
        <div style={{fontSize:14,color:"#a09070",marginBottom:10,fontStyle:"italic"}}>금요일 저녁</div>
        <div style={{fontSize:11,color:"#5a4a38",lineHeight:2.4,marginBottom:48}}>1년차 마지막 주.<br/>오늘 외래가 끝났다.<br/>어디로 갈까.</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[
            {key:"colleague",label:"동기 찾아가기",sub:"박세진, 라운지에 있을 것 같다"},
            {key:"professor",label:"교수님 연구실",sub:"마지막으로 인사를 드리고 싶다"},
            {key:"alone",label:"그냥 여기 있기",sub:"잠깐 혼자 있어도 괜찮을 것 같다"},
          ].map(opt=>(
            <button key={opt.key} onClick={()=>handleChoose(opt.key)}
              style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"14px 20px",cursor:"pointer",fontFamily:"Georgia,serif",transition:"all 0.2s",textAlign:"left"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.09)";e.currentTarget.style.borderColor="rgba(255,255,255,0.18)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";}}>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.75)",marginBottom:3}}>{opt.label}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.28)"}}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Alone
  if(choice==="alone") {
    const completedCount = Object.keys(storyFlags).filter(k=>k.endsWith("_completed")&&storyFlags[k]).length;
    const openedCount = [storyFlags.EP1_jinsu_opened,storyFlags.EP2_reversal2||storyFlags.EP2_reversal1,storyFlags.EP3_real_opened,storyFlags.EP5_real_opened,storyFlags.EP8_grief_opened].filter(Boolean).length;
    const reflections = [
      "외래가 끝났다.",
      " ",
      completedCount>=8 ? "1년 동안 많은 사람을 만났다." : "몇 명을 만났다.",
      " ",
      openedCount>=3 ? "몇 번은, 들을 수 있었던 것 같다." : openedCount>=1 ? "한 번은, 무언가를 들었던 것 같다." : "그냥 지나간 것들이 많다.",
      " ",
      "창밖이 어두워졌다.",
      " ",
      "내년에도 이 창문은 똑같을 것 같다.",
    ];
    return (
      <div style={{minHeight:"100vh",background:"#0e0c0a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif"}}>
        <div style={{textAlign:"center",maxWidth:280,padding:"0 24px"}}>
          {reflections.map((line,i)=>(
            <div key={i} style={{fontSize:12,color:"#847060",lineHeight:2.2,minHeight:line===" "?14:"auto",opacity:vis?1:0,transition:`opacity 0.9s ease ${0.3+i*0.25}s`}}>{line===" "?"\u00a0":line}</div>
          ))}
          <div style={{marginTop:48,opacity:vis?1:0,transition:`opacity 0.8s ease ${0.3+reflections.length*0.25+0.4}s`}}>
            <button onClick={()=>onEnd({alone_reflection:true})}
              style={{background:"none",border:"1px solid #3a2a18",color:"#6a5a40",padding:"10px 30px",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:11,letterSpacing:"0.14em"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#7a6a50";e.currentTarget.style.color="#a09070";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#3a2a18";e.currentTarget.style.color="#6a5a40";}}>
              일어나기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation
  return (
    <div style={{height:"100vh",background:"#0e0c0a",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Ambient room bg */}
      <div style={{flex:1,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:choice==="colleague"?"linear-gradient(170deg,#1a1820 0%,#0e0c0a 100%)":"linear-gradient(170deg,#18201a 0%,#0e0c0a 100%)"}}/>
        {/* Ambient light glow */}
        <div style={{position:"absolute",top:"20%",left:"50%",transform:"translateX(-50%)",width:300,height:200,borderRadius:"50%",background:choice==="colleague"?"rgba(80,70,120,0.08)":"rgba(60,90,70,0.08)",filter:"blur(40px)"}}/>
        {/* Location label */}
        <div style={{position:"absolute",top:24,left:0,right:0,textAlign:"center"}}>
          <span style={{fontFamily:"Georgia,serif",fontSize:9,letterSpacing:"0.4em",color:"rgba(255,255,255,0.18)"}}>{choice==="colleague"?"레지던트 라운지":"교수 연구실"}</span>
        </div>

        {/* Message log */}
        <div ref={logRef} style={{position:"absolute",inset:0,overflowY:"auto",padding:"60px clamp(20px,8vw,120px) 20px",display:"flex",flexDirection:"column",gap:16,justifyContent:"flex-end"}}>
          {messages.map((msg,i)=>{
            if(msg.role==="system") return <div key={i} style={{textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.2)"}}>{msg.text}</div>;
            const isSelf=msg.role==="self";
            return (
              <div key={i} style={{display:"flex",justifyContent:isSelf?"flex-end":"flex-start",alignItems:"flex-end",gap:10}}>
                {!isSelf&&<div style={{width:32,height:32,borderRadius:"50%",background:choice==="colleague"?"rgba(80,70,120,0.6)":"rgba(60,90,70,0.6)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{choice==="colleague"?"👤":"👨‍⚕️"}</div>}
                <div>
                  {!isSelf&&<div style={{fontSize:9,color:"rgba(255,255,255,0.25)",marginBottom:4,letterSpacing:"0.05em"}}>{choiceName}</div>}
                  <div style={{maxWidth:"68vw",padding:"12px 16px",borderRadius:isSelf?"14px 14px 4px 14px":"14px 14px 14px 4px",background:isSelf?"rgba(64,82,52,0.88)":"rgba(255,255,255,0.08)",color:isSelf?"#ccdac4":"rgba(255,255,255,0.82)",fontSize:13,lineHeight:1.75,backdropFilter:"blur(8px)",boxShadow:"0 2px 14px rgba(0,0,0,0.4)"}}>{msg.text}</div>
                </div>
              </div>
            );
          })}
          {loading&&<div style={{display:"flex",alignItems:"flex-end",gap:10}}><div style={{width:32,height:32,borderRadius:"50%",background:"rgba(80,70,120,0.6)",flexShrink:0}}/><div style={{padding:"12px 16px",background:"rgba(255,255,255,0.08)",borderRadius:"14px 14px 14px 4px",display:"flex",gap:5}}>{[0,1,2].map(j=><div key={j} style={{width:5,height:5,borderRadius:"50%",background:"rgba(255,255,255,0.35)",animation:`ep_b 1s ease ${j*0.2}s infinite`}}/>)}</div></div>}
        </div>
      </div>

      {/* Input */}
      <div style={{padding:"10px 20px 18px",background:"rgba(10,8,6,0.97)",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",gap:10,alignItems:"flex-end"}}>
        <button onClick={()=>setNotebookOpen(o=>!o)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",padding:"7px 11px",cursor:"pointer",fontSize:11,fontFamily:"inherit",borderRadius:8,flexShrink:0}}>📓</button>
        <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend(input);}}}
          placeholder={`${choiceName.split(" ")[0]}에게...   ↵ Enter`} disabled={loading} rows={2}
          style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:10,padding:"11px 14px",fontSize:13,fontFamily:"system-ui,sans-serif",lineHeight:1.65,color:"rgba(255,255,255,0.82)",outline:"none",resize:"none",caretColor:"#c0b070"}}/>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          <button onClick={()=>handleSend(input)} disabled={loading||!input.trim()} style={{background:(loading||!input.trim())?"rgba(255,255,255,0.06)":"rgba(64,82,52,0.9)",border:"none",color:(loading||!input.trim())?"rgba(255,255,255,0.2)":"#ccdac4",padding:"11px 17px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>전송</button>
          {canEnd&&<button onClick={()=>onEnd({...sessionFlags,choice})} style={{background:"rgba(160,130,60,0.18)",border:"1px solid rgba(170,140,60,0.38)",color:"rgba(190,160,75,0.88)",padding:"11px 17px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(160,130,60,0.32)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(160,130,60,0.18)";}}>나가기</button>}
        </div>
      </div>

      <NotebookPanel isOpen={notebookOpen} onClose={()=>setNotebookOpen(false)} epNum={ep.titleNum} preNotes={ep.notebookPre} userNotes={userNotes} onUserNotesChange={setUserNotes}/>
      <style>{`@keyframes ep_b{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-5px);opacity:1}}@keyframes pulse2{0%,100%{opacity:0.7;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════════════════ */
export default function InternApp() {
  const [storyFlags, setStoryFlags] = useState({
    EP1_completed:false, EP1_jinsu_opened:false,
    EP2_completed:false, EP2_daughter_suspicious:false, EP2_reversal1:false, EP2_reversal2:false,
    EP3_completed:false, EP3_real_opened:false,
    EP4_completed:false, EP4_deeper_connection:false,
    EP5_completed:false, EP5_real_opened:false,
    EP6_completed:false, EP6_asked_the_question:false, EP6_answered_directly:false, EP6_gave_comfort:false, EP6_deflected:false,
    EP7_completed:false,
    EP8_completed:false, EP8_grief_opened:false,
    EP9_completed:false, EP9_article_hint:false, EP9_real_opened:false,
    EP10_completed:false,
  });

  const [phase,       setPhase]       = useState("hub");
  const [currentEpId, setCurrentEpId] = useState(null);
  const [sessionSnap, setSessionSnap] = useState({});

  const ep = currentEpId ? EPISODE_LIST.find(e=>e.id===currentEpId) : null;

  const handlePlay = useCallback((epId)=>{setCurrentEpId(epId);setPhase("intro");},[]);
  const handleStart = useCallback(()=>setPhase("game"),[]);

  const handleEnd = useCallback((localFlags)=>{
    const epDef = EPISODE_LIST.find(e=>e.id===currentEpId);
    const updates = { [epDef.completedFlag]: true };
    epDef.localFlags.forEach(flag=>{
      if(localFlags[flag]) updates[`${epDef.id}_${flag}`]=true;
    });
    // Special: EP7 stores numeric values
    if(epDef.id==="EP7") {
      if(localFlags.turnsA!==undefined) updates.EP7_turnsA=localFlags.turnsA;
      if(localFlags.turnsB!==undefined) updates.EP7_turnsB=localFlags.turnsB;
    }
    setStoryFlags(p=>({...p,...updates}));
    setSessionSnap(localFlags);
    setPhase("result");
  },[currentEpId]);

  const handleContinue = useCallback(()=>{setCurrentEpId(null);setPhase("hub");},[]);

  if(phase==="hub")    return <EpisodeHub storyFlags={storyFlags} onPlay={handlePlay}/>;
  if(phase==="intro")  return <IntroScreen ep={ep} onStart={handleStart}/>;
  if(phase==="result") return <ResultScreen ep={ep} storyFlags={storyFlags} sessionFlags={sessionSnap} onContinue={handleContinue}/>;

  // Game routing
  if(ep.mechanics?.dual)      return <DualGameScreen ep={ep} storyFlags={storyFlags} onEnd={handleEnd}/>;
  if(ep.mechanics?.noPatient) return <EP10Screen ep={ep} storyFlags={storyFlags} onEnd={handleEnd}/>;
  return <GameScreen ep={ep} storyFlags={storyFlags} onEnd={handleEnd}/>;
}
