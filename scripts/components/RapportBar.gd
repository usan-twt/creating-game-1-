extends Control
## 라포 바 (RapportBar.jsx 대응) — 0~5 단계

@onready var bar: ProgressBar = $ProgressBar
@onready var label: Label     = $Label


func set_level(level: int) -> void:
	bar.value = level
	bar.max_value = 5
	label.text = "라포 %d/5" % level
