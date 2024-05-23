import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './App.css'; // Import the CSS file

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
    <div className="wrapper">
      <div className="container">
        <h1>Salas de Chat</h1>
        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Nova sala"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <button onClick={createRoom}>Criar</button>
        <div className="rooms-container">
          {rooms.map((r, index) => (
            <button className="room-button" key={index} onClick={() => joinRoom(r.name)}>
              {r.name}
            </button>
          ))}
        </div>
      </div>

      {selectedRoom && (
        <div className="chat-container">
          <div className="chat-header">Chat da Sala: {selectedRoom}</div>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div className="message-container" key={index}>
                <strong>{msg.name}: </strong>
                <span>{msg.message}</span>
              </div>
            ))}
          </div>
          <input
            type="text"
            placeholder="Digite sua mensagem"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendMessage}>Enviar</button>
        </div>
      )}
    </div>
  );
}

export default App;
