var app = getApp();
var tiaoxiuHours = 0;
var month;
Page({
  data: {
    array: app.OFFTYPES,
    offType:0,
    startDate: app.formatDate(new Date()),
    baseDate: '1900-01-01',
    type:'off',
    worktobe: app.WORKTYPES[0]
  },
  radioChange:function(e){
    this.setData({
      type: e.detail.value
    })
  },
  bindPickerChange: function(e) {
    this.setData({
      offType: e.detail.value
    })
  },
  bindStartDateChange:function(e){
    this.setData({
      startDate: e.detail.value
    })
  },
  switch1Change:function(e){
    this.setData({
      worktobe: e.detail.value ? app.WORKTYPES[0] : app.WORKTYPES[1]
    })
  },
  bindUseInput:function(e){
    var hours = e.detail.value;
    if (Math.floor(hours) !== hours && Math.floor(hours * 2) !== hours * 2){
      wx.showModal({
        content: '调休时长使用最小单位为0.5H!',
        showCancel: false,
        confirmText: "确定"
      })
      this.data.workList[e.target.dataset.key].usehours = 0;
      // e.target.value=0;
    } else if (hours > Number(e.target.dataset.maxval)){
      wx.showModal({
        content: '使用调休单不可超过可用值!',
        showCancel: false,
        confirmText: "确定"
      })
      this.data.workList[e.target.dataset.key].usehours = 0;
      // e.target.value = 0;
    }else{
      this.data.workList[e.target.dataset.key].usehours = hours;
    }
  },
  onShow: function () {
    var today = new Date();
    var mIndex = app.formatDate(today).lastIndexOf('-');
    month = app.formatDate(today).substring(0, mIndex);
    today.setFullYear(today.getFullYear()+1);
    var list =[];
    app.records.forEach((item, index) => {
      var valid = JSON.stringify(item).toLowerCase().indexOf(month.toLowerCase()) == -1 && item.typeDesc == app.WORKTYPES[0];
      var workItem = JSON.parse(JSON.stringify(item));
      if (Number(item.notes) > 0 && valid) {
        tiaoxiuHours += Number(item.notes);
        workItem.index = index;
        list.push(workItem);
      }
    });
    this.setData({
      // baseDate: app.config.baseDate,
      endDate: app.formatDate(today),
      workList: list
    })
  },
  checkHours: function (record){
    var hours = Number(record.hours);
    if (Math.floor(hours) === hours || Math.floor(hours*2) === hours*2){
      // 年休最小时长改为0.5H
      // if (record.type == 'off' && record.offtype == '2'){
      //   //年休时长为8*n+3.5||8*n+4.5||8*n的组合
      //   return hours % 8 == 3.5 || hours % 8 == 4.5 || hours % 8==0?true:false;
      // }else{
      //   return true;
      // }
      return true;
    }else{
      return false;
    }
  },
  checkLeaveLeft:function(record){
    if (record.type == 'off' && record.offtype == '2'){
      return Number(record.hours)<=app.leaveLeft?true:false;
    }else{
      return true;
    }
  },
  checkWorkLeft: function (record) {
    if (record.type == 'off' && record.offtype == '1') {
      return Number(record.hours) <= tiaoxiuHours ? true : false;
    } else {
      return true;
    }
  },
  checkUsedHours:function(record){
    if (record.type == 'off' && record.offtype == '1'){
      var usedSum = 0;
      for (var i = 0; i < this.data.workList.length; i++) {
        if (this.data.workList[i].usehours) {
          usedSum += Number(this.data.workList[i].usehours);
        }
      }
      return usedSum == record.hours;
    }else{
      return true;
    }
  },
  updateWorkList:function(){
    var list = [];
    app.records.forEach((item, index) => {
      var valid = JSON.stringify(item).toLowerCase().indexOf(month.toLowerCase()) == -1 && item.typeDesc == app.WORKTYPES[0];
      var workItem = JSON.parse(JSON.stringify(item));
      if (Number(item.notes) > 0 && valid) {
        tiaoxiuHours += Number(item.notes);
        workItem.index = index;
        list.push(workItem);
      }
    });
    this.setData({
      workList: list
    })
  },
  formSubmit: function (e) {
    var self = this;
    if (e.detail.value.hours===''){
      wx.showModal({
        content: "时长不能为空！",
        showCancel: false,
        confirmText: "确定"
      })
    } else if (this.checkHours(e.detail.value)===false){
      wx.showModal({
        content: '时长最小单位为0.5H!',
        showCancel: false,
        confirmText: "确定"
      })
    } else if (this.checkLeaveLeft(e.detail.value)===false){
      wx.showModal({
        content: '请核对年休时长小于本年度可用年休!',
        showCancel: false,
        confirmText: "确定"
      })
    } else if (this.checkWorkLeft(e.detail.value) === false) {
      wx.showModal({
        content: '请核对调休时长小于可用调休，本月请选择加班抵!',
        showCancel: false,
        confirmText: "确定"
      })
    } else if (this.checkUsedHours(e.detail.value) === false) {
      wx.showModal({
        content: '请核对调休单的数量之和需等于调休时长!',
        showCancel: false,
        confirmText: "确定"
      })
    }else{
      var notes = e.detail.value.notes;
      if (this.data.type == 'off' && this.data.offType=='1'){
        notes = '';
        //更新调休单剩余值
        this.data.workList.forEach(function (item) {
          if (Number(item.usehours)) {
            var leftHours = Number(app.records[item.index].notes);
            app.records[item.index].notes = leftHours - Number(item.usehours);
            notes += ';'+item.startDate + ':' + Number(item.usehours);
          }
        })
        notes = notes.substring(1);
      }
      let isThisMonth = JSON.stringify(e.detail.value.startDate).toLowerCase().indexOf(month.toLowerCase()) != -1;
      //如果添加加班（+调休单）,计算可用值
      if (this.data.type == 'work' && this.data.worktobe == app.WORKTYPES[0]){
        //计算本月可用加班
        if (isThisMonth){
          let list = app.records.filter((item) => {
            return (JSON.stringify(item).toLowerCase().indexOf(month.toLowerCase()) > -1);
          });
          var offSum = 0, workSum = 0;
          list.forEach(function (rec) {
            if (rec.type == 'off' && (rec.typeDesc == app.OFFTYPES[0] || rec.typeDesc == app.OFFTYPES[4])) {
              offSum += rec.hours;
            } else if (rec.type == 'work' && rec.typeDesc == app.WORKTYPES[0]) {
              workSum += rec.hours;
            }
          })
          app.monthTotal = workSum - offSum;
        }
        //如果是本月加班且本月统计为负，则对可用调休小时进行扣除
        if (isThisMonth&& app.monthTotal < 0){
          notes = Number(e.detail.value.hours) + app.monthTotal > 0 ? Number(e.detail.value.hours) + app.monthTotal : 0;
        }else{
          notes = Number(e.detail.value.hours);
        }
      }
      //本月添加加班抵时，自动扣除调休单剩余值；
      if (this.data.type == 'off' && this.data.offType == '0' && isThisMonth){      
        var leftHours = Number(e.detail.value.hours);
        for (var i = app.records.length-1; i>=0; i--) {
          if (JSON.stringify(app.records[i].startDate).toLowerCase().indexOf(month.toLowerCase()) != -1 && app.records[i].typeDesc == app.WORKTYPES[0] && Number(app.records[i].notes) > 0 && leftHours) {
          if (Number(app.records[i].notes) - leftHours>=0){
            app.records[i].notes = Number(app.records[i].notes) - leftHours;
            leftHours = 0;
            break;
          } else {
            leftHours = leftHours - Number(app.records[i].notes);
            app.records[i].notes = 0;
            continue; 
          }
        }
      }
    }
      var record = {
        type: e.detail.value.type,
        startDate: e.detail.value.startDate,
        typeDesc: e.detail.value.type == 'work' ? this.data.worktobe : app.OFFTYPES[this.data.offType],
        hours: Number(e.detail.value.hours),
        notes: notes
      }
      app.records.push(record);
      app.records = app.records.sort((a, b) => { return new Date(b.startDate) - new Date(a.startDate) });
      if (app.userId == 'localUser'){
        wx.setStorage({
          key: 'records',
          data: app.records,
          success: function (res) {
            //按时间倒序排序
            wx.showToast({
              title: '提交成功！'
            })
            if (self.data.type == 'off' && self.data.offType == '1') {
              self.updateWorkList();
            }
          },
          fail: function (res) {
            wx.showModal({
              content: '提交失败:' + res + '，请重试！',
              showCancel: false,
              confirmText: "确定"
            })
          }
        })
      } else if (app.userId) {
        app.putUserData(function (res) {
          if (res.data.ok) {
            wx.showToast({
              title: '提交成功！'
            })
            if (self.data.type == 'off' && self.data.offType == '1') {
              self.updateWorkList();
            }
          } else {
            wx.showModal({
              content: '提交失败:' + res.data.reason,
              showCancel: false,
              confirmText: "确定"
            })
          }
        })
      }
    }
  }
})
