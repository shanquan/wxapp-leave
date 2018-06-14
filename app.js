const wxopenidURL = require('./config').wxopenidURL;
const userURL = require('./config').userURL;
const userAuth = 'dGhpY2hlc3NpbGRlZW50ZW50aW9uZWRzOjYyNzk5ZjNiYTAwMTE4ODUzMmZkMWQxZTZlYjMyZmI4M2I4YjA2N2U=';
const leavesURL = require('./config').leavesURL;
const leavesAuth = "Y2F1dGVydml0eWFyY2xvbmVyYXRlbmNlOjA1MzQ2NmJjN2QxNDFhZTc1MGZjMTA3YzFiYTQwODQyNjYyZTc2NmU=";
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
var debugTime;
App({
  onLaunch: function () {
  },
  getUserData:function(callback){
    var self = this;
    wx.showLoading({
      title: '加载中',
    })
    // debugTime = new Date();
    wx.request({
      url: leavesURL + '/'+this.userId,
      header:{
        Authorization: 'Basic ' + leavesAuth
      },
      success: function (res) {
        // let timeNow = new Date();
        // console.log('leaveURL获取数据耗时：' + (timeNow - debugTime) / 1000 + 's')
        wx.hideLoading()
        self._rev = res.data._rev;
        callback(res);
      }
    })
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
    var self = this
    wx.showLoading({
      title: '加载中',
    })
    // debugTime = new Date();
      //调用登录接口
      wx.login({
        success: function (res) {
          //请求openid和session_key
          wx.request({
            url: wxopenidURL + '/?code=' + res.code,
            success: function (res) {
              var dataRes = res.data;
              // let timeNow = new Date();
              // console.log('wxopenid耗时：'+ (timeNow-debugTime)/1000+'s')
              // debugTime = timeNow;
              //根据openid请求userID是否存在
              if (dataRes.openid){
                wx.request({
                  url: userURL + '/' + dataRes.openid,
                  header: {
                    Authorization: 'Basic ' + userAuth
                  },
                  success: function (res) {
                    // let timeNow = new Date();
                    // console.log('wxuser请求openid耗时：' + (timeNow - debugTime) / 1000 + 's')
                    // debugTime = timeNow;
                    if (res.data.error == 'not_found') {
                      var userId = self.uuid();
                      //新建userId写入db
                      wx.request({
                        url: userURL + '/' + dataRes.openid,
                        method: 'PUT',
                        header: {
                          Authorization: 'Basic ' + userAuth
                        },
                        data: {
                          userId: userId,
                          session_key: dataRes.session_key
                        },
                        success: function (res) {
                          wx.hideLoading()
                          if (res.data.result=='ok') {
                            self.userId = userId;
                            wx.setStorageSync('userId', self.userId);
                            typeof cb == "function" && cb(self.userId)
                          } else {
                            //创建user失败...
                            errorHandle();
                          }
                        }
                      })
                    } else if (res.data.userId) {
                      self.userId = res.data.userId;
                      wx.setStorageSync('userId', self.userId);
                      typeof cb == "function" && cb(self.userId)
                    } else if (!res.data.userId){
                      var userId = self.uuid();
                      //更新userId写入db
                      wx.request({
                        url: userURL + '/' + dataRes.openid,
                        method: 'PUT',
                        header: {
                          Authorization: 'Basic ' + userAuth
                        },
                        data: {
                          userId: userId,
                          session_key: dataRes.session_key,
                          _rev: res.data._rev
                        },
                        success: function (res) {
                          wx.hideLoading()
                          if (res.data.ok) {
                            self.userId = userId;
                            wx.setStorageSync('userId', self.userId);
                            typeof cb == "function" && cb(self.userId)
                          } else {
                            //创建user失败...
                            errorHandle();
                          }
                        }
                        })
                    }
                  },
                  fail: function (res) {
                    //无法获取openid
                    errorHandle();
                  }
                })
              }else{
                //无法获取openid
                errorHandle();
              }
            }
          })
        },
        fail:function(res){
          //登录失败
          errorHandle();
        }
      }) 
    //示例在线失败错误处理
    function errorHandle(){
      wx.showModal({
        content: '服务器连接错误，将转为本地离线存储数据!',
        showCancel: false,
        confirmText: "确定"
      })
      self.userId = 'localUser';
      wx.setStorageSync('userId', self.userId);
      typeof cb == "function" && cb(self.userId)
    } 
  },
  userId: wx.getStorageSync('userId') || '',
  config: wx.getStorageSync('config') || null,
  records: wx.getStorageSync('records') || [],
  monthTotal:0,
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