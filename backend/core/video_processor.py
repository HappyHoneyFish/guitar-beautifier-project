import os
import logging
import subprocess

logger = logging.getLogger(__name__)


def process_video_and_merge(input_video: str, processed_audio: str, output_video: str) -> bool:
    """
    核心算法：视频画面轻量美化 + 音视频合并
    利用 FFmpeg 内置滤镜实现非 AI 风格的通透感与柔和感。
    """
    if not os.path.exists(input_video) or not os.path.exists(processed_audio):
        logger.error(f"❌ 找不到输入文件: 视频={input_video}, 音频={processed_audio}")
        return False

    logger.info(f"🎬 开始处理视频并合并音频: {output_video}")


    # FFmpeg 滤镜参数设计 (针对手机自拍/后置录制吉他场景)


    # 1. hqdn3d (高质量 3D 降噪):
    # 这里我们把空间平滑参数调高一点(luma_spatial=5, chroma_spatial=5)，
    # 时间平滑保持默认。这会产生一种极轻微的“物理磨皮/柔光”效果，掩盖手机镜头的暗部噪点。
    # 2. eq (色彩均衡):
    # contrast=1.05 (稍微拉高一点对比度，去灰)
    # saturation=1.15 (稍微增加色彩饱和度，让肤色和吉他木纹更生动)
    # brightness=0.02 (提亮画面)
    video_filters = "hqdn3d=5:5:4:4,eq=contrast=1.05:saturation=1.15:brightness=0.02"

    # 构建 FFmpeg 命令
    command = [
        "ffmpeg",
        "-y",  # 强制覆盖输出文件
        "-i", input_video,  # 输入 0: 原视频
        "-i", processed_audio,  # 输入 1: 修好的音频

        # 滤镜设置
        "-vf", video_filters,

        # 流映射：视频取自输入 0，音频取自输入 1
        "-map", "0:v:0",
        "-map", "1:a:0",

        # 视频编码设置 (针对 2核 CPU 优化)
        "-c:v", "libx264",  # 微信小程序兼容性最好的 H.264 编码
        "-preset", "veryfast",  # 编码速度设为 veryfast，减少 2核 CPU 压力
        "-crf", "23",  # 视觉无损的压缩质量控制 (18-28，越小质量越高，23 是极佳的平衡点)
        "-pix_fmt", "yuv420p",  # 强制像素格式，防止部分手机录制的奇葩格式导致朋友圈绿屏/黑屏

        # 音频编码设置
        "-c:a", "aac",  # 微信要求音频最好是 aac
        "-b:a", "256k",  # 既然是吉他音乐，给足 256kbps 的高比特率保留高频细节

        output_video
    ]

    try:
        # 执行命令，设置 5 分钟超时，防止死锁卡死服务器
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=300,
            text=True
        )

        if result.returncode == 0:
            logger.info("✨ 视频画面美化及音视频合并完成！")
            return True
        else:
            logger.error(f"❌ FFmpeg 处理失败，返回码: {result.returncode}")
            logger.error(f"FFmpeg 错误输出: {result.stderr}")
            return False

    except subprocess.TimeoutExpired:
        logger.error("❌ FFmpeg 处理超时！服务器可能负载过高。")
        return False
    except Exception as e:
        logger.error(f"❌ 执行 FFmpeg 时发生未知错误: {str(e)}")
        return False