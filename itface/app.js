const Koa = require('koa');
const koaBody = require('koa-body')
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const cors = require('koa-cors')
const static = require('koa-static')
const fs = require('fs')
const app = new Koa()
const https = require('https')
const sslify = require('koa-sslify').default
const http=require('http')
const path = require('path')

const index = require('./routes/index')
const users = require('./routes/users')
const dOp = require('./routes/dataOperation')
const pList = require('./routes/propertyList')


// error handler
onerror(app)

// //上传文件
app.use(koaBody({
  // 启用文件传输
  multipart: true,
  formidable: {
      // 上传目录,
      uploadDir: path.join(__dirname, '/public/images'),
      // 保留扩展名
      keepExtensions: true
  }
}))

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(cors())
// app.use(checkToken)
app.use(static(
  path.join(__dirname,'public')
))
app.use(logger())
// app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())
app.use(dOp.routes(), dOp.allowedMethods())
app.use(pList.routes(), pList.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

// module.exports = app
const options = {
    key: fs.readFileSync(path.resolve(__dirname,'./key/8403504_www.lyjcbb.com.key')),
    cert: fs.readFileSync(path.resolve(__dirname,'./key/8403504_www.lyjcbb.com.pem')),
}
const config = {
    port: 443
}

app.use(require('koa-static')('./public'))
app.use(sslify())

https.createServer(options, app.callback()).listen(config.port, (err) => {
    if (err) {
        console.log('服务启动出错', err);
    } else {
        console.log('服务器-server运行在' + config.port + '端口');
    }
});

http.createServer((req, res) => {
    res.writeHead(301, { 'Location': 'https://www.lyjcbb.com' });
    res.end();
}).listen(80);
