const express = require('express');
const app = express();
const server = require('http').Server(app);
const dev = process.env.NODE_ENV !== 'production';
const io = require('socket.io')(server);
const groupCallIo = require('socket.io')(server, {
  path: '/api/rooms'
});
//The custom server uses the following import to connect the server with the Next.js application:

const next = require('next');
const nextApp = next({ dev });

const handle = nextApp.getRequestHandler();
const connectDB = require('./utils/connectDB');
const PORT = process.env.PORT || 3000;

// Because of our setting , the server and client will both run on port 3000
// The following dotenv config will have access to .env file , so make sure it's named as .env and not .env.local .etc
require('dotenv').config();

if (process.env.NODE_ENV === 'production') {
  console.log = function () {};
}

connectDB()
  .then(() => {
    nextApp.prepare().then(() => {
      //routes
      app.use('/api/profile', require('./routes/profile'));
      app.use('/api/me', require('./routes/me'));
      app.use('/api/notifications', require('./routes/notifications'));
      app.use('/api/login', require('./routes/login'));
      app.use('/api/signup', require('./routes/signup'));
      app.use('/api/friends', require('./routes/friends'));
      app.use('/api/rooms', require('./routes/rooms'));
      app.use('/api/search', require('./routes/search'));
      app.use('/api/chats', require('./routes/chats'));
      app.use('/api/users', require('./routes/users'));
      app.use('/api/posts', require('./routes/posts'));
      app.use('/api/reset', require('./routes/reset'));
      app.all('*', (req, res) => handle(req, res));

      server.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`express server running on ${PORT}`);
      });
    });
  })
  .catch((err) => {
    if (err) console.log(err);
  });
app.use(express.json({ limit: '50mb' })); // this is the body parser
app.use(express.urlencoded({ limit: '50mb', extended: true })); //changed
// Socket.io

const {
  addUser,
  removeUser,
  findConnectedUsers
} = require('./utilsServer/roomActions');
const {
  loadMessages,
  sendMessage,
  setMessageToUnread
} = require('./utilsServer/messageActions');

const users = {};

// Group Call Socket
groupCallIo.on('connection', (socket) => {
  console.log('connected!!');

  if (!users[socket.id]) {
    users[socket.id] = socket.id;
  }
  console.log(users);

  socket.emit('yourID', socket.id);
  socket.emit('allUsers', users);
  socket.on('disconnect', () => {
    delete users[socket.id];
  });

  socket.on('callUser', (data) => {
    console.log('calling', data);
    groupCallIo.to(data.userToCall).emit('hey', {
      signal: data.signalData,
      from: data.from
    });
  });

  socket.on('acceptCall', (data) => {
    groupCallIo.to(data.to).emit('callAccepted', data.signal);
  });
});

// socket means the client user who is connected
io.on('connection', (socket) => {
  socket.on('join', async ({ userId }) => {
    // socket.id is auto generated by socket, regenerated at every connection.
    //  This is also the name of the room that the Socket automatically joins on connection
    console.log('userId', userId);
    const users = await addUser(userId, socket.id);
    console.log(users);

    // Sending back all the users other than the logged in user who has made the connection
    setInterval(() => {
      socket.emit('connectedUsers', {
        users: users.filter((user) => user.userId !== userId)
      });
    }, 10000);
  });

  socket.on('loadMessages', async ({ userId, messagesWith }) => {
    const { chat, error } = await loadMessages(userId, messagesWith);
    if (!error) {
      socket.emit('messagesLoaded', { chat });
    } else {
      socket.emit('noChatFound');
      console.log(error);
    }
  });

  socket.on('sendMessage', async ({ userId, messageSentTo, msg }) => {
    const { newMessage, error } = await sendMessage(userId, messageSentTo, msg);
    // check if user is online, if he is , then we'll directly send the message to the user
    console.log('before');
    const receiverSocket = findConnectedUsers(messageSentTo);
    if (receiverSocket) {
      console.log('after', receiverSocket, newMessage, 'new');

      // Send message to the specific user , so io.to()
      io.to(receiverSocket.socketId).emit('newMsgReceived', { newMessage });
      console.log('sent success');
    } else {
      // else we're setting unreadMessage to true so when the user logs in , he'll realise
      console.log('no');
      await setMessageToUnread(messageSentTo);
    }
    if (!error) {
      socket.emit('messageSent', { newMessage });
    } else {
      console.log(error);
    }
  });

  socket.on('disconnected', () => {
    removeUser(socket.id);
    console.log('user disconnected');
  });
});
