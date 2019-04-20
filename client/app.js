const CONFIG = require('config');
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

var debugTime,db;

function errorHandle(err) {
  wx.hideLoading();
  wx.showModal({
    content: err.toString(),
    showCancel: false,
    confirmText: "确定"
  })
} 
App({
  userId: '',
  config: null,
  records: [],
  monthTotal: 0,
  HOURSPERDAY: 8,//每天工作8个小时
  OFFTYPES: ['加班抵', '调休', '年休', '福利假', '缺勤'],
  WORKTYPES: ['+调休单', '计资'],
  isqy: false,
  onLaunch: function () {
    try{
      var res = wx.getSystemInfoSync()
      if (res.environment == "wxwork") {
        this.isqy = true;
      }
      if (wx.cloud) {
        wx.cloud.init();
        db = wx.cloud.database();
      }else{
        errorHandle('wx.cloud不支持，请先升级微信!')
      }
    }catch(e){
      console.log(e)
    }
  },
  /**
   * 查询openid
   */
  getUserId: function(cb){
    //判断运行环境,企业微信or微信
    let self = this;
    try {
      if (wx.cloud) {
        if (this.isqy){
          wx.qy.login({
            success(res) {
              if (res.code) {
                wx.cloud.callFunction({
                  name: 'login',
                  data: {
                    "code": res.code,
                  },
                  success(result) {
                    self.userId = result.result.openId;
                    if (cb && typeof cb == 'function')
                      cb()
                    console.log(result)
                  },
                  fail: console.error
                })
              }
            }
          })
        }else{
          wx.cloud.callFunction({
            name: 'login',
            data: {},
            success: function (res) {
              if (res.result.openId) {
                self.userId = res.result.openId;
                if (cb && typeof cb == 'function')
                  cb()
              } else {
                errorHandle('无法获取用户openid!')
              }
            },
            fail: console.error
          })
        }
      }
    } catch (e) {
      // Do something when catch error
      console.log(e.toString());
    }
  },
  /**
   * 查询config数据集中的用户配置
   */
  getConfig:function(callback){
    var self = this;
    wx.showLoading({
      title: '加载中',
    })
    // debugTime = new Date();
    db.collection('config').doc(`${this.userId}_cfg`).get().then(res => {
      // let timeNow = new Date();
      // console.log('获取config数据耗时：' + (timeNow - debugTime) / 1000 + 's')
      wx.hideLoading()
      callback(res.data);
    }, err => {
      if (err.errCode == -1) {
        // not found
        callback(null)
      }
    })
  },
  /**
   * 保存用户config配置
   */
  setConfig:function(data,cb){
    db.collection('config').doc(`${this.userId}_cfg`).set({
      data:data
    }).then(res => {
      if (cb && typeof cb == 'function')
      cb()
    }, errorHandle)
  },
  /**
   * 查询records数据
   */
  getRecords:function(cb){
    db.collection('records').where({
      _openid: this.userId
    }).limit(1000).orderBy('startDate', 'desc').get().then(res => {
      this.records = res.data;
      if (cb && typeof cb == 'function')
      cb()
    }, errorHandle)
  },
  /**
   * 新增record
   */
  addRecord:function(data,cb){
    db.collection('records').add({
      data: data
    }).then(res => {
      if (cb && typeof cb == 'function')
        cb()
    }, errorHandle)
  },
  /**
   * 更新record记录
   */
  updateRecord:function(id,data,cb){
    db.collection('records').doc(id).update({
      data: data
    }).then(res => {
      console.log(res)
      if (cb && typeof cb == 'function')
        cb()
    }, errorHandle)
  },
  /**
   * 删除record
   */
  deleteRecord: function (id,cb) {
    db.collection('records').doc(id).remove().then(res => {
      if (cb && typeof cb == 'function')
        cb()
    }, errorHandle)
  },
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
  },
  uploadLog:function(str){
    //调用云函数log
    if(wx.cloud){
      wx.cloud.callFunction({
        name: 'log',
        data: {
          "msg": JSON.stringify(str)
        },
        success: function (res) {
          console.log(res.result)
        },
        fail: console.error
      })
    }else{
      console.log(str);
    }
  }
})