// Short inputs that have no keyword match but clearly signal listening/empathy
const SHORT_EMPATHY = /^(네|응|그렇군요|그렇구나|그래요|계속하세요|말씀하세요|말씀해보세요|들을게요|말해보세요|괜찮아요|그러셨군요|그랬군요|아\.\.\.|음\.\.\.)$/;

const PATTERNS = {
  symptom:
    /아프|통증|증상|언제부터|어디가|어디를|얼마나|열이|두통|기침|어지러|속이|배가|머리가|가슴이|허리가|구토|설사|변비|숨이|호흡|혈압|맥박|소변|대변|식욕|잠을|수면|복용|알레르기|수술|병력|악화|호전|방사|퍼지|쪽으로|눌러|찌릿|쑤시|뻐근|저림|붓기|체중|식은땀|오한|구역|토하|기력|체온|진찰|청진|촉진|시작|발생|빈도|횟수|몇 점|저리|뻣뻣|결리|쓰리|묵직|콕콕|찌르|화끈|얼얼|가족력|과거력|기저질환|만성|급성|야간|새벽|식후|공복|구역감/,
  empathy:
    /힘드|괜찮|걱정|고생|안쓰러|이해해|이해합|충분|잘하|대단|수고|응원|편하|천천히|울어도|당연|자연스러|감정|마음이|안심|무리하|쉬세|돕|도와|도움|함께|곁에|공감|위로|다행|안타|용기|괴로|지지|든든|따뜻|그럴 수|기다려|기다릴|서두르|얼마든|부담|솔직해도|말씀하셔도|울어|놀라셨|무서우셨|불안하|듣고 있|들을게|말해보|이야기해|더 말|그렇군|그러셨|수 있어요|얼마나 힘|많이 힘|고통|두려|무섭|긴장|떨리|정상이에요|자연스러운|당연한|감사하|잘 오셨|잘 하고|용기 있|대견/,
  personal:
    /집에|가족|요즘|생활|어떠세|누구|혼자|같이|남편|아내|부모님|자녀|아이|딸이|아들이|친구|회사|직장|일상|관계|사이|결혼|이혼|연애|형제|어디 사|사시|환경|근황|지내|취미|운동|식사|밥|술|드시|주변|사람|동료|상사|학교|평소|집안|보호자|데리고|모시고|댁|손녀|손자|며느리|사위|배우자|연인|룸메이트|자취|기숙사/,
  direct:
    /검사|약을|처방|의뢰|치료|수술|입원|퇴원|CT|MRI|엑스레이|X-ray|초음파|혈액|소견|결과|진단|진료|상담을|정신과|외과|내과|전문의|병원|조치|계획|예약|추적|경과|관찰|투약|용량|처치|시술|찍어|수치|검진|촬영|채혈|심전도|내시경|조직|생검|약 드|약 처|처방전|의뢰서|전원|회진/,
};

// Words that look like personal but are actually symptom context
const SYMPTOM_OVERRIDES = /가족력|과거력|음주력|흡연력/;

// Medical terms combined with personal-looking words → symptom
const MEDICAL_CONTEXT = /혈압이|혈당이|맥박이|체온이|산소포화도|심박수/;

export default function classifyIntent(text) {
  if (!text || !text.trim()) return "unrelated";

  const cleaned = text.trim();

  // Short listening responses → empathy
  if (SHORT_EMPATHY.test(cleaned)) return "empathy";

  const scores = { symptom: 0, empathy: 0, personal: 0, direct: 0 };

  for (const [intent, pattern] of Object.entries(PATTERNS)) {
    const matches = cleaned.match(new RegExp(pattern, "g"));
    if (matches) scores[intent] = matches.length;
  }

  // "가족력" etc. should count as symptom, not personal
  const overrides = cleaned.match(new RegExp(SYMPTOM_OVERRIDES, "g"));
  if (overrides) {
    scores.symptom += overrides.length;
    scores.personal = Math.max(0, scores.personal - overrides.length);
  }

  // "혈압이 어떠세요" → symptom, not personal (medical term + 어떠)
  const medCtx = cleaned.match(new RegExp(MEDICAL_CONTEXT, "g"));
  if (medCtx) {
    scores.symptom += medCtx.length;
    scores.personal = Math.max(0, scores.personal - medCtx.length);
  }

  const max = Math.max(...Object.values(scores));
  if (max === 0) return "unrelated";

  // Priority: empathy > personal > symptom > direct (tie-break favors emotional)
  const priority = ["empathy", "personal", "symptom", "direct"];
  for (const intent of priority) {
    if (scores[intent] === max) return intent;
  }

  return "unrelated";
}
