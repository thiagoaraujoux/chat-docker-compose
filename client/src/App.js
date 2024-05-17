import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:3000');

function App() {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3000/api/rooms')
      .then(response => {
        setRooms(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the rooms!', error);
      });

    socket.on('roomMessages', (msgs) => {
      setMessages(msgs);
    });

    socket.on('chatMessage', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off('roomMessages');
      socket.off('chatMessage');
    };
  }, []);

  const joinRoom = (roomName) => {
    if (name !== '' && roomName !== '') {
      setRoom(roomName);
      setSelectedRoom(roomName);
      setMessages([]); // Clear previous messages
      socket.emit('joinRoom', { name, room: roomName });
    }
  };

  const createRoom = () => {
    if (room !== '') {
      axios.post('http://localhost:3000/api/rooms', { name: room })
        .then(response => {
          setRooms([...rooms, response.data]);
          joinRoom(response.data.name);
        })
        .catch(error => {
          console.error('There was an error creating the room!', error);
        });
    }
  };

  const sendMessage = () => {
    if (message !== '') {
      socket.emit('chatMessage', message);
      setMessage('');
    }
  };

  return (
    <div>
      <h1>Chat App</h1>
      <div>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <button onClick={createRoom}>Create Room</button>
      </div>
      <div>
        <h2>Rooms</h2>
        {rooms.map((r, index) => (
          <div key={index}>
            <button onClick={() => joinRoom(r.name)}>{r.name}</button>
          </div>
        ))}
      </div>
      {selectedRoom && (
        <div>
          <h2>Room: {selectedRoom}</h2>
          <div>
            <input
              type="text"
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
          <div>
            {messages.map((msg, index) => (
              <div key={index}>
                <strong>{msg.name}: </strong>
                <span>{msg.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
