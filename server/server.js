const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server); // Removido o objeto de configuração do CORS

app.use(cors());
app.use(express.json());

const connectWithRetry = () => {
  console.log('MongoDB connection with retry');
  mongoose.connect('mongodb://mongo:27017/chat-db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log('MongoDB is connected');
  }).catch(err => {
    console.error('MongoDB connection unsuccessful, retry after 5 seconds.', err);
    setTimeout(connectWithRetry, 5000);
  });
};

connectWithRetry();

const messageSchema = new mongoose.Schema({
  room: String,
  name: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const roomSchema = new mongoose.Schema({
  name: String,
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);
const Room = mongoose.model('Room', roomSchema);

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const newRoom = new Room({ name: req.body.name });
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (err) {
    res.status(500).send(err);
  }
});

io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('joinRoom', async ({ name, room }) => {
    socket.join(room);
    socket.room = room;
    socket.username = name;

    try {
      const messages = await Message.find({ room }).sort({ timestamp: 1 });
      socket.emit('roomMessages', messages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  });

  socket.on('chatMessage', async (msg) => {
    const newMessage = new Message({
      room: socket.room,
      name: socket.username,
      message: msg
    });

    try {
      await newMessage.save();
      io.to(socket.room).emit('chatMessage', newMessage);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
