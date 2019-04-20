// 云函数入口文件
const cloud = require('wx-server-sdk')
const https = require('https')

cloud.init()
const db = cloud.database()
// 小程序关联企业信息
const CORPID = "ww2ed1065c58df4841";
const CORPSECRET = "YYvezS7GgBY05uSn4HAcm-F7yIcYrEusphOL0FKEEFM";

/**
 * getRequest，发起https.get请求
 * 返回promise
 */
const getRequest = function(url){
  return new Promise((resolve,reject)=>{
    https.get(url,(res)=>{
      res.on('data', (chunk)=>{
        try{
          let data = JSON.parse(chunk);
          resolve(data);
        }catch(err){
          reject(err)
        }
      })
    }).on('error',(err)=>{
      reject(err)
    })
  })
}
// 云函数入口函数
exports.main = async (event, context) => {
  try{
    const res = await getRequest('https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=' + CORPID + '&corpsecret=' + CORPSECRET)
    if (res.errcode == 0) {
      // 新建或修改数据token
      const saveres = await db.collection('token').doc(CORPID).set({
        data: {
          CORPID: CORPID,
          CORPSECRET: CORPSECRET,
          CORPREMARK: '测试企业号',
          token: res.access_token
        }
      })
    }
    return res
  }catch(e){
    console.error(e)
    return { "errcode": -1, "errmsg": e.toString() }
  }
}