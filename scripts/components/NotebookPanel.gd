extends Control
## 슬라이드 노트북 패널 (NotebookPanel.jsx 대응)

@onready var pre_notes_label: RichTextLabel = $VBox/PreNotesLabel
@onready var user_notes_field: TextEdit     = $VBox/UserNotesField
@onready var article_container: Control     = $VBox/ArticleContainer
@onready var article_label: RichTextLabel   = $VBox/ArticleContainer/ArticleLabel
@onready var close_button: Button           = $CloseButton

var _article_text: String = ""


func _ready() -> void:
	visible = false
	close_button.pressed.connect(func(): visible = false)


func setup(pre_notes: String, article_text: String = "") -> void:
	pre_notes_label.text = pre_notes
	_article_text = article_text
	article_container.visible = false


func toggle() -> void:
	visible = not visible


func show_article() -> void:
	if _article_text != "":
		article_label.text = _article_text
		article_container.visible = true
