import os
import logging
from pedalboard import (
    Pedalboard,
    Compressor,
    Reverb,
    HighpassFilter,
    PeakFilter
)
from pedalboard.io import AudioFile

# 配置基础日志，方便在 Linux 服务器上排错
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def process_guitar_audio(input_file: str, output_file: str) -> bool:
    """
    核心算法：吉他音频修音（纯原生组件实现，无 VST 依赖）
    模拟【小振膜话筒】+【大教堂混响】
    """
    if not os.path.exists(input_file):
        logger.error(f"❌ 找不到输入音频: {input_file}")
        return False

    try:
        logger.info(f"🎸 开始处理音频，应用大师级 EQ 与空间参数: {input_file}")

        # 构建原生效果器链条
        board = Pedalboard([
            # ==========================================
            # A. 精准 EQ 整形 (完美替代 TDR Nova)
            # ==========================================
            # 1. 严格切除 60Hz 以下的所有无用低频噪音
            HighpassFilter(cutoff_frequency_hz=60.0),

            # 2. 找回“圆润”的琴箱共鸣（温暖的根音）
            PeakFilter(cutoff_frequency_hz=120.0, gain_db=4.0, q=0.7),

            # 3. 终结“闷葫芦音”：狠切中低频盒子音
            PeakFilter(cutoff_frequency_hz=350.0, gain_db=-6.0, q=1.0),

            # 4. 模拟小振膜的“通透感与空气感”（拨弦的泛音）
            PeakFilter(cutoff_frequency_hz=7500.0, gain_db=6.5, q=0.5),

            # ==========================================
            # B. 动态与空间塑造
            # ==========================================
            # 5. 动态压摆：极快的 attack (2ms) 压住扫弦毛刺
            Compressor(threshold_db=-22.0, ratio=3.5, attack_ms=2.0, release_ms=150.0),

            # 6. 大教堂混响 (Cathedral Reverb)：产生深邃的包裹感
            Reverb(room_size=1.0, damping=0.6, wet_level=0.45, dry_level=0.85)
        ])

        # 读取原始音频
        with AudioFile(input_file) as f:
            audio = f.read(f.frames)
            samplerate = f.samplerate

        # 应用效果器链
        processed_audio = board(audio, samplerate)

        # 写入处理后的音频
        with AudioFile(output_file, 'w', samplerate, processed_audio.shape[0]) as f:
            f.write(processed_audio)

        logger.info(f"✨ 音频处理完成！输出文件: {output_file}")
        return True

    except Exception as e:
        logger.error(f"❌ 音频处理过程中发生异常: {str(e)}")
        return False