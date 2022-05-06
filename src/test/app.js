const io = require('socket.io-client');

const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwic3RhdHVzIjoxLCJpYXQiOjE2MDIwNjkyNzgsImV4cCI6MTcyMjA2OTI3OH0.EGXvS6FiACK9t1rkUDPR-yOqCRAPTE58X7_g6e4G1q0`;
const socket = io(`https://dotachan-api.test.amela.vn?role=app`);

console.log('Trying connect to socket server...');
socket.on('connect', () => {
  console.log('Connected...');
  socket.emit('authenticate', { token: token }).on('unauthorized', (msg) => {
    console.log(`unauthorized: ${JSON.stringify(msg.data)}`);
    throw new Error(msg.data.type);
  });

  socket.emit('hello', 'Hello socket');

  socket.emit('joinConversation', { conversationId: 1 });
  // socket.emit('joinAdminConversation', { conversationId: 16 });

  // setTimeout(() => {
  //   socket.emit('leaveConversationAdmin', { conversationId: 16 });
  // }, 3000);

  socket.on('disconnect', (reason) => {
    console.log('Disconnected, reason: ' + reason);
  });
});
socket.on('conversations', (data) => {
  console.log(data);
});

socket.on('readAllMessage', (data) => {
  console.log(data);
});

socket.on('messages', (data) => {
  console.log(data);
});

socket.on('notification', (data) => {
  console.log(data);
});
