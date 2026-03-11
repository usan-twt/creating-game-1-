extends Control
## 인터루드 화면 — 의료진 대화 씬 (InterludeScreen.jsx 대응)

@onready var speaker_label: Label        = $VBox/SpeakerLabel
@onready var location_label: Label       = $VBox/LocationLabel
@onready var lines_container: VBoxContainer = $VBox/LinesContainer
@onready var choices_container: VBoxContainer = $VBox/ChoicesContainer

var _interlude: Dictionary = {}


func _ready() -> void:
	_interlude = InterludeData.get_interlude(GameManager.current_ep_id)
	if _interlude.is_empty():
		GameManager.dispatch("CONTINUE")
		return
	_build_ui()


func _build_ui() -> void:
	speaker_label.text = "%s — %s" % [_interlude["speaker"], _interlude["speaker_desc"]]
	location_label.text = _interlude["location"]

	for line in _interlude.get("lines", []):
		var lbl: Label = Label.new()
		lbl.text = line
		lines_container.add_child(lbl)

	for choice in _interlude.get("choices", []):
		var btn: Button = Button.new()
		btn.text = choice["label"]
		btn.pressed.connect(_on_choice_pressed.bind(choice["effects"]))
		choices_container.add_child(btn)


func _on_choice_pressed(effects: Dictionary) -> void:
	GameManager.handle_interlude_continue(effects)
