const fs = require('fs');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const MAIN_INTERMISSION_PASSWORD = 'pleasure';
const ALERT_PASSWORD = 'happiness';

io.on('connection', (socket) => {
    console.log(`user connected: ${socket.id}`);
    socket.on('register', ({ username, password }) => {
        if(users[username]) {
            socket.emit('registerResult', { success: false, message: 'This name is existing.' });
        } else {
            users[username] = { password: password, takenModals: [] };
            saveUsers();
            socket.emit('registerResult', { success: true });
            console.log(`new users registeration: ${username}`);
        }
    });
    socket.on('login', ({ username, password }) => {
        const user = user[username];
        if(user && user.password === password) {
            socket.emit('loginResult', {
                success: true,
                username: username,
                initialModals: modals,
                userTakenModalIds: user.takenModals,
            });
            console.log(`user loggedIn ${username}`);
        } else {
            socket.emit('loginResult', { success: false, message: 'name or password is wrong.' });
        }
    });
    socket.emit('takeModal', ({ modalId, username }) => {
        const modal = allModals.find(m => m.id === modalId);
        const user = user[username];
        if(modal && user && modal.takenBy === null) {
            modal.takenBy.username;
            user.takenModals.push(modal.id);
            saveUsers();
            io.emit('modalTaken', ({ modalId: modalId, userId: username }));
            console.log(`user ${username} is Get treasure ${modalId}. `);
            if(modal.isImportant) {
                const now = new Date();
                const timestamp = now.toLocaleString('ja-JP');
                const logMessage = `${timestamp} - user: ${username} - Item: ${modal.text.replace(/<[^>]*>/g, ' ')}\n`;
                fs.appendFile('important_items.log', logMessage, (err) => {
                    if(err) console.error('Error occurred while to writing log.', err);
                });
            }
        }
    });
    socket.on('disconnect', () => {
        console.log(`user is disconnected.: ${socket.id}`);
    });
    socket.on('checkPassword', ({ password: type }) => {
        let isCorrect = false;
        if(type === 'main_intermission' && password === MAIN_INTERMISSION_PASSWORD) {
            isCorrect = true;
        } else if (type === 'alert' && password === ALERT_PASSWORD) {
            isCorrect = true;
        }
        if(isCorrect) {
            socket.emit('passwordResult', { success: true, type: type });
        } else {
            socket.emit('passwordResult', { success: false });
        }
    });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`server start ${PORT} (*^^)v`);
});