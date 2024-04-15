import './config.mjs'
import express from 'express';
import http from 'http';
import { Server } from 'socket.io'
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { run, createMeet, createUser,addUserToMeeting, findCurrentMeet, findPastMeet, findUser, deletePastMeet, check_closeRoom } from './db.mjs';
// import {setup, draw} from './src/sketch.js'


run()
const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('A client connected.');

    // 发送'init'消息给客户端
    socket.emit('init');

    // //create meeting room
    // socket.on('create-room', async(data)=>{
    //     const {roomNumber,username}=data;
    //     console.log()
    // })

    //join the room
    socket.on('join-room',async (data)=>{
        const {roomNumber,username}=data;
        const room=await findCurrentMeet(roomNumber);
        if (room){
            socket.join(roomNumber);
            socket.to(roomNumber).emit("user-joined",username);
            socket.emit('user-list',room.currentUsers);
        }
    })
    // 监听客户端发送的消息
    socket.on('sketch', (data) => {
        
        const {roomNumber,username,fingerTrails}=data;
        // 广播消息给所有客户端
        io.to(roomNumber).emit('sketch',{username,roomNumber,fingerTrails})
    });

    // 监听客户端断开连接事件
    socket.on('disconnect', async (data) => {
        const {roomNumber,username}=data;
        await check_closeRoom(username,roomNumber);
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
    res.render('register');
})

app.post('/register', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    await createUser({
        username:username,
        password:password,
        meetings: [],
    })
    res.redirect(`/`)
})
app.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    res.redirect(`/home/${username}`)
});
app.get('/home/:username', async (req, res) => {
    const username = req.params.username;
    let meetings=[];
    try {
        const user = await findUser(username);
        if(user){
        if (user.meetings.length > 0) {
            meetings = await Promise.all(
                user.meetings.map(async (meetingId) => {
                    const meeting = await findPastMeet(meetingId);
                    return meeting;
                })
            );
        } 
    }
        res.render('home', { username, meetings });
    } catch (error) {
        console.error('获取会议历史时发生错误:', error);
        res.status(500).send('Internal Server Error');
    }
});

// 房间页面路由，根据房间号动态渲染页面
// app.get('/home/:username', async (req, res) => {
//     const username = req.params.username;
//     const meetings=await findUser(username);
//     const history = await Promise.all(
//         meetings.map(async (meetingId) => {
//           const meeting = await findPastMeet(meetingId);
//           return meeting;
//         })
//       );
//     console.log(history)
//     // 渲染房间页面，传递房间号到页面
//     res.render('home', { username ,history});
// });

// 处理表单提交，重定向到房间页面
app.post('/join-room/:username', (req, res) => {
    const roomNumber = req.body.roomNumber; // 假设表单中有名为 roomNumber 的字段
    const username = req.params.username;
    addUserToMeeting(username,roomNumber)
    // 重定向到相应的房间页面
    res.redirect(`/room/${roomNumber}/${username}`);
});

app.post('/create-room/:username', async (req, res) => {

    const roomNumber = req.body.roomNumber; // 假设表单中有名为 roomNumber 的字段
    const roomName = req.body.roomName;
    const username = req.params.username;
    // 重定向到相应的房间页面
    await createMeet(username, {
        meetingID: roomNumber,
        meetingName: roomName,
        startAt: Date.now(),
        meetingUsers: [],
        currentUsers: []
    })
    res.redirect(`/room/${roomNumber}/${username}`);
})
app.post('/delete/:username/:meetingID', async (req, res) => {
    const meetingID = req.params.meetingID;
    const username = req.params.username;
    try {
        await deletePastMeet(username, meetingID);
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Error when deleting the meeting history' });
    }
})

// 房间页面路由，根据房间号动态渲染页面
app.get('/room/:roomNumber/:username', async (req, res) => {
    const roomNumber = req.params.roomNumber;
    const username = req.params.username;
    const room = await findCurrentMeet(roomNumber);
    const roomName=room.meetingName;
    // 渲染房间页面，传递房间号到页面
    res.render('room', { roomNumber, username, roomName});
});

app.post('/close-connection/:roomNumber/:username', async (req, res) => {
    // 关闭数据库连接的逻辑
    const username=req.params.username;
    const roomNumber = req.params.roomNumber
    await check_closeRoom(username,roomNumber);
    res.json({ success: true });

});



server.listen(process.env.PORT ?? 3000);
