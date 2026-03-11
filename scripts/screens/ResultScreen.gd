extends Control
## 에피소드 결과 화면 (ResultScreen.jsx 대응)

@onready var lines_container: VBoxContainer = $VBox/LinesContainer
@onready var footer_label: Label            = $VBox/FooterLabel
@onready var continue_button: Button        = $VBox/ContinueButton


func _ready() -> void:
	var result: Dictionary = EpisodeData.get_result_lines(
		GameManager.current_ep_id,
		GameManager.session_snap
	)
	for line in result.get("lines", []):
		var lbl: Label = Label.new()
		lbl.text = line
		lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		lines_container.add_child(lbl)

	footer_label.text = result.get("footer", "")
	footer_label.visible = result.get("footer", "") != ""
	continue_button.pressed.connect(_on_continue_pressed)


func _on_continue_pressed() -> void:
	if GameManager.current_ep_id == "EP10":
		GameManager.dispatch("SKIP")
	else:
		GameManager.dispatch("CONTINUE")
