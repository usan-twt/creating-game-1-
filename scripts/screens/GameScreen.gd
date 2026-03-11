extends Control
## 기본 진료 화면 EP1~EP6, EP8, EP9 (GameScreen.jsx 대응)

@onready var patient_name_label: Label      = $PatientCard/NameLabel
@onready var patient_age_label: Label       = $PatientCard/AgeLabel
@onready var cc_label: Label                = $PatientCard/CCLabel
@onready var rapport_bar: Control           = $PatientCard/RapportBar
@onready var vitals_container: VBoxContainer = $StatusCard/VitalsContainer
@onready var emotion_label: Label           = $StatusCard/EmotionLabel
@onready var clinic_scene: Control          = $ClinicScene
@onready var dialog_container: VBoxContainer = $DialogArea/DialogContainer
@onready var input_field: TextEdit          = $InputArea/InputField
@onready var send_button: Button            = $InputArea/SendButton
@onready var end_button: Button             = $InputArea/EndButton
@onready var notebook_button: Button        = $InputArea/NotebookButton
@onready var log_button: Button             = $InputArea/LogButton
@onready var notebook_panel: Control        = $NotebookPanel
@onready var log_panel: Control             = $LogPanel
@onready var translator_button: Button      = $InputArea/TranslatorButton
@onready var phone_check_label: Label       = $PatientCard/PhoneCheckLabel

var _ep: Dictionary = {}
var _logic: GameLogic = null
var _exchange_count: int = 0
var _translator_direct: bool = false
var _breathing_calm: bool = false
var _article_visible: bool = false


func _ready() -> void:
	_ep = EpisodeData.get_episode(GameManager.current_ep_id)
	if _ep.is_empty():
		return

	_setup_logic()
	_setup_ui()
	_connect_signals()
	_show_opening()


func _setup_logic() -> void:
	_logic = GameLogic.new()
	add_child(_logic)
	var script_data: Array = EpisodeData.get_script_data(_ep["id"])
	var initial_rapport: int = EpisodeData.get_initial_rapport(_ep["id"])
	_logic.setup(script_data, initial_rapport)


func _setup_ui() -> void:
	patient_name_label.text = _ep["name"]
	patient_age_label.text = "%d세 · %s성" % [_ep["age"], _ep["sex"]]
	cc_label.text = '"%s"' % _ep["cc"]

	# 바이탈
	for child in vitals_container.get_children():
		child.queue_free()
	for key in _ep["vitals"]:
		var lbl: Label = Label.new()
		lbl.text = "%s: %s" % [key, _ep["vitals"][key]]
		vitals_container.add_child(lbl)

	# 초기 상태
	phone_check_label.visible = _ep.get("initial_phone_check", false)
	end_button.visible = false

	# 번역기 버튼: EP2 전용
	translator_button.visible = false
	if _ep["mechanics"].get("translator", false):
		translator_button.pressed.connect(_on_translator_toggled)

	# 노트북
	var pre_notes: String = EpisodeData.get_notebook_pre(_ep["id"])
	notebook_panel.setup(pre_notes, _ep.get("article_text", ""))

	rapport_bar.set_level(0)


func _connect_signals() -> void:
	send_button.pressed.connect(_on_send_pressed)
	end_button.pressed.connect(_on_end_pressed)
	notebook_button.pressed.connect(func(): notebook_panel.toggle())
	log_button.pressed.connect(func(): log_panel.visible = not log_panel.visible)
	input_field.gui_input.connect(_on_input_gui_input)

	_logic.emotion_changed.connect(_on_emotion_changed)
	_logic.talking_changed.connect(_on_talking_changed)
	_logic.history_updated.connect(_on_history_updated)
	_logic.rapport_changed.connect(_on_rapport_changed)
	_logic.session_flag_set.connect(_on_session_flag_set)
	_logic.loading_changed.connect(_on_loading_changed)


