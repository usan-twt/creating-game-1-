extends Node
## 1회 진료 세션의 로직 담당 (useGameLogic.js 대응)
## GameScreen 등에서 add_child()로 인스턴스화하여 사용

signal emotion_changed(emotion: String)
signal talking_changed(is_talking: bool)
signal history_updated(history: Array)
signal rapport_changed(level: int)
signal session_flag_set(flag: String)
signal loading_changed(is_loading: bool)

var emotion: String = "neutral"
var talking: bool = false
var history: Array = []
var loading: bool = false
var rapport_level: int = 0
var session_flags: Dictionary = {}

var _script_data: Array = []
var _turn_index: int = 0
var _rapport_ref: int = 0
var _talk_timer: SceneTreeTimer = null


func setup(script_data: Array, initial_rapport: int = 0) -> void:
	_script_data = script_data
	_turn_index = 0
	_rapport_ref = initial_rapport
	rapport_level = initial_rapport


func set_emotion(new_emotion: String) -> void:
	emotion = new_emotion
	emotion_changed.emit(emotion)


func set_talking(value: bool) -> void:
	talking = value
	talking_changed.emit(talking)


func set_history(new_history: Array) -> void:
	history = new_history
	history_updated.emit(history)


## 의사 입력 처리 → 스크립트에서 응답 선택 → 시그널 발생
func send(text: String) -> Dictionary:
	if text.strip_edges() == "" or loading:
		return {}

	loading = true
	loading_changed.emit(true)
	history.append({ "role": "doctor", "text": text })
	history_updated.emit(history)

	await get_tree().create_timer(0.5).timeout

	var idx: int = _turn_index
	var turn_data: Dictionary = _script_data[idx] if idx < _script_data.size() else {}

	var parsed: Dictionary
	if turn_data.has("symptom"):
		# 인텐트 브랜칭 포맷
		var intent: String = IntentClassifier.classify(text)
		parsed = turn_data.get(intent, turn_data.get("symptom", {}))
	else:
		# 레거시 순차 포맷
		parsed = turn_data if not turn_data.is_empty() else {
			"emotion": "neutral", "text": "...", "rapport_change": 0, "flag_trigger": "none"
		}

	if idx < _script_data.size() - 1:
		_turn_index = idx + 1

	# 라포 업데이트
	var new_rapport: int = clamp(_rapport_ref + parsed.get("rapport_change", 0), 0, 5)
	_rapport_ref = new_rapport
	rapport_level = new_rapport
	rapport_changed.emit(rapport_level)

	# 감정 업데이트
	emotion = parsed.get("emotion", "neutral")
	emotion_changed.emit(emotion)

	# 플래그 처리
	var flag: String = parsed.get("flag_trigger", "none")
	if flag != "" and flag != "none":
		session_flags[flag] = true
		session_flag_set.emit(flag)

	# 발화 상태 + 히스토리
	talking = true
	talking_changed.emit(true)
	history.append({
		"role": "patient",
		"text": parsed.get("text", "..."),
		"emotion": parsed.get("emotion", "neutral"),
		"speaker": parsed.get("speaker", ""),
		"hint": parsed.get("hint", ""),
	})
	history_updated.emit(history)

	# 2.2초 후 발화 종료
	if _talk_timer != null:
		_talk_timer = null
	_talk_timer = get_tree().create_timer(2.2)
	await _talk_timer.timeout
	talking = false
	talking_changed.emit(false)

	loading = false
	loading_changed.emit(false)
	return parsed
