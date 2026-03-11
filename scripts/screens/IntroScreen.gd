extends Control
## 에피소드 인트로 화면 (IntroScreen.jsx 대응)

@onready var title_label: Label = $VBox/TitleLabel
@onready var teaser_label: Label = $VBox/TeaserLabel
@onready var subtitle_label: Label = $VBox/SubtitleLabel
@onready var start_button: Button = $VBox/StartButton


func _ready() -> void:
	var ep: Dictionary = EpisodeData.get_episode(GameManager.current_ep_id)
	if ep.is_empty():
		return
	title_label.text = ep["title_num"]
	teaser_label.text = ep["teaser"]
	subtitle_label.text = ep["subtitle"]
	start_button.pressed.connect(_on_start_pressed)


func _on_start_pressed() -> void:
	GameManager.dispatch("START")
