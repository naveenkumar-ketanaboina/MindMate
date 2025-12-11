from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from datetime import date, timedelta
from django.db import models
from rest_framework.parsers import MultiPartParser, FormParser
from .models import *
from .services import generate_flashcards, summarize_notes
from django.http import JsonResponse

from .serializers import *
from .rag.document_loader import load_pdf_text
from .rag.rag_service import *


@api_view(["GET"])
@permission_classes([AllowAny])
def health_view(request):
    return JsonResponse({"status": "ok"})
class FlashcardView(APIView):
    def post(self, request):
        serializer = FlashcardRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            cards_data = generate_flashcards(
                topic=data.get("topic"),
                notes=data["notes"],
                difficulty=data["difficulty"],
                num_cards=data["num_cards"],
            )
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Save to DB (optional)
        flashcards = []
        for c in cards_data:
            fc = Flashcard.objects.create(
                topic=data.get("topic"),
                question=c.get("question", ""),
                answer=c.get("answer", ""),
                tag=c.get("tag") or None,
            )
            flashcards.append(fc)

        response_serializer = FlashcardSerializer(flashcards, many=True)
        return Response(
            {
                "topic": data.get("topic"),
                "cards": response_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class SummarizeView(APIView):
    def post(self, request):
        serializer = SummarizeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            result = summarize_notes(
                notes=data["notes"],
                focus=data.get("focus"),
            )
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response_serializer = SummaryResponseSerializer(result)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class DocumentUploadView(APIView):
    """
    Handles user document upload, extraction, and indexing into the vector store.
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = DocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        upload_file = serializer.validated_data["file"]
        title = serializer.validated_data.get("title") or upload_file.name

        # Save file via model
        study_doc = StudyDocument.objects.create(
            title=title,
            file=upload_file,
            source="user-upload",
        )

        # Determine file path and type
        file_path = study_doc.file.path
        content_type = upload_file.content_type

        # Extract text either from PDF or plain text
        try:
            if content_type == "application/pdf":
                text = load_pdf_text(file_path)
            elif content_type == "text/plain":
                # Read as plain text
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
            else:
                return Response(
                    {"detail": "Unsupported file type."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            # If extraction fails, delete the record to avoid junk
            study_doc.delete()
            return Response(
                {"detail": f"Failed to extract text: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not text.strip():
            study_doc.delete()
            return Response(
                {"detail": "No extractable text found in the document."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Index into vector store
        try:
            num_chunks = index_document(
                text=text,
                title=title,
                source=f"document:{study_doc.id}",
            )
        except Exception as e:
            # If indexing fails, we still keep the document in DB,
            # but return an error for debugging
            return Response(
                {"detail": f"Failed to index document: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        study_doc_serializer = StudyDocumentSerializer(study_doc)

        return Response(
            {
                "message": "Document uploaded and indexed successfully.",
                "document": study_doc_serializer.data,
                "chunks_indexed": num_chunks,
            },
            status=status.HTTP_201_CREATED,
        )


class ExplainView(APIView):
    """
    Use the indexed documents to explain a question.
    Currently uses a simple context-based answer (no LLM).
    """
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = ExplainRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        question = data["question"]
        top_k = data.get("top_k", 4)

        try:
            result = explain_with_llm(question=question, k=top_k)
        except Exception as e:
            return Response(
                {"detail": f"Failed to generate explanation: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response_serializer = ExplainResponseSerializer(result)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class QuizMeView(APIView):
    """
    Generate a simple quiz based on the indexed documents.
    """
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = QuizRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        topic = data["topic"]
        num_questions = data.get("num_questions", 5)

        try:
            result = quiz_with_llm(topic=topic, num_questions=num_questions)
        except Exception as e:
            return Response(
                {"detail": f"Failed to generate quiz: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response_serializer = QuizResponseSerializer(result)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class RegisterView(APIView):
    """
    Create a new user account and return JWT tokens.
    """
    def post(self, request):
        try:
            username = request.data.get("username")
            email = request.data.get("email", "")
            password = request.data.get("password")

            # basic validation
            if not username or not password:
                return Response(
                    {"detail": "Username and password are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # username already exists?
            if User.objects.filter(username=username).exists():
                return Response(
                    {"detail": "Username already taken."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
            )

            return Response(
                {
                    "message": "User registered successfully",
                    "user": {"id": user.id, "username": user.username},
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            # TEMPORARY: lets us see the real error instead of a blank 500 page
            return Response(
                {"detail": "Server error", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LoginView(APIView):
    """
    Log in with username + password and return JWT tokens.
    """
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]

        user = authenticate(username=username, password=password)
        if not user:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    """
    Return current user info (requires valid JWT).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user: User = request.user
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            status=status.HTTP_200_OK,
        )


# ---------- PLANNER ----------

class StudyTaskListCreateView(generics.ListCreateAPIView):
    serializer_class = StudyTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudyTask.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StudyTaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudyTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudyTask.objects.filter(user=self.request.user)


class StudyTaskToggleDoneView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            task = StudyTask.objects.get(pk=pk, user=request.user)
        except StudyTask.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        task.done = not task.done
        task.save()
        return Response({"id": task.id, "done": task.done})


# ---------- HABITS ----------
class HabitListCreateView(generics.ListCreateAPIView):
    serializer_class = HabitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user, is_active=True).order_by(
            "created_at"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class HabitDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HabitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user)


