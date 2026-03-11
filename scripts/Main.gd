extends Control
## 화면 전환 관리자 — GameManager.phase_changed 시그널에 반응

@onready var screen_container: Control = $ScreenContainer

const SCENE_MAP: Dictionary = {
	GameManager.Phase.HUB:       "res://scenes/screens/EpisodeHub.tscn",
	GameManager.Phase.INTRO:     "res://scenes/screens/IntroScreen.tscn",
	GameManager.Phase.RESULT:    "res://scenes/screens/ResultScreen.tscn",
	GameManager.Phase.DAY_END:   "res://scenes/screens/DayEndScreen.tscn",
	GameManager.Phase.INTERLUDE: "res://scenes/screens/InterludeScreen.tscn",
}

var _current_screen: Node = null


func _ready() -> void:
	GameManager.phase_changed.connect(_on_phase_changed)
	_load_screen(GameManager.Phase.HUB)


func _on_phase_changed(new_phase: GameManager.Phase) -> void:
	_load_screen(new_phase)


func _load_screen(phase: GameManager.Phase) -> void:
	if _current_screen:
		_current_screen.queue_free()
		_current_screen = null

	var scene_path: String = _get_scene_path(phase)
	if scene_path == "":
		return

	var packed: PackedScene = load(scene_path)
	if packed == null:
		push_error("Main: 씬 로드 실패 — %s" % scene_path)
		return

	_current_screen = packed.instantiate()
	screen_container.add_child(_current_screen)


func _get_scene_path(phase: GameManager.Phase) -> String:
	if phase == GameManager.Phase.GAME:
		var ep: Dictionary = EpisodeData.get_episode(GameManager.current_ep_id)
		if ep.get("mechanics", {}).get("dual", false):
			return "res://scenes/screens/DualGameScreen.tscn"
		if ep.get("mechanics", {}).get("no_patient", false):
			return "res://scenes/screens/EP10Screen.tscn"
		return "res://scenes/screens/GameScreen.tscn"
	return SCENE_MAP.get(phase, "")
