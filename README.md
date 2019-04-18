# wxapp-leave
个人休假管理小程序

## remark old backend of local branch
aws openapi:
https://4h81pu6x1c.execute-api.us-west-2.amazonaws.com/wxlogin

cloudant db
account: 3180299040
url: https://d6af5d07-c020-4554-a792-1a0967037e57-bluemix.cloudant.com/dashboard.html

leave apikey：
Key:ityousuchergeoundessened
Password:8de50b6a5182ce41e3faf08543373ba18e156f99
{_id:openid,config:config,records:records}

## record字段说明

1. +调休单记录的notes类型为number,存储剩余可用小时数;
2. 调休记录的notes类型为string,存储加班日期；
3. 其余记录的notes均为string,存储用户输入的备注信息；

## todo on server

1. server每月1日处理上月调休单的剩余可用小时数；
2. 添加删除调休记录时，server处理相应调休单的可用值；
3. 添加删除加班抵和调休单时，server自动处理当月调休单可用值；

