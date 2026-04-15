// utils/request.js

// 动态获取全局配置，防止在 app.js 初始化完成前报错
const getAppInstance = () => getApp();

/**
 * 核心网络请求工具类
 * 严格对应后端的三个 API：上传 (/upload)、轮询 (/status)、下载 (/download)
 */
const request = {
  // 获取基础 URL
  getBaseUrl() {
    const app = getAppInstance();
    // 如果由于某种原因获取不到 globalData，提供一个本地回退地址防崩
    return app ? app.globalData.apiBaseUrl : 'http://127.0.0.1:8000/api/v1';
  },

  /**
   * 1. 上传原视频到服务器
   * @param {string} filePath - 微信本地临时视频路径
   * @returns {Promise<string>} resolve 返回后端的 task_id
   */
  uploadVideo(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${this.getBaseUrl()}/upload`,
        filePath: filePath,
        name: 'file', // 必须与 FastAPI 接口中声明的参数名完全一致
        timeout: 60000, // 视频较大，给足 60 秒的上传时间
        success: (res) => {
          try {
            // 注意注意，wx.uploadFile 返回的 res.data 永远是 String，必须手动 Parse！
            const data = JSON.parse(res.data);
            
            if (res.statusCode === 200 && data.code === 0) {
              resolve(data.data.task_id);
            } else {
              // 兼容 FastAPI 的异常字段 detail 和我们自定义的 msg
              reject(new Error(data.detail || data.msg || '服务器拒绝了上传请求'));
            }
          } catch (e) {
            reject(new Error('服务器响应格式异常'));
          }
        },
        fail: (err) => {
          reject(new Error(err.errMsg || '网络超时，请检查您的网络环境'));
        }
      });
    });
  },

  /**
   * 2. 查询任务处理状态 (用于轮询)
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 包含 status(状态) 和 message(前端进度提示词) 的对象
   */
  getTaskStatus(taskId) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.getBaseUrl()}/status/${taskId}`,
        method: 'GET',
        timeout: 10000, 
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 0) {
            resolve(res.data.data);
          } else {
            reject(new Error(res.data.detail || '查询进度失败'));
          }
        },
        fail: (err) => {
          // 轮询时的单次网络波动不需要抛出致命错误，我们只需返回特殊状态让前端重试
          resolve({ status: 'network_error', message: '网络波动，正在重连...' });
        }
      });
    });
  },

  /**
   * 3. 下载美化完成的视频
   * @param {string} taskId - 任务ID
   * @returns {Promise<string>} resolve 返回下载到用户手机的临时文件路径 tempFilePath
   */
  downloadResult(taskId) {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: `${this.getBaseUrl()}/download/${taskId}`,
        timeout: 60000,
        success: (res) => {
          if (res.statusCode === 200) {
            // 下载成功，返回微信本地临时路径，随后可用此路径调用保存相册的 API
            resolve(res.tempFilePath);
          } else {
            reject(new Error(`下载视频失败，错误码: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(new Error(err.errMsg || '下载中断，请检查网络空间或网络连接'));
        }
      });
    });
  }
};

module.exports = request;