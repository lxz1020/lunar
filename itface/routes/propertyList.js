const Koa = require('koa')
const app = new Koa()
const router = require('koa-router')()
const { query } = require('./../config/dbPool');
const path = require('path');
const server = require('http').createServer(app.callback());
const koa2Req = require('koa2-request');

//select chatList
router.post('/querypList',async ctx=>{
    const res = ctx.request.body;
    const charLData = await query(`SELECT * FROM propertyList WHERE phoneNumber = ${res.phoneNumber}`);
    console.log(charLData)
    if(charLData.results.length>=1){
        ctx.body = {
            status:charLData.status,
            data:'用户已存在'
        }
    }else{
        const { nickName , avatarUrl ,  phoneNumber} = res;
        const pUserData = {
            nickName,
            avatarUrl,
            phoneNumber,
            identity:1
        }
        const data = await query(`INSERT INTO propertyList SET ?`, pUserData);
        ctx.body = {
            status:data.status,
            data:'用户添加成功'
        }
    }
})
router.post('/wxRouter',async ctx=>{
    const cts = ctx.request.body;
    console.log(cts.jsCode);
    const res = await koa2Req({
        url: `https://api.weixin.qq.com/sns/jscode2session?grant_type=authorization_code&appid=wxb1ba10458206b711&secret=4d494397b23ba05dd5db17da1a02ce9c&js_code=${cts.jsCode}`
    });
    ctx.body = res.body;
})

router.post('/insertList',async ctx=>{
    const res = ctx.request.body;
    const { name , carNumber , event , roomNum , phoneNum , hotel , intro , userphone , type , picture , causes , consequences} = res;
    const insertReport = {
        name,
        carNumber,
        event,
        roomNum,
        phoneNum,
        hotel,
        intro,
        userphone,
        type,
        status:0,
        consequences,
        causes,
        picture
    }
    const data = await query(`INSERT INTO report SET ?`, insertReport);
    if(data.status == 200){
        ctx.body = {
            status : 200,
            data : `添加成功`
        }
    }else{
        ctx.body = {
            status : 500,
            data : `添加失败`
        }
    }
})

router.post('/selectRecord',async ctx=>{
    const res = ctx.request.body;
    const { userphone } = res;
    const data = await query(`SELECT * FROM report WHERE userphone = ${userphone}`);
    ctx.body = data;
})

module.exports = router;