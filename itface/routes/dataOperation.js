const Koa = require('koa')
const app = new Koa()
const router = require('koa-router')()
const { query } = require('./../config/dbPool');
const { QUERY_SQL, INSERT_SQL, UPDATE_SQL, DELETE_SQL } = require('./../config/dbSQL');
const path = require('path');
const server = require('http').createServer(app.callback());
const io = require('socket.io')(server,{
    cors: {
      origin: ["https://example.com", "http://127.0.0.1:5501"],
      allowedHeaders: ["my-custom-header"],
      methods: ["GET", "POST"],
      credentials: true
    }
})

function getLocalTime(n) {   
   return new Date(parseInt(n)).toLocaleString().replace(/:\d{1,2}$/,' ');   
}

io.on('connection',socket=>{
  console.log(getLocalTime(new Date().getTime()),new Date().getTime())
  socket.on('chatList',async data=>{
    const cList = await query(`SELECT * FROM chat_record WHERE uid='${data.uid}' or friendid = '${data.uid}'`)
    cList.results.map(cMap=>{
        let cMapC = cMap.content.split("-")
        cMapC.pop();
        let msgRecord = cMapC[cMapC.length-1].replace(/\'/g,'').split(",")
        let RecordObject = {
            id:msgRecord[0].split(":")[1],
            time:`${msgRecord[1].split(":")[1]}:${msgRecord[1].split(":")[2]}`,
            type:msgRecord[2].split(":")[1],
            msg:msgRecord[3].split(":")[1]
        }
        cMap['lastRecord'] = RecordObject
    })
    let uInforArr = [];
    let selectUserId ;
    for(let item of cList.results){
        item.uid == data.uid ? selectUserId = item.friendid : selectUserId = item.uid;
        const uInfor = await query(`SELECT * FROM user_table WHERE id='${selectUserId}'`);
        uInfor.results[0]['chatcontent'] = item.content;
        uInfor.results[0]['lastRe'] = item.lastRecord;
        uInforArr.push(uInfor.results[0])
    }
    socket.emit(`getIdMsg${data.uid}`,uInforArr)
  })
  socket.on('send',data=>{
    console.log(data);
    socket.emit(`lGetMsg${data.id}`,data.message);
  })
})
server.listen(3001)

//storage Chat
router.post('/storageChat',async ctx=>{
    const res = ctx.request.body;
    ctx.body = res;
})

//select chatList
router.post('/querychatList',async ctx=>{
    const res = ctx.request.body;
    const charLData = await query(`SELECT * FROM chat_record WHERE uid = ${res.uid} and friendid = ${res.friendid}`);
    const userData = await query(`SELECT * FROM user_table WHERE id = ${res.friendid}`);
    let Data = [];
    Data.push(charLData.results[0],userData.results[0])
    ctx.body = Data;
})

// wxapp
router.get('/queryAppid',async ctx=>{
    const wxList = await query(`SELECT * FROM wxlist`);
    ctx.body = wxList.results;
})

//userUpload
router.post('/upload',async ctx=>{
    const file = ctx.request.files.file.path
    const baseName = path.basename(file)
    ctx.body = `${ctx.origin}/images/${baseName}`
})

//登录
router.post('/login', async ctx=>{
    const res = ctx.request.body;
    const { username = '' , password = ''} = res;
    const queryData = {
        username,
    };
    const passData = {
        password,
    };
   const data = await query('SELECT * FROM user_table WHERE?',queryData);
   if(data && data.status && data.status === 200) {
       if(data.results.length == 0 ){
            ctx.body = {
                status:404,
                err: '账号不存在'
            };
       }else{
            const myDate = new Date();
            let mouth = myDate.getMonth()+1;   
            const nowTime = myDate.getFullYear() + '-' + mouth + '-' + myDate.getDate() + ' ' + myDate.getHours() + ':' + myDate.getMinutes() + ':' + myDate.getSeconds()
            const upTime = await query(`UPDATE user_table SET reclogin='${nowTime}' WHERE username='${data.results[0].username}'`);
            if(passData.password == data.results[0].password){
                if(data.results[0].status == 0){
                    ctx.body = {
                        status:402,
                        err: '账号已停封'
                    };
                }else if(data.results[0].status == 1){
                    ctx.body = {
                        status:200,
                        success: '登录成功',
                        data:data.results[0]
                        // token:token,
                    };
                }else{
                    ctx.body = {
                        status:401,
                        success: '账号异常/冻结'
                    };
                }
                
            }else{
                ctx.body = {
                    status:403,
                    err: '密码错误'
                };
            }
       }
   } else {
       ctx.body = data;
   }
})

//发布
router.post('/release',async ctx=>{
    const res = ctx.request.body;
    const myDate = new Date();
    let mouth = myDate.getMonth()+1;   
    const nowTime = myDate.getFullYear() + '-' + mouth + '-' + myDate.getDate() + ' ' + myDate.getHours() + ':' + myDate.getMinutes() + ':' + myDate.getSeconds()
    const { uid = '' , type = '' , content = '' , checktype = '' , picurl = '' ,creationtime = nowTime} = res;
    const releaseDream = {
        uid,
        type,
        content,
        checktype,
        picurl,
        creationtime
    }
    const data = await query('INSERT INTO dream SET?',releaseDream);
    if(data && data.status && data.status === 200) {
        ctx.body = {
            status: 200,
            msg: "发布成功",
        };
    } else {
        ctx.body = data;
    }
})
//查询
router.post('/querydream', async ctx =>{
    const res = ctx.request.body;
    //根据UID去查询相关字段，否则去查询全部
    if(res.uid == undefined || res.uid == null || res.uid == ''){
        const data = await query('SELECT * FROM dream');
        if(data && data.status && data.status === 200) {
            ctx.body = data;
        } else {
            ctx.body = data;
        }
    }else{
        if(res.order == undefined || res.order == null || res.order == ''){
            const data = await query(`SELECT * FROM dream WHERE uid = ${res.uid} ORDER BY creationtime desc LIMIT 5`);
            ctx.body = data;
        }else{
            const data = await query(`SELECT * FROM dream WHERE uid = ${res.uid} ORDER BY creationtime desc LIMIT 5`);
            ctx.body = data;
        }
    }
})

//暂时的注册
router.post('/reg', async ctx=>{
    const res = ctx.request.body;
    const myDate = new Date();
    let mouth = myDate.getMonth()+1;   
    const nowTime = myDate.getFullYear() + '-' + mouth + '-' + myDate.getDate() + ' ' + myDate.getHours() + ':' + myDate.getMinutes() + ':' + myDate.getSeconds()
    const { username = '' , password = '' , mphone = '' , reclogin = `${nowTime}` , regtime = `${nowTime}` , level = '1' ,  status = '1' , integral = 5 , identity = 1} = res;
    const selectuser = { username }
    const data = await query('SELECT * FROM user_table WHERE?',selectuser);
    if(data && data.status && data.status === 200) {
        if(data.results.length == 1 ){
            ctx.body = {
                err: '账号已存在'
            };
        }else{
            const regData = {
                username,
                password,
                mphone,
                regtime,
                reclogin,
                level,
                status,
                integral,
                identity,
            }
            const data = await query(`INSERT INTO user_table SET ?`, regData);
            if(data && data.status && data.status === 200) {
                ctx.body = {
                    status: 200,
                    msg: "注册成功",
                };
            } else {
                ctx.body = data;
            }
        }
    } else {
        ctx.body = data;
    }
})

// 插入
router.post('/save', async ctx => {
    const res = ctx.request.body;
    const { username = '', realname = '', password = '' } = res;
    if(username && realname) {
        const queryData = {
            username,
            realname,
            password,
        };
        const data = await query(INSERT_SQL, queryData);
        if(data && data.status && data.status === 200) {
            ctx.body = {
                status: 200,
                msg: "操作成功",
            };
        } else {
            ctx.body = data;
        }
    }
});

//更新
router.post('/update', async ctx => {
    const res = ctx.request.body;
    const { username = '', id= 1 } = res;
    if(username && id) {
        const queryData = [username, id];
        const data = await query(UPDATE_SQL, queryData);
        if(data && data.status && data.status === 200) {
            ctx.body = {
                status: 200,
                msg: "操作成功",
            };
        } else {
            ctx.body = data;
        }
    }
});

//根据主键id 删除
router.del('/delete', async ctx => {
    const res = ctx.request.body;
    const { id } = res;
    if(id) {
        const queryData = [id];
        const data = await query(DELETE_SQL, queryData);
        if(data && data.status && data.status === 200) {
            ctx.body = {
                status: 200,
                msg: "操作成功",
            };
        } else {
            ctx.body = data;
        }
    }
});

module.exports = router;