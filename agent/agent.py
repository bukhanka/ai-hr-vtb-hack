from dotenv import load_dotenv
import json
import os
import asyncio
import logging
import signal
import sys
import atexit

from livekit import agents, api
from livekit.agents import AgentSession, Agent, RoomInputOptions, JobContext
from livekit.plugins import (
    google,
    noise_cancellation,
    bithuman,
    silero,
    deepgram,
)
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv()

# Configure clean logging - disable verbose DEBUG messages
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(name)s - %(message)s'
)

# Disable DEBUG logging for noisy modules
logging.getLogger('websockets').setLevel(logging.WARNING)
logging.getLogger('websockets.client').setLevel(logging.WARNING)
logging.getLogger('livekit.agents').setLevel(logging.INFO)
logging.getLogger('livekit').setLevel(logging.WARNING)
logging.getLogger('google_genai.live').setLevel(logging.WARNING)
logging.getLogger('asyncio').setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

# Global variables for cleanup
global_lkapi = None
global_room_name = None
global_cleanup_executed = False
global_recording_id = None  # Track recording ID for manual stop

async def cleanup_recording():
    """Функция для корректного завершения записи"""
    global global_cleanup_executed, global_recording_id
    
    if global_cleanup_executed:
        logger.info("🔄 Cleanup already executed, skipping...")
        return
        
    global_cleanup_executed = True
    
    # Manually stop recording immediately to prevent extra time
    if global_lkapi and global_recording_id:
        try:
            logger.info(f"🛑 Manually stopping recording: {global_recording_id}")
            stop_request = api.StopEgressRequest(egress_id=global_recording_id)
            await global_lkapi.egress.stop_egress(stop_request)
            logger.info("✅ Recording stopped successfully")
        except Exception as e:
            logger.error(f"❌ Error stopping recording: {e}")
    
    if global_lkapi:
        try:
            await global_lkapi.aclose()
            logger.info("🔒 API connection closed successfully")
        except Exception as e:
            logger.error(f"❌ Error closing API connection: {e}")

def cleanup_recording_sync():
    """Синхронная обертка для cleanup_recording"""
    try:
        # Создаем новый event loop если его нет
        try:
            loop = asyncio.get_event_loop()
            if loop.is_closed():
                raise RuntimeError("Event loop is closed")
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        # Запускаем асинхронную очистку синхронно
        loop.run_until_complete(cleanup_recording())
        
    except Exception as e:
        logger.error(f"❌ Error in synchronous cleanup: {e}")

def signal_handler(signum, frame):
    """Обработчик сигналов для корректного завершения"""
    logger.info(f"⚡ Received signal {signum}, initiating cleanup...")
    cleanup_recording_sync()
    sys.exit(0)

# Регистрируем обработчики сигналов и atexit
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)
atexit.register(cleanup_recording_sync)

voices = ["Puck", "Charon", "Kore", "Fenrir", "Aoede", "Leda"]


def get_participant_metadata(room):
    """Получает метаданные от любого участника"""
    # Проверяем всех участников (включая локального)
    all_participants = list(room.remote_participants.values())
    if room.local_participant:
        all_participants.append(room.local_participant)
    
    for participant in all_participants:
        if participant.metadata:
            try:
                metadata = json.loads(participant.metadata)
                logger.info(f"Метаданные найдены у {participant.identity}")
                return metadata
            except json.JSONDecodeError:
                logger.error(f"Ошибка парсинга метаданных у {participant.identity}")
                continue
    
    logger.warning("Метаданные не найдены")
    return {}


class VideoAssistant(Agent):
    def __init__(self, voice="Kore", instructions=None) -> None:
        # Используем переданные инструкции или дефолтные
        default_instructions = "You are an HR manager conducting a 10-minute screening interview. You can see the candidate through their webcam and hear their voice. Use this information to assess their suitability and maintain a professional and engaging conversation. Ypu are in russia 2025. Your idenetety is russian."
        
        super().__init__(
            instructions=instructions or default_instructions,
        )


