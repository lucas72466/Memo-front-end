    const express = require('express');
    const webpackDevMiddleware = require('webpack-dev-middleware')
    const webpack = require('webpack')
    const config = require('./bundler/webpack.common.js')
    //webpack编译器
    const compiler = webpack(config)

    //实例化一个express实例
    const app = express()
    const http = require('http')
    const server = http.createServer(app)

    const { Server } = require("socket.io")
    const io = new Server(server)

    //告诉express使用webpack-dev-middleware
    app.use(webpackDevMiddleware(compiler,{
      //这里可以填写更多的配置项
    }))

    //创建旋转和位置词典
    var positionDic = {}
    var rotationDic = {}
    //监听client创建链接并启用监听
    io.on('connection', (socket) => {    
      
      //任意用户位置发生变化都会更新位置字典
      socket.on('clientPosition', (position) => {
        positionDic[socket.id] = position
        //将位置字典广播给每个client
        socket.emit('positionDic', positionDic)
      });

      //旋转词典
      socket.on('clientRotation', (rotation) => {
        rotationDic[socket.id] = rotation
        socket.emit('rotationDic', rotationDic)
      });
      
      
      //监听client断开链接事件
      socket.on('disconnect', () => {
        //删除用户位置信息
        delete positionDic[socket.id]
        delete rotationDic[socket.id]
      });

    });
    

    //将服务器开到3000端口
    server.listen(3000, () => {
      console.log('listening on *:3000');
    });
