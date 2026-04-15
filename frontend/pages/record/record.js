// pages/record/record.js

Page({
  data: {
    devicePosition: 'back', // 默认后置摄像头 (吉他手通常用后置录制以获得更好的画质与收音)
    isRecording: false,     // 是否正在录制
    recordingTime: 0,       // 录制时长(秒)
    videoPath: '',          // 录制完成后的本地临时绝对路径
  },

  timer: null,              // 计时器句柄
  cameraCtx: null,          // 相机上下文实例

  onLoad() {
    // 页面加载时初始化相机上下文
    this.cameraCtx = wx.createCameraContext();
  },

  onShow() {
    // 每次回到页面时，如果之前没有保留视频，确保重置UI状态
    if (!this.data.videoPath) {
      this.resetState();
    }
  },

  onHide() {
    // 页面隐藏时（例如突然接电话、切出微信），如果是正在录制状态，必须强制停止并保存
    if (this.data.isRecording) {
      this.stopRecord();
    }
  },

  onUnload() {
    this.clearTimer();
  },


  // 录制交互逻辑

  startRecord() {
    if (!this.cameraCtx) return;

    // 给予短暂震动反馈，提升物理按压质感
    wx.vibrateShort({ type: 'medium' });

    this.cameraCtx.startRecord({
      success: () => {
        this.setData({ 
          isRecording: true,
          recordingTime: 0
        });
        this.startTimer();
      },
      fail: (err) => {
        console.error('开始录制失败', err);
        wx.showToast({ title: '相机启动失败，请重试', icon: 'none' });
      }
    });
  },

  stopRecord() {
    if (!this.data.isRecording || !this.cameraCtx) return;

    wx.vibrateShort({ type: 'light' });
    this.clearTimer();

    this.cameraCtx.stopRecord({
      success: (res) => {
        this.setData({
          isRecording: false,
          videoPath: res.tempVideoPath 
        });
      },
      fail: (err) => {
        console.error('停止录制失败', err);
        this.setData({ isRecording: false });
        wx.showToast({ title: '保存录像失败', icon: 'error' });
      }
    });
  },

  // 用户不满意，重新录制
  reRecord() {
    wx.showModal({
      title: '重新录制',
      content: '当前视频将会丢失，确定要重录吗？',
      confirmColor: '#0078D4', // 调用 Fluent Blue
      success: (res) => {
        if (res.confirm) {
          this.resetState();
        }
      }
    });
  },


  // 跳转逻辑 (将原始文件交给处理页)

  submitBeautify() {
    const { videoPath } = this.data;
    if (!videoPath) {
      wx.showToast({ title: '视频文件异常，请重试', icon: 'error' });
      return;
    }

    // 对本地路径进行 URL 编码，防止特殊字符导致传参截断
    const encodedPath = encodeURIComponent(videoPath);
    
    // 跳转至结果页，并将原视频路径带过去。
    // 我们不在录制页做上传网络请求，遵循单一职责原则，让页面职责更清晰
    wx.navigateTo({
      url: `/pages/result/result?sourcePath=${encodedPath}`,
    });
  },


  // 辅助与状态管理

  switchCamera() {
    // 录制过程中禁止翻转镜头，防止底层进程崩溃
    if (this.data.isRecording) return;
    
    const newPosition = this.data.devicePosition === 'back' ? 'front' : 'back';
    this.setData({ devicePosition: newPosition });
    wx.vibrateShort({ type: 'light' });
  },

  onCameraError(e) {
    // 处理用户残忍拒绝相机权限的情况
    console.error('相机权限拒绝或设备故障', e);
    wx.showModal({
      title: '未授权使用相机',
      content: '请点击右上角「···」-「设置」，允许小程序使用摄像头和麦克风。',
      showCancel: false,
      confirmColor: '#0078D4'
    });
  },

  startTimer() {
    this.clearTimer();
    this.timer = setInterval(() => {
      this.setData({
        recordingTime: this.data.recordingTime + 1
      });
      
      // 微信小程序单次录制通常有最大限制，这里设定 60 秒兜底机制
      if (this.data.recordingTime >= 60) {
        this.stopRecord();
        wx.showToast({ title: '已达到最大录制时长', icon: 'none' });
      }
    }, 1000);
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  resetState() {
    this.clearTimer();
    this.setData({
      isRecording: false,
      recordingTime: 0,
      videoPath: ''
    });
  }
});