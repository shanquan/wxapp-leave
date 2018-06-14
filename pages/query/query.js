var app = getApp()
Page({
  data: {
    date: app.formatDate(new Date()),
    today: app.formatDate(new Date()),
    units: 'D',
    leaveLeft:0,
    offLeft: 0, 
    monthData: {
      month: '',
      totalClass: 'positive',
      totalNum: '0H',
      list: []
    }
  },
  onLoad: function () {
    var self = this;
    if (app.userId === '') {
      wx.showModal({
        title: '数据存储是否在线存储？',
        content: '如选否则仅在本地存储且无法跨终端同步，如果选是则需要用户同意授权允许微信登录。',
        confirmText: "是",
        cancelText: "否",
        success: function (res) {
          if (res.confirm) {
            app.getUserId(function (userId) {
              if (userId =='localUser'){
                if (!app.config) {
                  wx.redirectTo({
                    url: '../common/config'
                  })
                }
              }else{
                self.getUserData();
              }
            })
          } else if (res.cancel) {
            app.userId ='localUser';
            wx.setStorageSync('userId', app.userId);
            if (!app.config){
              wx.redirectTo({
                url: '../common/config'
              })
            }
          }
        }
      })
    } else if (app.userId != 'localUser'){
      self.getUserData();
    }
  },
  getUserData:function(){
    var self = this;
    app.getUserData(function (res) {
      if (res.data.error == 'not_found'){
        wx.redirectTo({
          url: '../common/config'
        })
      } else if (res.data._id){
        app.config = res.data.config;
        app.records = res.data.records||[];
        self.initialData();
      }
    })
  },
  bindbtnConfig:function(e){
    wx.navigateTo({
      url: '../common/config'
    })
  },
  switch1Change: function(e){
    var leaveLeft = this.data.leaveLeft;
    var offLeft = this.data.offLeft;
    this.setData({
      units: e.detail.value?'D':'H',
      leaveLeft: e.detail.value ? leaveLeft / app.HOURSPERDAY : leaveLeft * app.HOURSPERDAY,
      offLeft: e.detail.value ? offLeft / app.HOURSPERDAY : offLeft * app.HOURSPERDAY
    })
  },
  bindDateChange: function(e) {
    this.setData({
      date: e.detail.value,
      leaveLeft: this.getLeave(e.detail.value)
    })
  },
  //休假类型为加班抵或缺勤则进行统计
  checkOffType:function(desc){
    if (desc == app.OFFTYPES[0] || desc == app.OFFTYPES[4]){
      return true;
    }else{
      return false;
    }
  },
  //数据初始化
  initialData:function(){
    var mIndex = this.data.today.lastIndexOf('-');
    var month = this.data.today.substring(0, mIndex);
    var list = app.records.filter((item) => {
      return (JSON.stringify(item).toLowerCase().indexOf(month.toLowerCase()) > -1);
    });
    var totalClass = 'positive', totalNum = '0 H';
    var offSum = 0, workSum = 0;
    var self = this;
    list.forEach(function (rec) {
      if (rec.type == 'off' && self.checkOffType(rec.typeDesc)) {
        offSum += rec.hours;
      } else if (rec.type == 'work' && rec.typeDesc == app.WORKTYPES[0]) {
        workSum += rec.hours;
      }
    })
    app.monthTotal = workSum - offSum;
    if (app.monthTotal >= 0) {
      totalNum = "+ " + (app.monthTotal).toString() + " H";
    } else {
      totalClass = 'assertive';
      totalNum = (app.monthTotal).toString() + " H";
    }
    //截止今日可用年休
    var leaveLeft = this.getLeave(this.data.date);
    //提交事假可用年休不能超过本年度可用年休
    var yearLeaves = new Date().getFullYear();
    yearLeaves = yearLeaves+'-12-31';
    yearLeaves = this.getLeave(yearLeaves);
    app.leaveLeft = this.data.units == 'D' ? Number(yearLeaves) * 8 : Number(yearLeaves);
    this.setData({
      leaveLeft: leaveLeft,
      offLeft: this.getOff(),
      monthData: {
        month: month,
        totalClass: totalClass,
        totalNum: totalNum,
        list: list
      }
    })
  },
  onShow: function () {
    if(app.config){
      this.initialData();
    }
  },
  daysCount : function (sd, nd) {//计算任意两个日期之间的天数/365
    return Math.abs(sd - nd) / (1000 * 60 * 60 * 24) / 365
  },
  //计算任意两个日期之间的年休,sd到nd;ssd为开始计算年休日期
  leaveCount : function (ssd, sd, nd) {
    ssd = new Date(ssd);
    sd = new Date(sd);
    nd = new Date(nd);
    var sumleave = 0;//计算享有年休
    if (sd >= nd || ssd >= nd) {
      return sumleave;
    } else if (ssd > sd) {
      var ssd10 = ssd.setFullYear(ssd.getFullYear() + 9);
      var ssd20 = ssd.setFullYear(ssd.getFullYear() + 10);
      if (nd <= ssd10) {// ssd->nd->ssd10->ssd20
        sumleave += this.daysCount(ssd, nd) * 5;
      } else if (ssd10 < nd && nd < ssd20) {// ssd->ssd10->nd->ssd20
        sumleave += 50 + this.daysCount(ssd10, nd) * 10;
      } else if (ssd20 <= nd) {//ssd->ssd10->ssd20->nd
        sumleave += 50 + 100 + this.daysCount(ssd20, nd) * 15;
      }
    } else if (ssd <= sd) {//计算sd->nd
      var ssd10 = ssd.setFullYear(ssd.getFullYear() + 9);
      var ssd20 = ssd.setFullYear(ssd.getFullYear() + 10);
      if (nd <= ssd10) {//sd->nd->ssd10
        sumleave += this.daysCount(sd, nd) * 5;
      } else if (sd < ssd10 && ssd10 < nd && nd <= ssd20) {//sd->ssd10->nd->ssd20
        sumleave += this.daysCount(sd, ssd10) * 5 + this.daysCount(ssd10, nd) * 10;
      } else if (ssd10 <= sd && nd <= ssd20) {//ssd10->sd->nd->ssd20
        sumleave += this.daysCount(sd, nd) * 10;
      } else if (ssd10 <= sd && sd < ssd20 && ssd20 < nd) {//ssd10->sd->ssd20->nd
        sumleave += this.daysCount(sd, ssd20) * 10 + this.daysCount(ssd20, nd) * 15;
      } else if (ssd20 <= sd) {//ssd10->ssd20->sd->nd
        sumleave += this.daysCount(sd, nd) * 15;
      } else if (sd < ssd10 && ssd20 < nd) {//sd->ssd10->ssd20->nd
        sumleave += this.daysCount(sd, ssd10) * 5 + 100 + this.daysCount(ssd20, nd) * 15;
      }
    }
    return sumleave;
  },
  getTypeHours : function (type,typeDesc) { //获取用户记录中的某类型的假期和
    var hours = 0;
    var records = app.records.filter(rec => rec.startDate >= app.config.baseDate);
    if (records.length>0){
      records.forEach(function (rec) {
        if (rec.type == type && rec.typeDesc == typeDesc) {
          hours += rec.hours;
        }
      })
    }
    return hours;
  },
  getLeave:function(date){
    var results=0;
    if (this.data.units=="D"){
      results = this.leaveCount(app.config.initialDate, app.config.baseDate, date) + app.config.baseLeave - this.getTypeHours('off', app.OFFTYPES[2]) / app.HOURSPERDAY;
    }else{
      results = (this.leaveCount(app.config.initialDate, app.config.baseDate, date) + app.config.baseLeave) * app.HOURSPERDAY - this.getTypeHours('off', app.OFFTYPES[2]);
    }
    //小数位数最多4位
    if (results.toString().indexOf('.')>0&&results.toString().split(".")[1].length>4){
      results = results.toFixed(4);
    }
    return results;
  },
  getOff:function(){
    var hours = 0;
    if (app.records.length > 0) {
      app.records.forEach(function (rec) {
        if (rec.type == 'work') {
          hours += Number(rec.notes);
        }
      })
    }
    if (this.data.units == 'D') {
      return hours / app.HOURSPERDAY;
      // return app.config.baseOff + (this.getTypeHours('work', app.WORKTYPES[0]) - this.getTypeHours('off', app.OFFTYPES[0]) - this.getTypeHours('off', app.OFFTYPES[1])) / app.HOURSPERDAY;
    }else{
      return hours;
      // return app.config.baseOff * app.HOURSPERDAY + this.getTypeHours('work', app.WORKTYPES[0]) - this.getTypeHours('off', app.OFFTYPES[0]) - this.getTypeHours('off', app.OFFTYPES[1]);
    }
  },
  onShareAppMessage: function () {
    var shareData= {
      title: '休假查询',
      path: '/pages/query/query'
    }
    return shareData
  }
})
