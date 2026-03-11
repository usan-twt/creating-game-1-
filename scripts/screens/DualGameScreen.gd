extends Control
## EP7 전용: 두 환자 동시 진료 (DualGameScreen.jsx 대응)
## 총 12턴 공유 예산, focused 변수로 활성 환자 전환

const TOTAL_TURNS: int = 12

@onready var patient_a_panel: Control  = $PatientAPanel
@onready var patient_b_panel: Control  = $PatientBPanel
@onready var focus_a_button: Button    = $Controls/FocusAButton
@onready var focus_b_button: Button    = $Controls/FocusBButton
@onready var turns_left_label: Label   = $Controls/TurnsLeftLabel
@onready var input_field: TextEdit     = $InputArea/InputField
@onready var send_button: Button       = $InputArea/SendButton
@onready var end_button: Button        = $InputArea/EndButton
@onready var notebook_button: Button   = $InputArea/NotebookButton
@onready var notebook_panel: Control   = $NotebookPanel

var _ep: Dictionary = {}
var _logic_a: GameLogic = null
var _logic_b: GameLogic = null
var _focused: String = "A"
var _turns_used: int = 0
var _turns_a: int = 0
var _turns_b: int = 0


func _ready() -> void:
	_ep = EpisodeData.get_episode("EP7")
	_setup_logic()
	_setup_ui()
	_connect_signals()
	_show_opening()


func _setup_logic() -> void:
	_logic_a = GameLogic.new()
	_logic_b = GameLogic.new()
	add_child(_logic_a)
	add_child(_logic_b)
	_logic_a.setup(EpisodeData._load_json("res://data/scripts/ep7a.json"))
	_logic_b.setup(EpisodeData._load_json("res://data/scripts/ep7b.json"))


func _setup_ui() -> void:
	var pa: Dictionary = _ep["patient_a"]
	var pb: Dictionary = _ep["patient_b"]
	patient_a_panel.setup(pa)
	patient_b_panel.setup(pb)
	turns_left_label.text = "남은 턴: %d" % TOTAL_TURNS
	end_button.visible = false
	notebook_panel.setup(_ep["notebook_pre"], "")


func _connect_signals() -> void:
	focus_a_button.pressed.connect(func(): _set_focused("A"))
	focus_b_button.pressed.connect(func(): _set_focused("B"))
	send_button.pressed.connect(_on_send_pressed)
	end_button.pressed.connect(_on_end_pressed)
	notebook_button.pressed.connect(func(): notebook_panel.toggle())
	input_field.gui_input.connect(_on_input_gui_input)
	_logic_a.history_updated.connect(func(h): patient_a_panel.refresh_dialog(h))
	_logic_b.history_updated.connect(func(h): patient_b_panel.refresh_dialog(h))
	_logic_a.rapport_changed.connect(func(l): patient_a_panel.set_rapport(l))
	_logic_b.rapport_changed.connect(func(l): patient_b_panel.set_rapport(l))
	_logic_a.emotion_changed.connect(func(e): patient_a_panel.set_emotion(e))
	_logic_b.emotion_changed.connect(func(e): patient_b_panel.set_emotion(e))


func _show_opening() -> void:
	var pa: Dictionary = _ep["patient_a"]
	var pb: Dictionary = _ep["patient_b"]
	_logic_a.set_emotion(pa["initial_emotion"])
	_logic_b.set_emotion(pb["initial_emotion"])
	await get_tree().create_timer(0.6).timeout
	_logic_a.set_history([{ "role": "patient", "text": pa["cc"], "emotion": pa["initial_emotion"], "speaker": "", "hint": "" }])
	_logic_b.set_history([{ "role": "patient", "text": pb["cc"], "emotion": pb["initial_emotion"], "speaker": "", "hint": "" }])


func _set_focused(patient: String) -> void:
	_focused = patient
	focus_a_button.button_pressed = (patient == "A")
	focus_b_button.button_pressed = (patient == "B")
	patient_a_panel.modulate.a = 1.0 if patient == "A" else 0.5
	patient_b_panel.modulate.a = 1.0 if patient == "B" else 0.5


func _on_input_gui_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_ENTER and not event.shift_pressed:
			get_viewport().set_input_as_handled()
			_on_send_pressed()


func _on_send_pressed() -> void:
	var text: String = input_field.text.strip_edges()
	var logic: GameLogic = _logic_a if _focused == "A" else _logic_b
	if text == "" or logic.loading or _turns_used >= TOTAL_TURNS:
		return

	input_field.text = ""
	_turns_used += 1
	if _focused == "A":
		_turns_a += 1
	else:
		_turns_b += 1

	turns_left_label.text = "남은 턴: %d" % (TOTAL_TURNS - _turns_used)
	end_button.visible = _turns_used >= _ep.get("min_turns", 10)

	await logic.send(text)


func _on_end_pressed() -> void:
	var flags: Dictionary = {
		"turns_a": _turns_a,
		"turns_b": _turns_b,
		"rapport_a": _logic_a.rapport_level,
		"rapport_b": _logic_b.rapport_level,
	}
	GameManager.handle_end(flags)
