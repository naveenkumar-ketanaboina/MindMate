from django.db import models
from django.conf import settings


class Flashcard(models.Model):
    topic = models.CharField(max_length=255, blank=True, null=True)
    question = models.TextField()
    answer = models.TextField()
    tag = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.question[:50]

class StudyDocument(models.Model):
    title = models.CharField(max_length=255, blank=True, null=True)
    file = models.FileField(upload_to="documents/")
    source = models.CharField(
        max_length=255,
        default="user-upload",
        help_text="Where this document came from (e.g., 'upload').",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or self.file.name

class StudyTask(models.Model):
    """Planner tasks / sessions."""
    TAG_CHOICES = [
        ("Deep work", "Deep work"),
        ("Revision", "Revision"),
        ("Project", "Project"),
        ("Reading", "Reading"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="study_tasks",
    )
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=255, blank=True)
    date = models.DateField()
    time = models.TimeField(blank=True, null=True)
    tag = models.CharField(max_length=50, choices=TAG_CHOICES, default="Deep work")
    done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date", "time", "created_at"]

    def __str__(self):
        return f"{self.user.username} – {self.title}"

class PomodoroStat(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pomodoro_stat",
    )
    total_focus_minutes = models.PositiveIntegerField(default=0)
    completed_sessions = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} – {self.total_focus_minutes} mins"

class Habit(models.Model):
    """A recurring study habit."""
    DIFFICULTY_CHOICES = [
        ("easy", "Easy"),
        ("medium", "Medium"),
        ("hard", "Hard"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="habits",
    )
    title = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    difficulty = models.CharField(
        max_length=10, choices=DIFFICULTY_CHOICES, default="medium"
    )
    target_per_day = models.PositiveSmallIntegerField(default=1)
    reminder_time = models.TimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} – {self.title}"

class HabitCompletion(models.Model):
    """Per-day completion status for a habit."""
    habit = models.ForeignKey(
        Habit,
        on_delete=models.CASCADE,
        related_name="completions",
    )
    date = models.DateField()
    # how many times done today (0..target_per_day)
    count = models.PositiveSmallIntegerField(default=0)
    # keep the boolean for compatibility (derived from count)
    completed = models.BooleanField(default=False)

    class Meta:
        unique_together = ("habit", "date")

    def __str__(self):
        return f"{self.habit.title} on {self.date}: {self.count} / {self.habit.target_per_day}"
