var app = getApp()
Page({
  data: {
    workFirstDate:'2016-01-01',
    date: app.formatDate(new Date()),
    today: app.formatDate(new Date())
  },
  onShow:function(){
    if(app.config){
      this.setData({
        workFirstDate: this.setInitialDate(app.config.initialDate, -1),
        date: app.config.baseDate,
        baseLeave: app.config.baseLeave,
        baseOff: app.config.baseOff
      })
    }
  },
  bindDateChange: function (e) {
    this.setData({
      date: e.detail.value
    })
  },
  bindwfDateChange:function(e){
    this.setData({
      workFirstDate: e.detail.value
    })
  },
  setInitialDate:function(dateString,yearPlus){
    var dashIndex = dateString.indexOf('-');
    var year = Number(dateString.substring(0, dashIndex));
    return (year + yearPlus) + dateString.substring(dashIndex);
  },
  formSubmit: function (e) {
    app.config = e.detail.value;
    if (app.config.baseOff == '') {
      app.config.baseOff = 0;
    }else{
      app.config.baseOff = Number(app.config.baseOff);
    }
    //工作起算日期一年后为年休起算日期
    app.config.initialDate = this.setInitialDate(app.config.initialDate,1);
    //计算工作还未满一年或者初始年休未设置，则初始年休为0
    if (this.data.today <= app.config.initialDate || app.config.baseLeave == ''){
      app.config.baseLeave = 0;
    }else{
      app.config.baseLeave = Number(app.config.baseLeave);
    }
    if (app.userId == 'localUser'){
      wx.setStorage({
        key: 'config',
        data: app.config,
        success: function (res) {
          wx.switchTab({
            url: '../query/query'
          })
        },
        fail: function (e) {
          wx.showModal({
            content: '设置失败，请重试！',
            showCancel: false,
            confirmText: "确定"
          })
        }
      })
    } else if (app.userId){
      app.putUserData(function(res){
        if (res.data.ok) {
          wx.switchTab({
            url: '../query/query'
          })
        } else {
          wx.showModal({
            content: '设置失败:' + res.error,
            showCancel: false,
            confirmText: "确定"
          })
        }
      })
    }
  },
  formReset: function (e) {
    this.setData({
      workFirstDate: '2017-01-01',
      date:this.data.today
    })
    if (app.config){
      wx.navigateBack();
    }
  }
})
