extends Control
## 에피소드 선택 허브 화면 (EpisodeHub.jsx 대응)

@onready var episode_list_container: VBoxContainer = $ScrollContainer/EpisodeList


func _ready() -> void:
	GameManager.phase_changed.connect(_on_phase_changed)
	_build_episode_buttons()


func _build_episode_buttons() -> void:
	for child in episode_list_container.get_children():
		child.queue_free()

	for ep in EpisodeData.EPISODE_LIST:
		var completed: bool = GameManager.story_flags.get(ep["completed_flag"], false)
		var btn: Button = Button.new()
		btn.text = "%s  %s" % [ep["title_num"], ep["teaser"]]
		btn.disabled = _is_locked(ep)
		btn.pressed.connect(_on_episode_pressed.bind(ep["id"]))
		episode_list_container.add_child(btn)


func _is_locked(ep: Dictionary) -> bool:
	# EP1은 항상 열려 있음. 이후 에피소드는 이전 완료 여부로 판단
	var idx: int = EpisodeData.EPISODE_LIST.find(ep)
	if idx <= 0:
		return false
	var prev_ep: Dictionary = EpisodeData.EPISODE_LIST[idx - 1]
	return not GameManager.story_flags.get(prev_ep["completed_flag"], false)


func _on_episode_pressed(ep_id: String) -> void:
	GameManager.dispatch("PLAY", { "ep_id": ep_id })


func _on_phase_changed(new_phase: GameManager.Phase) -> void:
	if new_phase == GameManager.Phase.HUB:
		_build_episode_buttons()
