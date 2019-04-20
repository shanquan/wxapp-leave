// 云函数入口文件
const cloud = require('wx-server-sdk')
const https = require('https')

cloud.init()
const db = cloud.database()
const CORPID = "ww2ed1065c58df4841";

/**
 * getRequest，发起https.get请求
 * 返回promise
 */
const getRequest = function (url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      res.on('data', (chunk) => {
        try {
          let data = JSON.parse(chunk);
          resolve(data);
        } catch (err) {
          reject(err)
        }
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
}

// 云函数入口函数
exports.main = async (event, context) => {
  // 微信内直接获取openid
  if(!event.code){
    return event.userInfo
  }
  // 企业微信内，传code获取session
  let accessToken = null;
  try{
    // 如果数据库里有token 
    const res = await db.collection('token').doc(CORPID).get();
    accessToken = res.data.token
  }catch(e){
    // 如果没有token,则调getToken云函数
    try{
      const res1 = await cloud.callFunction({
        name: 'getToken'
      })
      if (res1.result.errcode == 0) {
        accessToken = res1.result.access_token;
      } else {
        return res1
      }
    }catch(err){
      return err.toString()
    }
  }
  let result = await getRequest(`https://qyapi.weixin.qq.com/cgi-bin/miniprogram/jscode2session?access_token=${accessToken}&js_code=${event.code}&grant_type=authorization_code`)
  Object.assign(result, event.userInfo)
  return result
}