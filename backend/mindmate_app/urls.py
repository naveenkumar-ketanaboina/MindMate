# mindmate_app/urls.py
from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("health/", health_view, name="health"),
    path("flashcards/", FlashcardView.as_view(), name="flashcards"),
    path("summarize/", SummarizeView.as_view(), name="summarize"),
    path("upload-document/", DocumentUploadView.as_view(), name="upload-document"),
    path("explain/", ExplainView.as_view(), name="explain"),
    path("quiz-me/", QuizMeView.as_view(), name="quiz-me"),
    # Auth
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/me/", MeView.as_view(), name="me"),
    # Planner
    path("planner/tasks/", StudyTaskListCreateView.as_view(), name="planner-tasks"),
    path("planner/tasks/<int:pk>/", StudyTaskDetailView.as_view(), name="planner-task-detail",),
    path("planner/tasks/<int:pk>/toggle/", StudyTaskToggleDoneView.as_view(), name="planner-task-toggle",),
    # Habits
    path("habits/", HabitListCreateView.as_view(), name="habit-list"),
    path("habits/<int:pk>/", HabitDetailView.as_view(), name="habit-detail"),
    path("habits/<int:pk>/increment-today/", HabitIncrementTodayView.as_view(), name="habit-increment-today",),
    # Pomodoro stats
    path("pomodoro/stats/", PomodoroStatView.as_view(), name="pomodoro-stats"),
    path("analytics/overview/", AnalyticsOverviewView.as_view(),name="analytics-overview"),
    path("chat/assistant/", ChatAssistantView.as_view(), name="chat-assistant"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

]
