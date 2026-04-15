import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.process import router as process_router
from utils.file_handler import ensure_workspace

# 配置全局日志格式，方便在 Linux 服务器终端或日志文件中排错
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - [%(levelname)s] - %(message)s"
)
logger = logging.getLogger(__name__)

# 初始化 FastAPI 应用
app = FastAPI(
    title="Guitar Beautifier API",
    description="吉他音视频一键美化后端服务",
    version="1.0.0"
)


# 中间件配置
# 微信小程序虽然不受传统浏览器跨域限制，
# 但为了方便后续可能扩展的 Web 端后台管理，保留 CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 生命周期事件

@app.on_event("startup")
async def startup_event():
    """在服务器启动时执行的检查"""
    logger.info("🚀 正在启动 Guitar Beautifier 后端服务...")
    ensure_workspace()  # 确保临时文件目录已创建，防止运行时报错

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 服务正在关闭...")


# 路由注册

# 将 api/process.py 中的所有接口挂载到 /api/v1 前缀下
app.include_router(process_router, prefix="/api/v1", tags=["Video Processing"])

# 探活接口 (用于 Nginx 或监控系统检查服务器是否存活)
@app.get("/")
async def health_check():
    return {"status": "ok", "message": "Guitar Beautifier API is running."}