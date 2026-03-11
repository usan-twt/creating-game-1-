extends Node
## 감정 메타데이터 (emotions.js 대응)

const META: Dictionary = {
	"neutral":    { "label": "평온",   "color": Color(0.65, 0.60, 0.50) },
	"anxious":    { "label": "불안",   "color": Color(0.85, 0.65, 0.30) },
	"distressed": { "label": "고통",   "color": Color(0.90, 0.40, 0.35) },
	"conflicted": { "label": "복잡함", "color": Color(0.60, 0.55, 0.80) },
	"resigned":   { "label": "체념",   "color": Color(0.55, 0.60, 0.65) },
	"exhausted":  { "label": "지침",   "color": Color(0.50, 0.55, 0.65) },
	"relieved":   { "label": "안도",   "color": Color(0.45, 0.70, 0.55) },
	"grateful":   { "label": "감사",   "color": Color(0.50, 0.70, 0.60) },
	"sad":        { "label": "슬픔",   "color": Color(0.45, 0.55, 0.75) },
	"angry":      { "label": "화남",   "color": Color(0.85, 0.35, 0.30) },
}


static func get_meta(emotion: String) -> Dictionary:
	return META.get(emotion, META["neutral"])


static func get_color(emotion: String) -> Color:
	return get_meta(emotion)["color"]


static func get_label(emotion: String) -> String:
	return get_meta(emotion)["label"]
