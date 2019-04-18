var app = getApp();
var editItemKey,editItemValue,editItemMaxVal;
Page({
  data: {
    units: 'D',
    list:[],
    workSum:[0,0],
    offSum:[0,0,0,0,0],
    hideCancel:true,
    showModal: false,
    newNotes:''
  },
  initialList:function(){
    this.setData({
      list: app.records
    })
  },
  switch1Change:function(e){
    this.setData({
      units: e.detail.value ? 'D' : 'H',
      workSum: this.unitData(e.detail.value,this.data.workSum),
      offSum: this.unitData(e.detail.value, this.data.offSum)
    })
  },
  searchFocus:function(e){
    this.setData({
      hideCancel:false
    })
  },
  searchBlur:function(e){
    this.setData({
      hideCancel: true
    })
  },
  searchInput:function(e){
    let val = e.detail.value;
    if (val && val.trim() != '') {
      this.setData({
        list: app.records.filter((item) => {
          return (JSON.stringify(item).toLowerCase().indexOf(val.toLowerCase()) > -1);
        })
      })
    }else{
      this.setData({
        list: app.records
      })
    }
  },
  cancelSearch:function(e){
    this.setData({
      hideCancel: true,
      inputVal:''
    })
    this.initialList();
  },
  unitData:function(bool,array){
    if(bool){
      return array.map(val => val / app.HOURSPERDAY);
    }else{
      return array.map(val => val * app.HOURSPERDAY);
    }
  },
  onShow: function () {
    var list = app.records;
    var workSum = [0, 0];
    var offSum = [0, 0, 0, 0, 0];
    var self = this;
    list.forEach(function(rec){
      if (rec.typeDesc =='+调休单'){
        workSum[0] += self.data.units=='D'?rec.hours / app.HOURSPERDAY:rec.hours;
      } else if (rec.typeDesc == '计资'){
        workSum[1] += self.data.units == 'D' ? rec.hours / app.HOURSPERDAY : rec.hours;
      } else if (rec.typeDesc == '加班抵') {
        offSum[0] += self.data.units=='D'?rec.hours / app.HOURSPERDAY:rec.hours;
      } else if (rec.typeDesc == '调休') {
        offSum[1] += self.data.units=='D'?rec.hours / app.HOURSPERDAY:rec.hours;
      } else if (rec.typeDesc == '年休') {
        offSum[2] += self.data.units=='D'?rec.hours / app.HOURSPERDAY:rec.hours;
      } else if (rec.typeDesc == '福利假') {
        offSum[3] += self.data.units=='D'?rec.hours / app.HOURSPERDAY:rec.hours;
      } else if (rec.typeDesc == '缺勤') {
        offSum[4] += self.data.units=='D'?rec.hours / app.HOURSPERDAY:rec.hours;
      }
    })
    this.setData({
      list: list,
      workSum: workSum,
      offSum: offSum
    })
  },
  editItem:function(e){
    //如果是调休单，则可编辑可用值(notes)
    if (e.target.dataset.item.typeDesc == app.WORKTYPES[0]) {
       editItemKey= e.target.dataset.key;
       editItemValue = e.target.dataset.item.notes;
       editItemMaxVal = e.target.dataset.item.hours;
      this.setData({
        showModal: true,
        newNotes: e.target.dataset.item.notes
      })
    }
  },
  inputChange:function(e){
    editItemValue = e.detail.value;
  },
  onCancel:function(e){
    this.setData({
      showModal: false,
      newNotes:''
    })
  },
  onConfirm:function(e){
    if (editItemValue > editItemMaxVal){
      wx.showModal({
        content: '可用值不能超过加班小时数!',
        showCancel: false,
        confirmText: "确定"
      })
    } else if (Math.floor(editItemValue) !== editItemValue && Math.floor(editItemValue * 2) !== editItemValue * 2){
      wx.showModal({
        content: '可用值修改最小单位为0.5!',
        showCancel: false,
        confirmText: "确定"
      })
    }else{
      app.updateRecord(app.records[editItemKey]._id,{
        notes: editItemValue ? editItemValue : 0
      },()=>{
        wx.showToast({
          title: '成功',
          icon: 'success',
          duration: 2000
        })
        app.records[editItemKey].notes = editItemValue ? editItemValue : 0;
        this.setData({
          showModal: false,
          list: app.records
        })
      })
    }
  },
  deleteItem:function(e){
    var self= this;
    wx.showModal({
      title: '请确定是否删除？',
      confirmText: "删除",
      cancelText: "取消",
      success: function (res) {
        if (res.confirm) {
          app.deleteRecord(app.records[e.target.dataset.key]._id,()=>{
            wx.showToast({
              title: '成功',
              icon: 'success',
              duration: 2000
            })
            app.records.splice(e.target.dataset.key, 1);
            //删除调休时，恢复可用调休单 todo on server
            if (e.target.dataset.item.typeDesc == app.OFFTYPES[1]) {
              var txList = e.target.dataset.item.notes.split(';');
              txList.forEach(function (item) {
                item = item.split(':');
                for (var i = 0; i < app.records.length; i++) {
                  if (app.records[i].typeDesc == app.WORKTYPES[0] && app.records[i].startDate == item[0]) {
                    app.updateRecord(app.records[i]._id,{
                      notes: Number(app.records[i].notes) + Number(item[1])
                    })
                    app.records[i].notes = Number(app.records[i].notes) + Number(item[1]);
                    break;
                  }
                }
              })
            }

            //删除本月加班抵时，自动恢复调休单可用值 todo on server
            var today = app.formatDate(new Date());
            var mIndex = today.lastIndexOf('-');
            var month = today.substring(0, mIndex);
            if (e.target.dataset.item.typeDesc == app.OFFTYPES[0] && JSON.stringify(e.target.dataset.item.startDate).toLowerCase().indexOf(month.toLowerCase()) != -1 && (e.target.dataset.item.hours + app.monthTotal) > 0) {
              var hoursPlus = app.monthTotal >= 0 ? e.target.dataset.item.hours : e.target.dataset.item.hours + app.monthTotal;
              for (var i = 0; i < app.records.length; i++) {
                if (JSON.stringify(app.records[i].startDate).toLowerCase().indexOf(month.toLowerCase()) != -1 && app.records[i].typeDesc == app.WORKTYPES[0] && hoursPlus > 0) {
                  if (Number(app.records[i].notes) + hoursPlus <= app.records[i].hours) {
                    app.updateRecord(app.records[i]._id, {
                      notes: Number(app.records[i].notes) + hoursPlus
                    })
                    app.records[i].notes = Number(app.records[i].notes) + hoursPlus;
                    break;
                  } else {
                    hoursPlus = hoursPlus + Number(app.records[i].notes) - app.records[i].hours;
                    app.updateRecord(app.records[i]._id, {
                      notes: app.records[i].hours
                    })
                    app.records[i].notes = app.records[i].hours;
                    continue;
                  }
                } else if (JSON.stringify(app.records[i].startDate).toLowerCase().indexOf(month.toLowerCase()) == -1 || hoursPlus <= 0) {
                  break;
                }
              }
            }
            updateView();
          })
        }
      }
    })
    function updateView() {
      self.setData({
        list: app.records
      })
      var workSum = self.data.workSum;
      var offSum = self.data.offSum;
      var rec = e.target.dataset.item;
      app.WORKTYPES.forEach(function (val, index) {
        if (rec.typeDesc == val) {
          workSum[index] -= self.data.units == 'H' ? rec.hours : rec.hours / app.HOURSPERDAY;
          self.setData({
            workSum: workSum
          })
        }
      })
      app.OFFTYPES.forEach(function (val, index) {
        if (rec.typeDesc == val) {
          offSum[index] -= self.data.units == 'H' ? rec.hours : rec.hours / app.HOURSPERDAY;
          self.setData({
            offSum: offSum
          })
        }
      })
    }
  }
})
