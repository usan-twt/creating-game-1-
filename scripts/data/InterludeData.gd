extends Node
## 인터루드 데이터 (interludes.js 대응)
## EP3, EP5, EP7, EP9 이후에만 인터루드 존재


func get_interlude(after_ep_id: String) -> Dictionary:
	match after_ep_id:
		"EP3": return _ep3_interlude()
		"EP5": return _ep5_interlude()
		"EP7": return _ep7_interlude()
		"EP9": return _ep9_interlude()
	return {}


func _ep3_interlude() -> Dictionary:
	var sf: Dictionary = GameManager.story_flags
	var opened: int = [
		sf.get("EP1_jinsu_opened", false),
		sf.get("EP2_reversal1", false) or sf.get("EP2_reversal2", false),
		sf.get("EP3_real_opened", false),
	].filter(func(v): return v).size()

	if opened >= 2:
		return {
			"speaker": "수간호사 박영희", "speaker_desc": "내과 외래 담당", "location": "간호사 스테이션",
			"lines": ["선생님.", "이번 주 외래 시간이 좀 밀렸어요.", "대기 환자분들이 좀 기다리셨대요."],
			"choices": [
				{ "label": "다음부터 시간 관리 하겠습니다.", "effects": {} },
				{ "label": "가끔은 시간이 필요한 환자가 있어요.", "effects": {} },
			],
		}
	if opened == 1:
		return {
			"speaker": "수간호사 박영희", "speaker_desc": "내과 외래 담당", "location": "간호사 스테이션",
			"lines": ["선생님, 이번 주는 무난하셨네요.", "한 분이 좀 오래 걸리셨지만 괜찮았어요."],
			"choices": [{ "label": "네, 수고하셨습니다.", "effects": {} }],
		}
	return {
		"speaker": "수간호사 박영희", "speaker_desc": "내과 외래 담당", "location": "간호사 스테이션",
		"lines": ["선생님, 이번 주 깔끔하게 끝나셨네요.", "다음 주부터 환자 좀 더 늘어날 거예요."],
		"choices": [{ "label": "네, 알겠습니다.", "effects": {} }],
	}


func _ep5_interlude() -> Dictionary:
	var sf: Dictionary = GameManager.story_flags
	if sf.get("EP5_real_opened", false):
		return {
			"speaker": "김철수 교수", "speaker_desc": "지도교수", "location": "교수 연구실 앞 복도",
			"lines": ["야.", "이준혁 환자 차트 봤어.", "과호흡 발작인데 정신건강의학과 의뢰 안 했더라.", "이유가 있어?"],
			"choices": [
				{ "label": "환자가 원하지 않았습니다.", "effects": { "flag": "refused_referral" } },
				{ "label": "의뢰서 작성하겠습니다.", "effects": { "fatigue": 1 } },
			],
		}
	return {
		"speaker": "김철수 교수", "speaker_desc": "지도교수", "location": "교수 연구실 앞 복도",
		"lines": ["이번 달 외래 어때.", "힘든 환자 있었어?"],
		"choices": [
			{ "label": "괜찮습니다.", "effects": {} },
			{ "label": "...좀 생각이 많아졌습니다.", "effects": {} },
		],
	}


func _ep7_interlude() -> Dictionary:
	var sf: Dictionary = GameManager.story_flags
	var turns_a: int = sf.get("EP7_turnsA", 0)
	var turns_b: int = sf.get("EP7_turnsB", 0)
	if turns_b > turns_a * 1.5:
		return {
			"speaker": "간호사 이민정", "speaker_desc": "외래 간호사", "location": "외래 복도",
			"lines": ["선생님,", "이혜란 할머니 보호자분이 전화 오셨어요.", "진료가 너무 짧았다고요.", "할머니가 집에 가서 열이 또 올랐대요."],
			"choices": [{ "label": "(고개를 끄덕인다)", "effects": {} }],
		}
	if turns_a > turns_b * 1.5:
		return {
			"speaker": "간호사 이민정", "speaker_desc": "외래 간호사", "location": "외래 복도",
			"lines": ["선생님,", "강도현 씨가 대기실에서 한참 기다리다 가셨어요.", "항의 전화 올 수도 있어요."],
			"choices": [{ "label": "(고개를 끄덕인다)", "effects": {} }],
		}
	return {
		"speaker": "간호사 이민정", "speaker_desc": "외래 간호사", "location": "외래 복도",
		"lines": ["오늘 두 분 다 처리하느라 고생하셨어요.", "다음에 이런 상황이면 미리 말씀해주세요."],
		"choices": [{ "label": "네, 감사합니다.", "effects": {} }],
	}


func _ep9_interlude() -> Dictionary:
	var sf: Dictionary = GameManager.story_flags
	if sf.get("EP9_real_opened", false):
		return {
			"speaker": "동기 박세진", "speaker_desc": "레지던트 동기", "location": "라운지",
			"lines": ["야, 오늘 뉴스 봤어?", "△△제약 식약처 조사 들어간대.", "...", "혹시 오늘 외래에서 그 회사 사람 만났어?"],
			"choices": [
				{ "label": "(고개를 끄덕인다)", "effects": {} },
				{ "label": "아니, 모르는 얘기야.", "effects": {} },
			],
		}
	if sf.get("EP9_article_hint", false):
		return {
			"speaker": "동기 박세진", "speaker_desc": "레지던트 동기", "location": "라운지",
			"lines": ["야, △△제약 뉴스 봤어?", "식약처 조사래. 난리 났더라."],
			"choices": [{ "label": "어, 봤어.", "effects": {} }],
		}
	return {
		"speaker": "동기 박세진", "speaker_desc": "레지던트 동기", "location": "라운지",
		"lines": ["야, 오늘 뉴스 봤어?", "△△제약 난리 났더라. 데이터 조작이래."],
		"choices": [{ "label": "그래?", "effects": {} }],
	}
