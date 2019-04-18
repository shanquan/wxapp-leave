# wxapp-leave
个人休假管理小程序

## record字段说明

1. +调休单记录的notes类型为number,存储剩余可用小时数;
2. 调休记录的notes类型为string,存储加班日期；
3. 其余记录的notes均为string,存储用户输入的备注信息；

## todo on server

1. server每月1日处理上月调休单的剩余可用小时数；
2. 添加删除调休记录时，server处理相应调休单的可用值；
3. 添加删除加班抵和调休单时，server自动处理当月调休单可用值；

