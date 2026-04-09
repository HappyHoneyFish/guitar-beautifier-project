import os
import uuid
import shutil
import logging
from fastapi import UploadFile

logger = logging.getLogger(__name__)

# 定义临时工作目录 (位于 backend/temp_workspace)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMP_WORKSPACE = os.path.join(BASE_DIR, "temp_workspace")


def ensure_workspace():
    """确保临时工作目录存在"""
    if not os.path.exists(TEMP_WORKSPACE):
        os.makedirs(TEMP_WORKSPACE, exist_ok=True)
        logger.info(f"📁 创建临时工作目录: {TEMP_WORKSPACE}")


def save_upload_file(upload_file: UploadFile) -> str:
    """
    保存前端上传的视频文件到临时目录。
    使用 UUID 生成唯一文件名，彻底杜绝高并发下的文件读写冲突。
    """
    ensure_workspace()

    # 获取原始文件的扩展名 (防错处理，默认给 .mp4)
    ext = os.path.splitext(upload_file.filename)[1]
    if not ext:
        ext = ".mp4"

    unique_filename = f"input_{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(TEMP_WORKSPACE, unique_filename)

    try:
        # 使用 shutil 高效写入本地磁盘
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        logger.info(f"⬇️ 成功接收并保存用户上传文件: {file_path}")
        return file_path
    except Exception as e:
        logger.error(f"❌ 保存上传文件失败: {str(e)}")
        raise e
    finally:
        # 释放 FastAPI 内部的文件句柄
        upload_file.file.close()


def generate_temp_path(prefix: str = "temp", suffix: str = ".wav") -> str:
    """
    为处理过程中的中间产物（剥离的音频、修音后的音频、最终合成视频）生成绝对路径。
    """
    ensure_workspace()
    unique_filename = f"{prefix}_{uuid.uuid4().hex}{suffix}"
    return os.path.join(TEMP_WORKSPACE, unique_filename)


def cleanup_files(file_paths: list):
    """
    无情的文件清道夫。
    在 API 请求生命周期结束时（无论成功还是抛出异常）调用，确保服务器磁盘不被垃圾文件塞满。
    """
    for path in file_paths:
        if path and os.path.exists(path):
            try:
                os.remove(path)
                logger.info(f"🗑️ 已清理临时文件: {path}")
            except Exception as e:
                logger.warning(f"⚠️ 无法清理临时文件 {path}: {str(e)}")