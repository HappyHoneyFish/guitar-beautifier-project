// app.js
App({
  onLaunch() {
    // 小程序冷启动时触发
    console.log('🎸 Guitar Beautifier is running...');
    
    // 检查小程序版本更新（大厂标准操作，保证即用即走的用户也能用到最新版）
    this.checkForUpdate();
  },

  /**
   * 检查并应用微信小程序的新版本
   */
  checkForUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      updateManager.onCheckForUpdate((res) => {
        // 请求完新版本信息的回调
        if (res.hasUpdate) {
          console.log('检测到新版本，准备下载...');
        }
      });

      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          confirmColor: '#0078D4', // Win11 经典 Fluent 蓝
          success(res) {
            if (res.confirm) {
              // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
              updateManager.applyUpdate();
            }
          }
        });
      });

      updateManager.onUpdateFailed(() => {
        wx.showToast({
          title: '新版本下载失败，请检查网络',
          icon: 'none'
        });
      });
    }
  },

  // 全局数据池
  globalData: {
    // 【重要配置】你的后端 API 基础路径
    // 生产环境务必替换为备案后的合法 HTTPS 域名，例如：'https://yourdomain.com/api/v1'
    // 本地调试时，如果开发者工具勾选了“不校验合法域名”，可填入你的服务器公网 IP：'http://你的IP:8000/api/v1'
    apiBaseUrl: 'https://yourdomain.com/api/v1',
    
    // 全局主题色配置（供 JS 逻辑中动态调用时保持 UI 一致性）
    theme: {
      primaryColor: '#0078D4',    // 核心交互色 (Fluent Blue)
      backgroundColor: '#F3F3F3', // 现代极简的浅灰背景
      cardColor: '#FFFFFF',       // 卡片纯白
      textColor: '#1A1A1A'        // 高对比度文本色
    }
  }
});