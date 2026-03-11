extends Control
## 하루 종료 요약 화면 (DayEndScreen.jsx 대응)
## Papers Please 스타일 — 사실만 표시, 판단 없음

@onready var summary_label: Label    = $VBox/SummaryLabel
@onready var continue_button: Button = $VBox/ContinueButton


func _ready() -> void:
	var ep: Dictionary = EpisodeData.get_episode(GameManager.current_ep_id)
	summary_label.text = "Day %d 종료\n%s" % [ep.get("day", 0), ep.get("name", "")]
	continue_button.pressed.connect(_on_continue_pressed)


func _on_continue_pressed() -> void:
	var interlude: Dictionary = InterludeData.get_interlude(GameManager.current_ep_id)
	if not interlude.is_empty():
		GameManager.dispatch("CONTINUE")
	else:
		GameManager.dispatch("SKIP")
