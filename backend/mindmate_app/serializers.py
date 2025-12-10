# mindmate_app/serializers.py
from rest_framework import serializers
from .models import *
from django.contrib.auth.models import User
from datetime import date 



class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    

class FlashcardRequestSerializer(serializers.Serializer):
    topic = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    notes = serializers.CharField()
    difficulty = serializers.ChoiceField(choices=["easy", "medium", "hard"], default="medium")
    num_cards = serializers.IntegerField(min_value=1, max_value=50, default=10)

class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = ["id", "topic", "question", "answer", "tag", "created_at"]

class SummarizeRequestSerializer(serializers.Serializer):
    notes = serializers.CharField()
    focus = serializers.CharField(required=False, allow_blank=True, allow_null=True)

class SummaryResponseSerializer(serializers.Serializer):
    summary = serializers.CharField()
    key_points = serializers.ListField(child=serializers.CharField())

# mindmate_app/serializers.py
from rest_framework import serializers
from .models import StudyDocument

# ... your existing serializers (Flashcard, Summary, etc.) ...


class DocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    title = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Optional title for the document",
    )

    def validate_file(self, value):
        # We mainly handle PDFs for now
        if value.content_type not in ["application/pdf", "text/plain"]:
            raise serializers.ValidationError("Only PDF or plain text files are supported.")
        return value


class StudyDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyDocument
        fields = ["id", "title", "source", "uploaded_at", "file"]

class ExplainRequestSerializer(serializers.Serializer):
    question = serializers.CharField()
    top_k = serializers.IntegerField(
        required=False, default=4, min_value=1, max_value=10
    )


class ExplainResponseSerializer(serializers.Serializer):
    question = serializers.CharField()
    answer = serializers.CharField()
    chunks = serializers.ListField(child=serializers.DictField())


class QuizRequestSerializer(serializers.Serializer):
    topic = serializers.CharField()
    num_questions = serializers.IntegerField(
        required=False, default=5, min_value=1, max_value=20
    )


class QuizQuestionSerializer(serializers.Serializer):
    question = serializers.CharField()
    options = serializers.ListField(child=serializers.CharField())
    correct_index = serializers.IntegerField()
    explanation = serializers.CharField(required=False, allow_blank=True)


class QuizResponseSerializer(serializers.Serializer):
    topic = serializers.CharField()
    questions = QuizQuestionSerializer(many=True)


class StudyTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyTask
        fields = [
            "id",
            "title",
            "subject",
            "date",
            "time",
            "tag",
            "done",
            "created_at",
        ]


class HabitSerializer(serializers.ModelSerializer):
    completed_today = serializers.SerializerMethodField()
    count_today = serializers.SerializerMethodField()
    streak = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = [
            "id",
            "title",
            "is_active",
            "difficulty",
            "target_per_day",
            "reminder_time",
            "completed_today",
            "count_today",
            "streak",
            "created_at",
        ]

    def _get_today_completion(self, obj):
        today = date.today()
        return obj.completions.filter(date=today).first()

    def get_count_today(self, obj):
        hc = self._get_today_completion(obj)
        return hc.count if hc else 0

    def get_completed_today(self, obj):
        hc = self._get_today_completion(obj)
        return bool(hc and hc.completed)

    def get_streak(self, obj):
        """Current streak of days where completed_today == True, counting backwards from today."""
        today = date.today()
        completions = (
            obj.completions.filter(date__lte=today)
            .order_by("-date")
            .values("date", "completed")
        )
        streak = 0
        expected = today

        for c in completions:
            if not c["completed"]:
                if c["date"] == expected:
                    # same day but not completed → break
                    break
                # skip gaps if the last completed day already passed
                continue

            if c["date"] == expected:
                streak += 1
                # move expected to previous day
                expected = expected.fromordinal(expected.toordinal() - 1)
            elif c["date"] < expected:
                # gap before this completion -> streak ends
                break

        return streak


class PomodoroStatSerializer(serializers.ModelSerializer):
    class Meta:
        model = PomodoroStat
        fields = ["total_focus_minutes", "completed_sessions", "updated_at"]
