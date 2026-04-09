import os
import json
import uuid
import logging
import subprocess
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse

# 引入我们刚才写好的核心模块与工具
from core.audio_processor import process_guitar_audio
from core.video_processor import process_video_and_merge
from utils.file_handler import save_upload_file, generate_temp_path, cleanup_files, TEMP_WORKSPACE

logger = logging.getLogger(__name__)

router = APIRouter()


# ==========================================
# 极简任务状态管理 (基于文件，适配 Gunicorn 多进程)
# ==========================================
def update_task_status(task_id: str, status: str, message: str = "", result_file: str = ""):
    """更新任务状态到 JSON 文件"""
    status_file = os.path.join(TEMP_WORKSPACE, f"{task_id}.json")
    data = {
        "status": status,  # pending, processing, completed, failed
        "message": message,  # 前端展示的进度提示词
        "result_file": result_file  # 完成后的产物路径
    }
    with open(status_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)


def get_task_status_data(task_id: str) -> dict:
    """读取任务状态"""
    status_file = os.path.join(TEMP_WORKSPACE, f"{task_id}.json")
    if not os.path.exists(status_file):
        return None
    with open(status_file, "r", encoding="utf-8") as f:
        return json.load(f)


# ==========================================
# 后台异步处理流水线
# ==========================================
def process_task_pipeline(task_id: str, input_video_path: str):
    """
    统筹音视频剥离、修音、画面美化与合并的完整流水线
    """
    temp_files = [input_video_path]  # 记录需要被清理的垃圾文件

    try:
        update_task_status(task_id, "processing", "正在解析视频音轨...")

        # 1. 利用 FFmpeg 从原视频中剥离纯净的 WAV 音频
        raw_audio_path = generate_temp_path("raw_audio", ".wav")
        temp_files.append(raw_audio_path)
        # 提取 44.1kHz, 16bit 的标准双声道 PCM 音频，供 Pedalboard 处理
        subprocess.run(
            ["ffmpeg", "-y", "-i", input_video_path, "-vn", "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2",
             raw_audio_path],
            check=True, capture_output=True, timeout=60
        )

        update_task_status(task_id, "processing", "正在注入小振膜与大教堂魔法...")

        # 2. 调用纯原生 Pedalboard 算法修音
        processed_audio_path = generate_temp_path("processed_audio", ".wav")
        temp_files.append(processed_audio_path)
        if not process_guitar_audio(raw_audio_path, processed_audio_path):
            raise Exception("音频魔法注入失败")

        update_task_status(task_id, "processing", "正在提升画面质感并合成最终视频...")

        # 3. 调用 FFmpeg 进行画面美化与最终合成
        output_video_path = generate_temp_path("final_video", ".mp4")
        if not process_video_and_merge(input_video_path, processed_audio_path, output_video_path):
            raise Exception("画面美化与合成失败")

        # 4. 大功告成
        update_task_status(task_id, "completed", "处理完毕！", result_file=output_video_path)

    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg 命令执行失败: {e.stderr.decode()}")
        update_task_status(task_id, "failed", "音视频解析异常，请检查源文件")
    except Exception as e:
        logger.error(f"任务 {task_id} 执行异常: {str(e)}")
        update_task_status(task_id, "failed", f"服务器开小差了: {str(e)}")
    finally:
        # 清理过程中产生的所有输入和中间文件 (只保留输出视频)
        cleanup_files(temp_files)


# ==========================================
# 开放给微信小程序的 API 接口
# ==========================================

@router.post("/upload")
async def upload_and_process(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    接口 1: 接收视频上传，返回任务 ID，让服务器在后台慢慢跑
    """
    if not file.filename.lower().endswith(('.mp4', '.mov')):
        raise HTTPException(status_code=400, detail="仅支持 mp4 或 mov 格式的视频")

    # 1. 保存上传文件
    input_path = save_upload_file(file)

    # 2. 生成任务 ID 并初始化状态
    task_id = uuid.uuid4().hex
    update_task_status(task_id, "pending", "已加入处理队列...")

    # 3. 提交给 FastAPI 的后台任务队列
    background_tasks.add_task(process_task_pipeline, task_id, input_path)

    # 4. 立即响应前端，不让前端傻等
    return {"code": 0, "msg": "上传成功", "data": {"task_id": task_id}}


@router.get("/status/{task_id}")
async def get_status(task_id: str):
    """
    接口 2: 前端每隔 2 秒调用一次，查询当前进度
    """
    task_data = get_task_status_data(task_id)
    if not task_data:
        raise HTTPException(status_code=404, detail="任务不存在或已过期")

    return {"code": 0, "msg": "success", "data": task_data}


@router.get("/download/{task_id}")
async def download_result(task_id: str):
    """
    接口 3: 当 status 为 completed 时，前端调用此接口下载最终视频
    """
    task_data = get_task_status_data(task_id)
    if not task_data or task_data.get("status") != "completed":
        raise HTTPException(status_code=400, detail="视频尚未准备好")

    result_file = task_data.get("result_file")
    if not os.path.exists(result_file):
        raise HTTPException(status_code=404, detail="产物文件已丢失")

    return FileResponse(
        path=result_file,
        media_type="video/mp4",
        filename=f"guitar_beautified_{task_id[:6]}.mp4"
    )