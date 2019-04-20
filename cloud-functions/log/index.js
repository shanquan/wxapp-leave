exports.main = (event, context) => {
  if(event.msg)
    return {
      "errcode":0,
      "data": (new Date()).toLocaleString() + ":" + event.msg
    };
  return { "errcode": -1,"errmsg":null}
}