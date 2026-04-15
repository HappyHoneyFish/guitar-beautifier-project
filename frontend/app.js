// app.js
App({
  onLaunch() {    
    // 检查小程序版本更新
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
          confirmColor: '#0078D4', 
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
    apiBaseUrl: 'https://gaiwithus.top/api/v1',
    
    // 全局主题色配置
    theme: {
      primaryColor: '#0078D4',    
      backgroundColor: '#F3F3F3', 
      cardColor: '#FFFFFF',       
      textColor: '#1A1A1A'        
    }
  }
});