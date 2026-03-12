// Short inputs that signal listening/empathy
const SHORT_EMPATHY = /^(네|응|그렇군요|그렇구나|그래요|계속하세요|말씀하세요|말씀해보세요|들을게요|말해보세요|괜찮아요|그러셨군요|그랬군요|아\.\.\.|음\.\.\.)$/;

const PATTERNS = {
  // 시작 시점 / 일반 증상 문진 (가장 넓은 의료 버킷)
  onset:
    /아프|통증|증상|언제부터|처음|시작|발생|갑자기|서서히|며칠|오래됐|어디가|어디를|얼마나|열이|두통|기침|어지러|속이|배가|머리가|가슴이|허리가|구토|설사|변비|숨이|호흡|혈압|맥박|소변|대변|식욕|잠을|수면|체중|식은땀|오한|구역|토하|기력|체온|진찰|청진|촉진|빈도|횟수|몇 점|악화|호전|야간|새벽|식후|공복|구역감/,

  // 통증 양상 / 성격 (찌르는지, 어떤 느낌인지)
  character:
    /어떻게 아프|어떤 느낌|느낌이|찌릿|찌르|쑤시|뻐근|묵직|콕콕|화끈|얼얼|결리|뻣뻣|쓰리|욱신|지끈|저리|붓기|방사|퍼지|쪽으로|눌러|무감각|아린/,

  // 동반 증상 / 과거력 / 복약
  associated:
    /다른 증상|이전에도|전에도|이런 적|동반|함께 있|복용|알레르기|수술|병력|기저질환|어떤 약|약을 드|급성|만성/,

  // 공감 / 위로
  empathy:
    /힘드|괜찮|걱정|고생|안쓰러|이해해|이해합|충분|잘하|대단|수고|응원|편하|천천히|울어도|당연|자연스러|감정|마음이|안심|무리하|쉬세|돕|도와|도움|함께|곁에|공감|위로|다행|안타|용기|괴로|지지|든든|따뜻|그럴 수|기다려|기다릴|서두르|얼마든|부담|솔직해도|말씀하셔도|울어|놀라셨|무서우셨|불안하|듣고 있|들을게|말해보|이야기해|더 말|그렇군|그러셨|수 있어요|얼마나 힘|많이 힘|고통|두려|무섭|긴장|떨리|정상이에요|자연스러운|당연한|감사하|잘 오셨|잘 하고|용기 있|대견/,

  // 생활 / 개인 상황
  personal:
    /집에|가족|요즘|생활|어떠세|누구|혼자|같이|남편|아내|부모님|자녀|아이|딸이|아들이|친구|회사|직장|일상|관계|사이|결혼|이혼|연애|형제|어디 사|사시|환경|근황|지내|취미|운동|식사|밥|술|드시|주변|사람|동료|상사|학교|평소|집안|보호자|데리고|모시고|댁|손녀|손자|며느리|사위|배우자|연인|룸메이트|자취|기숙사/,

  // 내원 편의 / 안부 (병원 오는 것 관련 — 현재 unrelated로 빠지는 질문들)
  comfort:
    /오시는데|오는 길|불편하지는|불편하지 않|멀리서|기다리셨|기다리시|찾아오|많이 기다|오시기 힘|오실 때 힘|먼 길/,

  // 검사 / 처방 / 처치 지시
  direct:
    /검사|약을|처방|의뢰|치료|수술|입원|퇴원|CT|MRI|엑스레이|X-ray|초음파|혈액|소견|결과|진단|진료|상담을|정신과|외과|내과|전문의|병원|조치|계획|예약|추적|경과|관찰|투약|용량|처치|시술|찍어|수치|검진|촬영|채혈|심전도|내시경|조직|생검|약 드|약 처|처방전|의뢰서|전원|회진/,
};

// 개인 정보처럼 보이지만 의료 문맥인 단어 → associated
const ASSOCIATED_OVERRIDES = /가족력|과거력|음주력|흡연력/;

// 의료 수치 + 개인 형태 단어 → onset
const MEDICAL_CONTEXT = /혈압이|혈당이|맥박이|체온이|산소포화도|심박수/;

export default function classifyIntent(text) {
  if (!text || !text.trim()) return "unrelated";

  const cleaned = text.trim();
  if (SHORT_EMPATHY.test(cleaned)) return "empathy";

  const scores = { onset: 0, character: 0, associated: 0, empathy: 0, personal: 0, comfort: 0, direct: 0 };

  for (const [intent, pattern] of Object.entries(PATTERNS)) {
    const matches = cleaned.match(new RegExp(pattern.source, "g"));
    if (matches) scores[intent] = matches.length;
  }

  // 가족력 등 → associated (personal에서 제거)
  const assocOverrides = cleaned.match(new RegExp(ASSOCIATED_OVERRIDES, "g"));
  if (assocOverrides) {
    scores.associated += assocOverrides.length;
    scores.personal = Math.max(0, scores.personal - assocOverrides.length);
  }

  // "혈압이 어떠세요" → onset (personal에서 제거)
  const medCtx = cleaned.match(new RegExp(MEDICAL_CONTEXT, "g"));
  if (medCtx) {
    scores.onset += medCtx.length;
    scores.personal = Math.max(0, scores.personal - medCtx.length);
  }

  const max = Math.max(...Object.values(scores));
  if (max === 0) return "unrelated";

  // 우선순위: 공감 > 안부 > 개인 > 시작 > 양상 > 동반 > 처치
  const priority = ["empathy", "comfort", "personal", "onset", "character", "associated", "direct"];
  for (const intent of priority) {
    if (scores[intent] === max) return intent;
  }

  return "unrelated";
}
