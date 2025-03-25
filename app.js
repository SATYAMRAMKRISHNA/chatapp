require('dotenv').config();
var mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI);
const app = require('express')();
const http = require('http').Server(app);
const userRoute = require('./routes/userRoute');
const User = require('./models/userModels');
const Chat = require('./models/chatModel');
const { dirname } = require('path');
const PORT = process.env.PORT || 3000 ;

app.use('/',userRoute);
const io = require('socket.io')(http);
var usp = io.of('/user-namespace');
usp.on('connection',async function(socket){
    console.log('user connected');
    var userId = socket.handshake.auth.token;
    await User.findByIdAndUpdate({_id: userId},{$set:{is_online:'1'}});

    socket.broadcast.emit('getOnlineUser',{user_id:userId});


    socket.on('disconnect',async function(){
        console.log('user disconnet');
        await User.findByIdAndUpdate({_id: userId},{$set:{is_online:'0'}});
        socket.broadcast.emit('getOfflineUser',{user_id:userId});

    });

    //chatting implementation
    socket.on('newChat', function(data){
        socket.broadcast.emit('loadNewChat',data);
    });

    //load old chats
    socket.on('existsChat', async function(data){
        var chats = await Chat.find({$or:[
            {sender_id:data.sender_id, receiver_id:data.receiver_id},
            {sender_id:data.receiver_id, receiver_id:data.sender_id},
        ]});

        socket.emit('loadChats',{chats: chats});

    });

    //delete chats
    socket.on('chatDeleted', function(id){
        socket.broadcast.emit('chatMessageDeleted', id);
    });

    socket.on('chatUpdated', function(data){
        socket.broadcast.emit('chatMessageUpdated', data);
    });

    //new group chat added
    socket.on('newGroupChat', function(data){
        socket.broadcast.emit('loadNewGroupChat', data);
    });

    socket.on('groupChatDeleted', function(id){
        socket.broadcast.emit('groupChatMessageDeleted', id);
    });

    socket.on('groupChatUpdated', function(data){
        socket.broadcast.emit('groupChatMessageUpdated', data);
    });


});
http.listen(PORT,()=>{
    console.log(`server is running on ${PORT}`);
});