class HabitIncrementTodayView(APIView):
    """
    Adjust today's count (multi-check).
    Body: { "delta": 1 } or { "delta": -1 }.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        delta = int(request.data.get("delta", 1) or 1)

        try:
            habit = Habit.objects.get(pk=pk, user=request.user)
        except Habit.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        today = date.today()
        hc, _ = HabitCompletion.objects.get_or_create(
            habit=habit, date=today, defaults={"count": 0, "completed": False}
        )

        new_count = hc.count + delta
        if new_count < 0:
            new_count = 0
        if new_count > habit.target_per_day:
            new_count = habit.target_per_day

        hc.count = new_count
        hc.completed = hc.count >= habit.target_per_day
        hc.save()

        # Return updated habit state (serializer handles completed_today / count_today / streak)
        serializer = HabitSerializer(habit)
        return Response(serializer.data)


class HabitToggleTodayView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from datetime import date

        try:
            habit = Habit.objects.get(pk=pk, user=request.user)
        except Habit.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        today = date.today()
        hc, _ = HabitCompletion.objects.get_or_create(
            habit=habit, date=today, defaults={"completed": False}
        )
        hc.completed = not hc.completed
        hc.save()
        return Response({"id": habit.id, "completed_today": hc.completed})


# ---------- POMODORO ----------

class PomodoroStatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        stat, _ = PomodoroStat.objects.get_or_create(
            user=request.user,
            defaults={"total_focus_minutes": 0, "completed_sessions": 0},
        )
        serializer = PomodoroStatSerializer(stat)
        return Response(serializer.data)

    def post(self, request):
        focus_minutes = int(request.data.get("focus_minutes", 25) or 25)
        if focus_minutes < 0:
            focus_minutes = 0
        stat, _ = PomodoroStat.objects.get_or_create(
            user=request.user,
            defaults={"total_focus_minutes": 0, "completed_sessions": 0},
        )
        stat.total_focus_minutes += focus_minutes
        stat.completed_sessions += 1
        stat.save()
        serializer = PomodoroStatSerializer(stat)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    
class AnalyticsOverviewView(APIView):
    """
    Returns high-level stats + last 7 days series
    for planner tasks, habits, and pomodoro.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        # --- PLANNER STATS (uses: date, done) ---
        planner_qs = StudyTask.objects.filter(user=user)

        # Tasks whose date falls in this week
        tasks_this_week = planner_qs.filter(date__range=[week_start, week_end])

        # Tasks done this week
        completed_this_week = tasks_this_week.filter(done=True).count()

        # Overdue = not done and date < today
        overdue_tasks = planner_qs.filter(done=False, date__lt=today).count()

        total_tasks = planner_qs.count()

        # --- HABIT STATS ---
        habits_qs = Habit.objects.filter(user=user, is_active=True)
        total_habits = habits_qs.count()
        completed_habits_today = HabitCompletion.objects.filter(
            habit__in=habits_qs,
            date=today,
            completed=True,
        ).count()

        # streaks via serializer helper
        streaks = []
        habit_serializer = HabitSerializer()
        for h in habits_qs:
            streaks.append(habit_serializer.get_streak(h))
        avg_streak = sum(streaks) / len(streaks) if streaks else 0
        max_streak = max(streaks) if streaks else 0

        # --- POMODORO STATS ---
        pomodoro_stat = PomodoroStat.objects.filter(user=user).first()
        total_focus_minutes = pomodoro_stat.total_focus_minutes if pomodoro_stat else 0
        completed_sessions = pomodoro_stat.completed_sessions if pomodoro_stat else 0

        # --- LAST 7 DAYS SERIES ---
        last7 = [today - timedelta(days=i) for i in range(6, -1, -1)]

        # tasks completed per day = done=True on that date
        tasks_completed_last_7 = []
        for d in last7:
            done_count = planner_qs.filter(done=True, date=d).count()
            tasks_completed_last_7.append(
                {
                    "date": d.isoformat(),
                    "completed": done_count,
                }
            )

        habit_completion_last_7 = []
        for d in last7:
            total = total_habits or habits_qs.count()
            completed = HabitCompletion.objects.filter(
                habit__in=habits_qs,
                date=d,
                completed=True,
            ).count()
            rate = completed / total if total > 0 else 0
            habit_completion_last_7.append(
                {
                    "date": d.isoformat(),
                    "completed": completed,
                    "total": total,
                    "completion_rate": rate,
                }
            )

        data = {
            "today": today.isoformat(),
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "planner": {
                "total_tasks": total_tasks,
                "completed_this_week": completed_this_week,
                "overdue_tasks": overdue_tasks,
            },
            "habits": {
                "total_habits": total_habits,
                "completed_today": completed_habits_today,
                "avg_streak": round(avg_streak, 1),
                "max_streak": max_streak,
            },
            "pomodoro": {
                "total_focus_minutes": total_focus_minutes,
                "completed_sessions": completed_sessions,
            },
            "series": {
                "tasks_completed_last_7": tasks_completed_last_7,
                "habit_completion_last_7": habit_completion_last_7,
            },
        }

        return Response(data)


class ChatAssistantView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        messages = request.data.get("messages", [])
        top_k = int(request.data.get("top_k", 4))

        if not isinstance(messages, list) or not messages:
            return Response(
                {"detail": "messages must be a non-empty list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = chat_with_knowledge_base(messages, top_k=top_k)
        except Exception as e:
            print("ChatAssistantView error:", e)
            return Response(
                {"detail": "Failed to generate reply."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(result)

