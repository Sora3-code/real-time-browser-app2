
let socket = io();
//let socket = io('https://real-time-browser-app2.onrender.com');

const authContainer = document.getElementById('auth-container');

const registerForm = document.getElementById('register-form');
const registerNameInput = document.getElementById('register-name');
const registerPasswordInput = document.getElementById('register-password');
const registerButton = document.getElementById('register-button');
const showLoginLink = document.getElementById('show-login');

const loginFormMain = document.getElementById('login-form-main');
const loginNameInput = document.getElementById('login-name');
const loginPasswordInput = document.getElementById('login-password');
const loginButtonMain = document.getElementById('login-button-main');
const showRegisterLink = document.getElementById('show-register');

const intermissionLoginForm = document.getElementById('login-form');
const initialLoginTitle = document.getElementById('initial-login-title');
const intermissionTitle = document.getElementById('intermission-title');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');

const gameArea = document.getElementById('game-area');
const remainingCountElement = document.getElementById('remaining-count');
const getItemButton = document.getElementById('get-item-button');
const myItemsContainer = document.getElementById('my-items');
const backToTopButton = document.getElementById('back-to-top-button');

let loggedInUser = null;
let allModals = [];
let myTakenModals = [];

function initializeGame(initialModals, userTakenModalIds) {
    allModals = initialModals;
    myTakenModals = allModals.filter(m => userTakenModalIds.includes(m.id));
    updateRemainingCount();
    updateMyItemsList();
}
function updateMYItemsList() {
    const headerContainer = myItemsContainer.querySelector('.my-items-header');
    if(!headerContainer) {
        console.error('Not found .my-items-header.');
        return;
    }
    let existingGrid = myItemsContainer.querySelector('.items-grid');
    if(existingGrid) {
        existingGrid.remove();
    }
    const p = myItemsContainer.querySelector('p');
    if(p) p.remove();
    if(myTakenModals.length === 0) {
        const noItemsP = document.createElement('p');
        noItemsP.textContent = 'item is Not found.';
        myItemsContainer.appendChild(noItemsP);
        backToTopButton.classList.add('hidden');
        return;
    }
    backToTopButton.classList.remove('hidden');
    const itemsGrid = document.createElement('div');
    myTakenModals.sort((a, b) => a.id - b.id).forEach(modal => {
        const itemCard = document.createElement('div');
        itemCard.className('item-card');
        itemCard.id = 'modal-card-' + modal.id;
        itemCard.tabIndex = -1;
        itemCard.innerHTML = `<img src="${modal.image}"><p><${modal.text}></p>`;
        itemsGrid.appendChild(itemCard);
    });
    myItemsContainer.appendChild(itemsGrid);
}
function updateRemainingCount() {
    const remaining = allModals.filter(modal => modal.takenBy === null).length;
    remainingCountElement.textContent = `remainingCount: ${remaining}`;
    if(remaining === 0) {
        getItemButton.disabled = true;
        getItemButton.textContent = 'finished.';
    }
}
function showIntermissionPasswordForm() {
    initialLoginTitle.classList.add('hidden');
    intermissionTitle.classList.remove('hidden');
    intermissionLoginForm.classList.remove('hidden');
    passwordInput.focus();
}

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginFormMain.classList.remove('hidden');
});
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginFormMain.classList.add('hidden');
    registerForm.classList.remove('hidden');
});
registerButton.addEventListener('click', () => {
    const username = registerNameInput.value.trim();
    const password = registerPasswordInput.value.trim();
    if(username && password) {
        socket.emit('register', { username, password });
    } else {
        alert('nter to name and password.');
    }
});
loginButtonMain.addEventListener('click', () => {
    const username = loginNameInput.value.trim();
    const password = loginPasswordInput.value.trim();
    if(username && password) {
        socket.emit('login', { username, password });
    } else {
        alert('Enter to name and password.');
    }
});
loginButton.addEventListener('click', () => {
    const password = passwordInput.value;
    socket.emit('checkPassword', { password: password, type: main_intermission });
});
getItemButton.addEventListener('click', () => {
    const nextModal = allModals.find(modal => modal.takenBy = null);
    if(nextModal && loggedInUser) {
        getItemButton.disabled = true;
        socket.emit('takeModal', { modalId: nextModal.id, username: loggedInUser });
    }
});
backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        let targetForm = passwordInput;
        if(targetForm) {
            targetForm.focus({ preventScroll: true });
        }
    }, 1000);
});
socket.on('registerResult', (result) => {
    if(result.success) {
        alert('registered. login Please.');
        showLoginLink.click();
    } else {
        alert(`register Error.: ${result.message}`);
    }
});
socket.on('loginResult', (result) => {
    if(result.success) {
        loggedInUser = result.username;
        authContainer.classList.add('hidden');
        gameArea.classList.remove('hidden');
        myItemsContainer.classList.remove('hidden');
        initializeGame(result.initialModals, result.userTakenModalIds);
    } else {
        alert(`login Error: ${result.message}`);
    }
});
socket.on('passwordResult', (result) => {
    if(result.success) {
        if(result.type === 'main_intermission') {
            intermissionLoginForm.classList.add('hidden');
            getItemButton.disabled = false;
        } else if (result.type === 'alert') {
            customAlert.classList.add('hidden');
            userInfoContainer.classList.remove('hidden');
            userInfoContainer.scrollTo('smoth');
            treasureNameInput.focus();
        }
        passwordInput.value = '';
        alertPasswordInput.value = '';         
        
    } else {
        alert('password is wrong.');
        passwordInput.value = '';
        alertPasswordInput.value = '';
    }
});
socket.on('modalTaken', ({ modalId, userId }) => {
    console.log(`user ${username} Get modal ${modalId}`);
    const takenModal = allModals.find(m => m.id === modalId);
    if(takenModal) {
        takenModal.takenBy = userId;
        if(userId === loggedInUser) {
            myTakenModals.push(takenModal);
            updateMyItemsList();
            const newCardElement = document.getElementById('modal-card-' + takenModal.id);
            if(newCardElement) {
                newCardElement.focus();
            }
            if(takenModal.isImportant) {
                getItemButton.disabled = true;
                setTimeout(() => {
                    customAlert.classList.remove('hidden');
                },3000);
            } else if (allModals.filter(modal => modal.takenBy === null).length > 0) {
                showIntermissionPasswordForm();
            }
        }
        updateRemainingCount();
    }
});
