extends Node
## 게임 전체 상태를 관리하는 autoload 싱글톤 (App.jsx 대응)

enum Phase { HUB, INTRO, GAME, RESULT, DAY_END, INTERLUDE }

const TRANSITIONS: Dictionary = {
	Phase.HUB:       { "PLAY": Phase.INTRO },
	Phase.INTRO:     { "START": Phase.GAME },
	Phase.GAME:      { "END": Phase.RESULT },
	Phase.RESULT:    { "CONTINUE": Phase.DAY_END, "SKIP": Phase.HUB },
	Phase.DAY_END:   { "CONTINUE": Phase.INTERLUDE, "SKIP": Phase.HUB },
	Phase.INTERLUDE: { "CONTINUE": Phase.HUB },
}

## 딥 플래그 → 피로도 +1 맵 (EP4+)
const DEEP_FLAG_MAP: Dictionary = {
	"EP4": ["deeper_connection"],
	"EP5": ["real_opened"],
	"EP6": ["gave_comfort", "answered_directly"],
	"EP8": ["grief_opened"],
	"EP9": ["real_opened"],
}

var current_phase: Phase = Phase.HUB
var current_ep_id: String = ""
var session_snap: Dictionary = {}

var story_flags: Dictionary = {
	"EP1_completed": false, "EP1_jinsu_opened": false,
	"EP2_completed": false, "EP2_daughter_suspicious": false,
	"EP2_reversal1": false, "EP2_reversal2": false,
	"EP3_completed": false, "EP3_real_opened": false,
	"EP4_completed": false, "EP4_deeper_connection": false,
	"EP5_completed": false, "EP5_real_opened": false,
	"EP6_completed": false, "EP6_asked_the_question": false,
	"EP6_answered_directly": false, "EP6_gave_comfort": false, "EP6_deflected": false,
	"EP7_completed": false,
	"EP8_completed": false, "EP8_grief_opened": false,
	"EP9_completed": false, "EP9_article_hint": false, "EP9_real_opened": false,
	"EP10_completed": false,
}

var resident_state: Dictionary = { "fatigue": 0 }

signal phase_changed(new_phase: Phase)


func dispatch(action: String, payload: Dictionary = {}) -> void:
	var transitions: Dictionary = TRANSITIONS.get(current_phase, {})
	if not action in transitions:
		return
	var next_phase: Phase = transitions[action]
	if "ep_id" in payload:
		current_ep_id = payload["ep_id"]
	if "session_snap" in payload:
		session_snap = payload["session_snap"]
	if next_phase == Phase.HUB:
		current_ep_id = ""
		session_snap = {}
	current_phase = next_phase
	phase_changed.emit(current_phase)


func handle_end(local_flags: Dictionary) -> void:
	var ep: Dictionary = EpisodeData.get_episode(current_ep_id)
	if ep.is_empty():
		return

	# storyFlags 업데이트
	story_flags[ep["completed_flag"]] = true
	for flag: String in ep["local_flags"]:
		if local_flags.get(flag, false):
			story_flags["%s_%s" % [ep["id"], flag]] = true

	if current_ep_id == "EP7":
		if "turns_a" in local_flags:
			story_flags["EP7_turnsA"] = local_flags["turns_a"]
		if "turns_b" in local_flags:
			story_flags["EP7_turnsB"] = local_flags["turns_b"]

	# 피로도 업데이트 (EP4+)
	var fatigue_delta: int = 0
	if current_ep_id == "EP7":
		fatigue_delta = 1
	else:
		var deep_flags: Array = DEEP_FLAG_MAP.get(current_ep_id, [])
		for f: String in deep_flags:
			if local_flags.get(f, false):
				fatigue_delta = 1
				break
	if fatigue_delta > 0:
		resident_state["fatigue"] = min(5, resident_state["fatigue"] + fatigue_delta)

	dispatch("END", { "session_snap": local_flags })


func handle_interlude_continue(effects: Dictionary) -> void:
	if "fatigue" in effects:
		resident_state["fatigue"] = min(5, resident_state["fatigue"] + effects["fatigue"])
	if "flag" in effects:
		story_flags[effects["flag"]] = true
	dispatch("CONTINUE")
