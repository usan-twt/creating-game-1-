extends Control
## 환자 시각화 컴포넌트 (ClinicScene.jsx 대응)
## 감정 상태와 발화 여부에 따라 환자 표현 변경

@onready var patient_sprite: ColorRect  = $PatientSprite
@onready var emotion_indicator: Label   = $EmotionIndicator
@onready var talk_animation: Control    = $TalkAnimation

var _current_emotion: String = "neutral"
var _is_talking: bool = false


func update_emotion(emotion: String) -> void:
	_current_emotion = emotion
	var color: Color = EmotionData.get_color(emotion)
	patient_sprite.color = color.darkened(0.4)
	emotion_indicator.text = EmotionData.get_label(emotion)


func update_talking(is_talking: bool) -> void:
	_is_talking = is_talking
	talk_animation.visible = is_talking


## DualGameScreen의 환자 패널에서도 사용
func setup(patient_data: Dictionary) -> void:
	update_emotion(patient_data.get("initial_emotion", "neutral"))
