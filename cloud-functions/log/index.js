exports.main = (event, context) => {
  if(event.url&&event.url=="login")
    return event.userInfo
  if(event.msg)
    return {
      "code":0,
      "msg": (new Date()).toLocaleString() + ":" + event.msg
    };
  return {"code":-1,"msg":null}
}