async def entrypoint(ctx: JobContext):
    global global_lkapi, global_room_name, global_cleanup_executed, global_recording_id
    
    # Reset cleanup flag for new session
    global_cleanup_executed = False
    
    lkapi = None
    
    try:
        global_room_name = ctx.room.name
        logger.info(f"🚀 Starting session for room: {global_room_name}")
        
        # Initialize LiveKit API client for participant recording
        try:
            # Get GCP credentials from environment variable or fallback to local file
            gcp_credentials = None
            
            # Сначала пробуем переменную окружения GOOGLE_APPLICATION_CREDENTIALS
            credentials_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
            if not credentials_path:
                # Fallback на относительный путь
                credentials_path = 'creds/googlecreadofmine.json'
            
            if credentials_path and os.path.exists(credentials_path):
                with open(credentials_path, 'r') as f:
                    gcp_credentials = f.read()
                logger.info(f"✅ GCP credentials loaded from: {credentials_path}")
            else:
                logger.warning(f"⚠️ GCP credentials file not found at: {credentials_path}")
            
            if gcp_credentials:
                # Initialize LiveKit API client
                lkapi = api.LiveKitAPI()
                global_lkapi = lkapi  # Сохраняем в глобальной переменной
                logger.info("✅ LiveKit API client initialized for participant recording")
            else:
                logger.warning("⚠️ Recording disabled - no valid GCP credentials found")
                
        except Exception as e:
            logger.error(f"❌ Error initializing recording: {e}")
        
        await ctx.connect()
        logger.info("🔌 Connected to room successfully")
        
        # Set up room disconnection handler
        room_closed_event = asyncio.Event()
        current_session = None  # Store session reference for cleanup
        
        # Функция для начала записи конкретного участника
        async def start_user_recording(participant_identity: str):
            """Запускает запись видео для конкретного участника"""
            try:
                if not gcp_credentials or not lkapi:
                    logger.warning("⚠️ Recording not available - missing credentials or API client")
                    return
                
                # Получаем interview ID из метаданных
                metadata = get_participant_metadata(ctx.room)
                interview_id = metadata.get('interviewId')
                
                # Если interview ID не найден, ждем немного и пробуем еще раз
                if not interview_id:
                    logger.info("⏳ Interview ID not found, waiting for metadata...")
                    await asyncio.sleep(2)
                    metadata = get_participant_metadata(ctx.room)
                    interview_id = metadata.get('interviewId')
                
                if not interview_id:
                    logger.warning("⚠️ Interview ID still not found in metadata after waiting, cannot start recording")
                    return
                
                logger.info(f"🎬 Starting recording for interview: {interview_id}")
                
                # Используем interview ID для имени файла
                video_filename = f"recordings/interview_{interview_id}.mp4"
                
                req = api.ParticipantEgressRequest(
                    room_name=ctx.room.name,
                    identity=participant_identity,  # Identity пользователя
                    file_outputs=[api.EncodedFileOutput(
                        file_type=api.EncodedFileType.MP4,
                        filepath=video_filename,
                        gcp=api.GCPUpload(
                            credentials=gcp_credentials,
                            bucket="ailang",
                        ),
                    )],
                )
                
                # Start recording
                recording_response = await lkapi.egress.start_participant_egress(req)
                logger.info(f"🎥 Interview {interview_id} recording started: {recording_response.egress_id}")
                logger.info(f"📁 Video will be saved as: {video_filename}")
                
                global global_recording_id
                global_recording_id = recording_response.egress_id
                
            except Exception as e:
                logger.error(f"❌ Error starting user recording for {participant_identity}: {e}")
        
        # Обработчик подключения участников
        @ctx.room.on("participant_connected")
        def on_participant_connected(participant):
            """Обработчик подключения участника"""
            logger.info(f"👤 Participant connected: {participant.identity}")
            
            # Проверяем что это не агент (агент обычно подключается первым)
            # Можно использовать разные способы определения пользователя:
            if participant.identity != "agent" and not participant.identity.startswith("AI"):
                logger.info(f"📹 Starting recording for user: {participant.identity}")
                # Запускаем запись для этого пользователя
                asyncio.create_task(start_user_recording(participant.identity))
        
        @ctx.room.on("disconnected")
        def on_room_disconnected():
            logger.info("🔌 Room disconnected")
            room_closed_event.set()
        
        @ctx.room.on("participant_disconnected")
        def on_participant_disconnected(participant):
            logger.info(f"👤 Participant left room: {participant.identity}")
            # Если это был единственный пользователь (не агент), завершаем сессию
            human_participants = [p for p in ctx.room.remote_participants.values()]
            if len(human_participants) == 0:
                logger.info("🔚 All participants left room, ending session")
                
                # Immediately stop recording and cleanup
                async def immediate_cleanup():
                    try:
                        # Stop recording first
                        await cleanup_recording()
                        logger.info("🎙️ Recording cleanup completed")
                        
                        # Then close session gracefully
                        if current_session:
                            await current_session.aclose()
                            logger.info("🛑 Agent session closed gracefully")
                    except Exception as e:
                        logger.warning(f"⚠️ Error during cleanup: {e}")
                    
                    try:
                        await ctx.room.disconnect()
                        logger.info("🔌 Room disconnected")
                    except Exception as e:
                        logger.warning(f"⚠️ Error during room disconnect: {e}")
                
                asyncio.create_task(immediate_cleanup())
                room_closed_event.set()
        
        # Проверяем есть ли уже подключенные пользователи (кроме агента)
        for participant in ctx.room.remote_participants.values():
            if participant.identity != "agent" and not participant.identity.startswith("AI"):
                logger.info(f"📹 Starting recording for existing user: {participant.identity}")
                await start_user_recording(participant.identity)
                break  # Записываем только первого найденного пользователя
        
        # Получаем метаданные участника для настройки агента
        metadata = get_participant_metadata(ctx.room)
        
        # Если метаданные не найдены, ждем немного и пробуем еще раз
        if not metadata.get('voice') and not metadata.get('instructions'):
            logger.info("⏳ Waiting for metadata...")
            await asyncio.sleep(2)
            metadata = get_participant_metadata(ctx.room)
        
        agent_voice = metadata.get('voice', 'Kore')
        agent_instructions = metadata.get('instructions', None)
        
        logger.info(f"🤖 Agent configured: voice={agent_voice}")

        # Configure AgentSession - используем только VAD без turn detector
        session = AgentSession(
            # Используем только VAD - более простой и предсказуемый
            turn_detection="vad",
            
            # VAD настройки для максимальной терпеливости
            vad=silero.VAD.load(
                # min_speech_duration=0.05,      # Быстрое обнаружение начала речи
                # min_silence_duration=5.0,      # ЖДАТЬ 5 СЕКУНД тишины!
                # prefix_padding_duration=0.8,   # Больше отступа
                # activation_threshold=0.7,      # Еще менее чувствительный
                # max_buffered_speech=120.0,     # Больше буфера для длинных фраз
            ),
            
            # Gemini Live LLM для ответов
            llm=google.beta.realtime.RealtimeModel(
                voice=agent_voice,
                temperature=0.8,
            ),
            
            # Session-level timing - максимальные задержки
            # min_endpointing_delay=3.0,      # МИНИМУМ 3 секунды задержки
            # max_endpointing_delay=15.0,     # До 15 секунд ожидания
            # allow_interruptions=True,       # Позволить прерывать ИИ
            # min_interruption_duration=1.2,  # 1.2 секунды речи для прерывания
        )

        # avatar = bithuman.AvatarSession(
        #     model_path="./dating_coach.imx",
        # )

        # Start the avatar and wait for it to join
        # await avatar.start(session, room=ctx.room)

        await session.start(
            agent=VideoAssistant(voice=agent_voice, instructions=agent_instructions),
            room=ctx.room,
            room_input_options=RoomInputOptions(
                video_enabled=True,
                # LiveKit Cloud enhanced noise cancellation
                # - If self-hosting, omit this parameter
                # - For telephony applications, use `BVCTelephony` for best results
                noise_cancellation=noise_cancellation.BVC(),
            ),
        )
        
        current_session = session  # Store session reference for cleanup
        
        logger.info("✅ Agent session started successfully")
        
        # Generate initial greeting - AI will start speaking immediately
        await session.generate_reply(
            instructions="Greet the user and offer your assistance."
        )
        
        # Wait for room to close or timeout
        try:
            await asyncio.wait_for(room_closed_event.wait(), timeout=3600)  # 1 hour timeout
            logger.info("✅ Session completed normally")
        except asyncio.TimeoutError:
            logger.warning("⏰ Session ended due to timeout")
            
    except Exception as e:
        logger.error(f"❌ Critical error in session: {e}")
        
    finally:
        # Cleanup recording and API connection
        logger.info("🧹 Starting cleanup process...")
        await cleanup_recording()
        
        # Очищаем глобальные переменные
        global_lkapi = None
        global_room_name = None
        global_recording_id = None
        
        logger.info("🏁 Session cleanup completed")


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))