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

let modals = [
    { id: 0, image: 'images/IMG_2178.jpeg', text: '------- Donald Trump -------<br>---------- the Earth is mankind\'s oldest best friend ----------', takenBy: null, isImportant: true},
    { id: 1, image: 'images/IMG_2176.jpeg', text: '------- Vladimir Vladimirovich Putin -------<br>---------- kindness are super civilized ----------', takenBy: null, isImportant: true},
    { id: 2, image: 'images/IMG_2195.jpeg', text: '------- 習近平 -------<br>---------- the key to saving the Earth is<br>the coexistence of civilization and nature ----------', takenBy: null, isImportant: true},
    { id: 3, image: 'images/IMG_2179.webp4.jpg', text: '------- Volodymyr Zelenskyy -------<br>---------- I want to keep not only my kindness for the future<br>but also my kindness from the future ----------', takenBy: null, isImportant: true},
    { id: 4, image: 'images/IMG_2185.jpeg5.jpg', text: '------- William, the prince of Wales -------<br>---------- protecting and spinning the future ----------', takenBy: null, isImportant: true},
    { id: 5, image: 'images/IMG_2180.jpeg', text: '------- Keir Starmer -------<br>---------- Let\'s feel the kindness of the Earth ----------', takenBy: null, isImportant: true},
    { id: 6, image: 'images/IMG_2181.jpeg', text: '------- Sebastien Lecornu -------<br>---------- Let\s listen to the voice of the Earth ----------', takenBy: null, isImportant: true},
    { id: 7, image: 'images/', text: '-------  -------<br>----------  ----------', takenBy: null, isImportant: true},
    { id: 8, image: 'images/', text: '-------  -------<br>----------  ----------', takenBy: null, isImportant: true},
    { id: 10, image: 'images/', text: '-------  -------<br>----------  ----------', takenBy: null, isImportant: true},
    { id: 11, image: 'images/', text: '-------  -------<br>----------  ----------', takenBy: null, isImportant: true},
    { id: 12, image: 'images/', text: '-------  -------<br>----------  ----------', takenBy: null, isImportant: true},
    { id: 13, image: 'images/', text: '-------  -------<br>----------  ----------', takenBy: null, isImportant: true},
    { id: 14, image: 'images/', text: '-------  -------<br>----------  ----------', takenBy: null, isImportant: true},
    { id: 15, image: 'images/', text: '-------  -------<br>----------  ----------', takenBy: null, isImportant: true},
    { id: 16, image: 'images/', text: '-------  -------<br>----------  ----------', takenBy: null, isImportant: true},
    { id: 17, image: 'images/', text: '-------  -------<br>----------  ----------', takenBy: null, isImportant: true},
    { id: 18, image: 'images/', text: '-------  -------<br>----------  ----------', takenBy: null, isImportant: true},
    { id: 19, image: 'images/', text: '-------  -------<br>----------  ----------', takenBy: null, isImportant: true},
    { id: 20, image: 'images/', text: '-------  -------<br>----------  ----------', takenBy: null, isImportant: true},
];

const USER_FILE = './users.json';
let users = {};

function loadUsers() {
    try {
        if(fs.existsSync(USER_FILE)) {
            const data = fs.readFileSync(USER_FILE);
            users = JSON.parse(data);
            console.log('UsersData loading sccess true.');
            for(const username in users) {
                const user = users[username];
                user.takenModals.forEach(modalId => {
                    const modal = modals.find(m => m.id === modalId);
                    if(modal) {
                        modal.takenBy = username;
                    }
                });
            }
        } else {
            console.log('user json not found. make a new data.');
        }
    } catch (err) {
        console.error('user json reloading or parsing Error occurred.');
    }
}

function saveUsers() {
    fs.writeFile(USER_FILE, JSON.stringify(users, null, 2), (err) => {
        if(err) {
            console.error('UserInfo saving Error occurred:', err);
        }
    });
}

loadUsers();

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