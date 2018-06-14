/**
 * 小程序配置文件
 */

var host = "shanquan.cloudant.com"

var config = {

    // 下面的地址配合云端 Server 工作
    host,
    wxopenidURL: 'https://4h81pu6x1c.execute-api.us-west-2.amazonaws.com/wxlogin',
    userURL: `https://${host}/wxusers`,
    leavesURL: `https://${host}/leaves`
};

module.exports = config