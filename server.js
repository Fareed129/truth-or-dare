const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

let rooms = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
    socket.on('createRoom', (roomCode) => {
        if (!rooms[roomCode]) {
            rooms[roomCode] = [socket.id];
            socket.join(roomCode);
            socket.emit('roomCreated', roomCode);
        } else {
            socket.emit('error', 'Room already exists');
        }
    });

    socket.on('joinRoom', (roomCode) => {
        if (rooms[roomCode] && rooms[roomCode].length === 1) {
            rooms[roomCode].push(socket.id);
            socket.join(roomCode);
            socket.emit('roomJoined', roomCode);
            io.to(roomCode).emit('startGame', rooms[roomCode]);
        } else {
            socket.emit('error', 'Room is full or does not exist');
        }
    });

    socket.on('spinBottle', (roomCode) => {
        const randomIndex = Math.floor(Math.random() * rooms[roomCode].length);
        io.to(roomCode).emit('bottleSpun', rooms[roomCode][randomIndex]);
    });

    socket.on('truthOrDare', (data) => {
        io.to(data.roomCode).emit('truthOrDare', data);
    });

    socket.on('submitQuestion', (data) => {
        io.to(data.roomCode).emit('receiveQuestion', data);
    });

    socket.on('submitAnswer', (data) => {
        io.to(data.roomCode).emit('receiveAnswer', data);
    });

    socket.on('disconnect', () => {
        for (const roomCode in rooms) {
            rooms[roomCode] = rooms[roomCode].filter(id => id !== socket.id);
            if (rooms[roomCode].length === 0) {
                delete rooms[roomCode];
            }
        }
    });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
