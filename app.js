const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
var debugTime;
App({
  onLaunch: function () {
  },
  putUserData:function(callback){
    var self = this;
    wx.showLoading({
      title: '加载中',
    })
    // debugTime = new Date();
    wx.request({
      url: leavesURL + '/' + this.userId,
      method: 'PUT',
      header: {
        Authorization: 'Basic ' + leavesAuth
      },
      data: {
        config: this.config,
        records: this.records,
        _rev: this._rev
      },
      success: function (res) {
        // let timeNow = new Date();
        // console.log('leaveURL写数据耗时：' + (timeNow - debugTime) / 1000 + 's')
        wx.hideLoading()
        self._rev = res.data.rev;
        callback(res);
      }
    })
  },
  getUserId: function (cb) {
    this.userId = 'localUser';
    wx.setStorageSync('userId', this.userId);
    typeof cb == "function" && cb(this.userId) 
  },
  userId: wx.getStorageSync('userId') || 'localUser',
  config: wx.getStorageSync('config') || null,
  records: wx.getStorageSync('records') || [],
  monotal:0,
  HOURSPERDAY: 8,//每天工作8个小时
  OFFTYPES: ['加班抵', '调休', '年休', '福利假', '缺勤'],
  WORKTYPES: ['+调休单', '计资'],
  formatNumber: function(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
  },
  formatDate: function(date) {
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()
    return [year, month, day].map(this.formatNumber).join('-');
  },
  uuid:function(){
    var chars = CHARS, uuid = new Array(36), rnd = 0, r;
    for (var i = 0; i < 36; i++) {
      if (i == 8 || i == 13 || i == 18 || i == 23) {
        uuid[i] = '-';
      } else if (i == 14) {
        uuid[i] = '4';
      } else {
        if (rnd <= 0x02) rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
        r = rnd & 0xf;
        rnd = rnd >> 4;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
    return uuid.join('');  
  }
})