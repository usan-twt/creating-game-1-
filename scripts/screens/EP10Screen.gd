extends Control
## EP10 전용: 환자 없는 마지막 에피소드 (EP10Screen.jsx 대응)

@onready var choice_panel: Control       = $ChoicePanel
@onready var conversation_panel: Control = $ConversationPanel
@onready var alone_panel: Control        = $AlonePanel
@onready var choice_btns: VBoxContainer  = $ChoicePanel/Buttons
@onready var dialog_container: VBoxContainer = $ConversationPanel/ScrollContainer/DialogList
@onready var input_field: TextEdit       = $ConversationPanel/InputArea/InputField
@onready var send_button: Button         = $ConversationPanel/InputArea/SendButton
@onready var end_button: Button          = $ConversationPanel/InputArea/EndButton
@onready var alone_text: RichTextLabel   = $AlonePanel/AloneText
@onready var alone_end_button: Button    = $AlonePanel/EndButton
@onready var notebook_panel: Control     = $NotebookPanel

var _ep: Dictionary = {}
var _choice: String = ""
var _script_data: Array = []
var _turn_index: int = 0
var _turn_count: int = 0
var _session_flags: Dictionary = {}
var _loading: bool = false


func _ready() -> void:
	_ep = EpisodeData.get_episode("EP10")
	notebook_panel.setup(_ep["notebook_pre"], "")
	choice_panel.visible = true
	conversation_panel.visible = false
	alone_panel.visible = false

	_build_choice_buttons()
	alone_end_button.pressed.connect(func(): GameManager.handle_end({ "alone_reflection": true }))
	send_button.pressed.connect(_on_send_pressed)
	end_button.pressed.connect(_on_end_pressed)
	input_field.gui_input.connect(_on_input_gui_input)


func _build_choice_buttons() -> void:
	var options: Array = [
		{ "key": "colleague", "label": "동기 찾아가기", "sub": "박세진, 라운지에 있을 것 같다" },
		{ "key": "professor", "label": "교수님 연구실", "sub": "마지막으로 인사를 드리고 싶다" },
		{ "key": "alone",     "label": "그냥 여기 있기", "sub": "잠깐 혼자 있어도 괜찮을 것 같다" },
	]
	for opt in options:
		var btn: Button = Button.new()
		btn.text = "%s\n%s" % [opt["label"], opt["sub"]]
		btn.pressed.connect(_on_choice_selected.bind(opt["key"]))
		choice_btns.add_child(btn)


func _on_choice_selected(key: String) -> void:
	_choice = key
	choice_panel.visible = false

	if key == "alone":
		_show_alone_scene()
		return

	# 대화 씬
	var scripts: Dictionary = _ep.get("scripts", {})
	var path: String = scripts.get(key, "")
	_script_data = EpisodeData._load_json(path)
	_turn_index = 0
	conversation_panel.visible = true
	end_button.visible = false

	# 첫 대사
	await get_tree().create_timer(0.4).timeout
	var opening: String = ""
	if _script_data.size() > 0:
		opening = _script_data[0].get("text", "")
		_turn_index = 1
	else:
		opening = "어, 왔어?" if key == "colleague" else "(논문에서 눈을 들며) 응, 뭐야."
	_add_message("other", opening)


func _show_alone_scene() -> void:
	alone_panel.visible = true
	var sf: Dictionary = GameManager.story_flags
	var completed_count: int = sf.values().filter(func(v): return v == true).size()
	var opened_count: int = [
		sf.get("EP1_jinsu_opened", false),
		sf.get("EP2_reversal2", false) or sf.get("EP2_reversal1", false),
		sf.get("EP3_real_opened", false),
		sf.get("EP5_real_opened", false),
		sf.get("EP8_grief_opened", false),
	].filter(func(v): return v).size()

	var lines: Array = [
		"외래가 끝났다.", " ",
		"1년 동안 많은 사람을 만났다." if completed_count >= 8 else "몇 명을 만났다.", " ",
		"몇 번은, 들을 수 있었던 것 같다." if opened_count >= 3 else ("한 번은, 무언가를 들었던 것 같다." if opened_count >= 1 else "그냥 지나간 것들이 많다."),
		" ", "창밖이 어두워졌다.", " ", "내년에도 이 창문은 똑같을 것 같다.",
	]
	alone_text.text = "\n".join(lines)


func _on_input_gui_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_ENTER and not event.shift_pressed:
			get_viewport().set_input_as_handled()
			_on_send_pressed()


func _on_send_pressed() -> void:
	var text: String = input_field.text.strip_edges()
	if text == "" or _loading:
		return
	input_field.text = ""
	_loading = true
	_turn_count += 1
	_add_message("self", text)

	await get_tree().create_timer(0.5).timeout

	var parsed: Dictionary = _script_data[_turn_index] if _turn_index < _script_data.size() else { "text": "...", "flag_trigger": "none" }
	if _turn_index < _script_data.size() - 1:
		_turn_index += 1

	var flag: String = parsed.get("flag_trigger", "none")
	if flag != "" and flag != "none":
		_session_flags[flag] = true

	_add_message("other", parsed.get("text", "..."))
	_loading = false
	end_button.visible = _turn_count >= _ep.get("min_turns", 3)


func _add_message(role: String, text: String) -> void:
	var lbl: Label = Label.new()
	lbl.text = ("[나]: " if role == "self" else "[상대]: ") + text
	lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	dialog_container.add_child(lbl)


func _on_end_pressed() -> void:
	var flags: Dictionary = _session_flags.duplicate()
	flags["choice"] = _choice
	GameManager.handle_end(flags)