func _show_opening() -> void:
	_logic.set_emotion(_ep.get("initial_emotion", "neutral"))
	await get_tree().create_timer(0.6).timeout
	_logic.set_talking(true)
	_logic.set_history([{ "role": "patient", "text": _ep["cc"], "emotion": _ep.get("initial_emotion", "neutral"), "speaker": "", "hint": "" }])
	await get_tree().create_timer(2.0).timeout
	_logic.set_talking(false)


func _on_input_gui_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_ENTER and not event.shift_pressed:
			get_viewport().set_input_as_handled()
			_on_send_pressed()


func _on_send_pressed() -> void:
	var text: String = input_field.text.strip_edges()
	if text == "" or _logic.loading:
		return
	input_field.text = ""
	_exchange_count += 1
	_update_end_button_visibility()

	var extra_ctx: String = ""
	if _ep["mechanics"].get("translator", false):
		extra_ctx += "\n[translator_mode: %s]" % ("direct" if _translator_direct else "daughter")
	if _ep["mechanics"].get("breathing", false):
		extra_ctx += "\n[breathing_calm: %s]" % str(_breathing_calm)

	var parsed: Dictionary = await _logic.send(text)

	if "phone_check" in parsed:
		phone_check_label.visible = bool(parsed["phone_check"])
	if "breathing_calm" in parsed:
		_breathing_calm = bool(parsed["breathing_calm"])
	if parsed.get("flag_trigger", "") == "reversal1":
		_translator_direct = true
		_update_translator_ui()
	if parsed.get("flag_trigger", "") == "article_hint":
		_article_visible = true
		notebook_panel.show_article()

	# 딸 의심 플래그 → 번역기 버튼 표시
	if _logic.session_flags.get("daughter_suspicious", false) and _ep["mechanics"].get("translator", false):
		translator_button.visible = true


func _on_end_pressed() -> void:
	var flags: Dictionary = _logic.session_flags.duplicate()
	flags["exchange_count"] = _exchange_count
	GameManager.handle_end(flags)


func _on_translator_toggled() -> void:
	_translator_direct = not _translator_direct
	_update_translator_ui()


func _update_translator_ui() -> void:
	translator_button.text = "⇄ 통역 통해서" if _translator_direct else "💬 어머니께 직접"


func _update_end_button_visibility() -> void:
	var fatigue_delay: int = 1 if (GameManager.resident_state.get("fatigue", 0) >= 3 and _ep.get("day", 0) >= 4) else 0
	end_button.visible = _exchange_count >= _ep.get("min_turns", 5) + fatigue_delay


func _on_emotion_changed(new_emotion: String) -> void:
	var meta: Dictionary = EmotionData.get_meta(new_emotion)
	emotion_label.text = meta["label"]
	clinic_scene.update_emotion(new_emotion)


func _on_talking_changed(is_talking: bool) -> void:
	clinic_scene.update_talking(is_talking)


func _on_history_updated(history: Array) -> void:
	_refresh_dialog(history)


func _on_rapport_changed(level: int) -> void:
	rapport_bar.set_level(level)


func _on_session_flag_set(_flag: String) -> void:
	pass  # 필요 시 UI 반응 추가


func _on_loading_changed(is_loading: bool) -> void:
	send_button.disabled = is_loading
	input_field.editable = not is_loading


func _refresh_dialog(history: Array) -> void:
	for child in dialog_container.get_children():
		child.queue_free()
	# 마지막 doctor + patient 쌍만 표시 (로그 팝업에서 전체 표시)
	var msgs: Array = history.filter(func(m): return m["role"] != "system")
	if msgs.is_empty():
		return
	var last: Dictionary = msgs[-1]
	var visible_msgs: Array = []
	if last["role"] == "patient" and msgs.size() >= 2 and msgs[-2]["role"] == "doctor":
		visible_msgs = [msgs[-2], last]
	else:
		visible_msgs = [last]
	for msg in visible_msgs:
		var lbl: RichTextLabel = RichTextLabel.new()
		lbl.bbcode_enabled = true
		lbl.fit_content = true
		lbl.text = msg["text"]
		dialog_container.add_child(lbl)
