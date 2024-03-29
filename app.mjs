import express from 'express';
import http from 'http';
import {Server} from 'socket.io'
import { fileURLToPath } from 'url';
import { dirname,join } from 'path';
// import {setup, draw} from './src/sketch.js'


const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('A client connected.');

    // 发送'init'消息给客户端
    socket.emit('init');

    // 监听客户端发送的消息
    socket.on('message', (message) => {
        console.log('Received message:', message);
        
        // 广播消息给所有客户端
        io.emit('message', message);
    });

    // 监听客户端断开连接事件
    socket.on('disconnect', () => {
        console.log('A client disconnected.');
    });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set('view engine', 'hbs');
app.set('views', join(__dirname, 'views'));
// 配置静态文件目录
app.use(express.static(join(__dirname)));
app.use(express.urlencoded({ extended: true }));

// app.get('/',(req,res)=>{
//     res.render('home')
// })
app.get('/', (req, res) => {
    res.render('login'); // 返回登录页面
  });

app.get('/register', (req, res) => {
    res.render('register'); // 返回注册页面
  });

  app.post('/login', (req, res) => {
    const username= req.body.username; // 假设表单中有名为 roomNumber 的字段
    // 重定向到相应的房间页面
    res.redirect(`/home/${username}`);
});

// 房间页面路由，根据房间号动态渲染页面
app.get('/home/:username', (req, res) => {
    const username = req.params.username;
    // 渲染房间页面，传递房间号到页面
    res.render('home', { username });
});

// 处理表单提交，重定向到房间页面
app.post('/join-room/:username', (req, res) => {
    const roomNumber = req.body.roomNumber; // 假设表单中有名为 roomNumber 的字段
    const username = req.params.username;
    // 重定向到相应的房间页面
    res.redirect(`/room/${roomNumber}/${username}`);
});

// 房间页面路由，根据房间号动态渲染页面
app.get('/room/:roomNumber/:username', (req, res) => {
    const roomNumber = req.params.roomNumber;
    const username = req.params.username;
    // 渲染房间页面，传递房间号到页面
    res.render('room', { roomNumber,username });
});




server.listen(process.env.PORT || 3000);
