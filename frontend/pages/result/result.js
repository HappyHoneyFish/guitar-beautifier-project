// pages/result/result.js
const request = require('../../utils/request.js');

Page({
  data: {
    sourcePath: '',        // 录像页传过来的原视频路径
    resultPath: '',        // 从服务器下载的美化后视频路径
    taskId: '',            // 后端分配的任务ID
    
    status: 'pending',     // 页面状态: pending, processing, completed, failed, network_error
    processMsg: '正在准备魔法引擎...', 
    estimatedTime: 15,     // 预估剩余时间（秒）
  },

  pollingTimer: null,      // 轮询定时器
  countdownTimer: null,    // 倒计时定时器

  onLoad(options) {
    // 1. 接收录制页传来的原视频路径
    if (options.sourcePath) {
      const decodedPath = decodeURIComponent(options.sourcePath);
      this.setData({ sourcePath: decodedPath });
      
      // 2. 自动开始处理流程
      this.startProcess(decodedPath);
    } else {
      this.showError('未找到视频源文件，请返回重试');
    }
  },

  onUnload() {
    // 页面销毁（比如用户中途点击左上角返回）时，务必清理所有定时器防内存泄漏
    this.clearTimers();
  },

  clearTimers() {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  },


  // 流程：上传 -> 轮询 -> 下载

  async startProcess(filePath) {
    try {
      this.setData({ status: 'pending', processMsg: '正在安全上传视频原件...' });

      // 阶段 1：上传文件
      const taskId = await request.uploadVideo(filePath);
      
      this.setData({ 
        taskId, 
        status: 'processing', 
        processMsg: '已进入服务器处理队列...' 
      });

      // 开启UX优化：模拟倒计时，缓解用户等待焦虑
      this.startCountdown();

      // 阶段 2：开始轮询状态
      this.pollStatus(taskId);

    } catch (error) {
      this.showError(error.message);
    }
  },

  pollStatus(taskId) {
    // 每隔 2 秒向服务器询问一次进度
    this.pollingTimer = setInterval(async () => {
      try {
        const taskData = await request.getTaskStatus(taskId);

        // 容忍轻微网络波动
        if (taskData.status === 'network_error') {
           this.setData({ processMsg: taskData.message });
           return;
        }

        // 实时同步后端的友好提示语
        this.setData({ processMsg: taskData.message });

        if (taskData.status === 'completed') {
          // 阶段 3：服务器处理完毕，准备下载
          this.clearTimers();
          this.setData({ processMsg: '处理完成！正在为您下载高清原片...' });
          await this.downloadResultVideo(taskId);
          
        } else if (taskData.status === 'failed') {
          this.clearTimers();
          this.showError(taskData.message || '服务器处理发生异常');
        }
      } catch (error) {
         this.clearTimers();
         this.showError(error.message);
      }
    }, 2000); 
  },

  async downloadResultVideo(taskId) {
    try {
      const tempFilePath = await request.downloadResult(taskId);
      // 阶段 4：切换页面状态到对比播放模式
      this.setData({
        status: 'completed',
        resultPath: tempFilePath
      });
      // 成功震动反馈
      wx.vibrateSuccess && wx.vibrateSuccess();
    } catch (error) {
      this.showError(error.message);
    }
  },

  // 极简假倒计时逻辑（因为真实视频处理时长不可预测，此举纯为提升安全感）
  startCountdown() {
    this.setData({ estimatedTime: 18 });
    this.countdownTimer = setInterval(() => {
      let current = this.data.estimatedTime;
      if (current > 1) {
        this.setData({ estimatedTime: current - 1 });
      } else {
        // 卡在 1 秒，直到真实下载完成
        this.setData({ estimatedTime: 0 }); 
      }
    }, 1000);
  },

  showError(msg) {
    this.setData({
      status: 'failed',
      processMsg: msg
    });
  },


  // 保存与分享

  saveAndShare() {
    const { resultPath } = this.data;
    if (!resultPath) return;

    wx.showLoading({ title: '正在保存到相册...', mask: true });

    wx.saveVideoToPhotosAlbum({
      filePath: resultPath,
      success: () => {
        wx.hideLoading();
        wx.vibrateShort({ type: 'heavy' });
        
        // 遵循微信限制，标准的大厂引导分享话术
        wx.showModal({
          title: '✨ 视频已保存',
          content: '由于微信官方规则限制，请您手动打开朋友圈，从相册中选择刚刚保存的视频进行发布。',
          confirmText: '我知道了',
          confirmColor: '#0078D4', // Fluent Blue
          showCancel: false
        });
      },
      fail: (err) => {
        wx.hideLoading();
        
        // 用户曾残忍拒绝过相册权限
        if (err.errMsg.includes('auth deny') || err.errMsg.includes('auth denied')) {
          wx.showModal({
            title: '需要保存权限',
            content: '需要访问您的相册才能将美化后的视频保存下来哦。',
            confirmColor: '#0078D4',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting(); // 引导用户去设置页开启权限
              }
            }
          });
        } else if (err.errMsg !== 'saveVideoToPhotosAlbum:fail cancel') {
          // 排除用户自己点取消的情况
          wx.showToast({ title: '保存失败，请检查手机存储空间', icon: 'none' });
        }
      }
    });
  },

  goBack() {
    // 直接返回录像页。由于没有保存到本地存储，
    // 页面销毁后临时视频文件会被微信静默清理，完美实现即用即走
    wx.navigateBack({
      delta: 1
    });
  }
});