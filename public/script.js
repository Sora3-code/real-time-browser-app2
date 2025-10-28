//-----------------------------------------------------------------------
// Server Connection
//-----------------------------------------------------------------------
let socket = io();  // For local testing
//let socket = io('https://your-app-name.onrender.com'); // For Render deployment

//-----------------------------------------------------------------------
// Element Retrieval
//-----------------------------------------------------------------------
// Auth elements
const authContainer = document.getElementById('auth-container');
const registerForm = document.getElementById('register-form');
const loginFormMain = document.getElementById('login-form-main');
const registerUsernameInput = document.getElementById('register-username');
const registerPasswordInput = document.getElementById('register-password');
const registerButton = document.getElementById('register-button');
const loginUsernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');
const loginButtonMain = document.getElementById('login-button-main');
const showLoginLink = document.getElementById('show-login');
const showRegisterLink = document.getElementById('show-register');

// In-game password form (for progression)
const intermissionLoginForm = document.getElementById('login-form');
const initialLoginTitle = document.getElementById('initial-login-title');
const intermissionTitle = document.getElementById('intermission-title');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');

// Main game elements
const gameArea = document.getElementById('game-area');
const remainingCountElement = document.getElementById('remaining-count');
const getItemButton = document.getElementById('get-item-button');
const myItemsContainer = document.getElementById('my-items');
const backToTopButton = document.getElementById('back-to-top-button');

// Important modal elements
const customAlert = document.getElementById('custom-alert');
const alertPasswordInput = document.getElementById('alert-password-input');
const alertLoginButton = document.getElementById('alert-login-button');
const userInfoContainer = document.getElementById('user-info-container');
const treasureNameInput = document.getElementById('treasure-name');
const userNameInput = document.getElementById('user-name');
const userAddressInput = document.getElementById('user-address');
const userAgeInput = document.getElementById('user-age');
const schoolNameInput = document.getElementById('school-name');
const schoolTelInput = document.getElementById('school-tel');
const userDreamInput = document.getElementById('user-dream');
const submitUserInfoButton = document.getElementById('submit-user-info');

//delete modals
const resetMyModalsButton = document.getElementById('reset-my-modals-button');
//-----------------------------------------------------------------------
// Global Variables
//-----------------------------------------------------------------------
let loggedInUser = null;
let allModals = [];
let myTakenModals = [];

//-----------------------------------------------------------------------
// Event Listeners
//-----------------------------------------------------------------------

// --- Auth Form Switching ---
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

// --- Registration and Login ---
registerButton.addEventListener('click', () => {
    const username = registerUsernameInput.value.trim();
    const password = registerPasswordInput.value.trim();
    if (username && password) {
        socket.emit('register', { username, password });
    } else {
        alert('名前とパスワードを入力してください。');
    }
});

loginButtonMain.addEventListener('click', () => {
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value.trim();
    if (username && password) {
        socket.emit('login', { username, password });
    } else {
        alert('名前とパスワードを入力してください。');
    }
});

// --- Main Game Actions ---
getItemButton.addEventListener('click', () => {
    const nextModal = allModals.find(modal => modal.takenBy === null);
    if (nextModal && loggedInUser) {
        getItemButton.disabled = true;
        socket.emit('takeModal', { modalId: nextModal.id, username: loggedInUser });
    }
});

backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        let targetForm = passwordInput;
        if (targetForm) {
            targetForm.focus({ preventScroll: true });
        }
    }, 1000);
});

resetMyModalsButton.addEventListener('click', () => {
    if(loggedInUser && confirm('本当にあなたの取得済みの全てのモーダルをリセットしますか？')) {
        socket.emit('resetMyModals', { username: loggedInUser });
    }
});

// --- In-game Progression Passwords ---
loginButton.addEventListener('click', () => {
    const password = passwordInput.value;
    // Note: The 'initial' type is no longer used for main login
    socket.emit('checkPassword', { password: password, type: 'main_intermission' });
});

alertLoginButton.addEventListener('click', () => {
    const password = alertPasswordInput.value;
    socket.emit('checkPassword', { password: password, type: 'alert' });
});

// --- User Info Submission ---
submitUserInfoButton.addEventListener('click', () => {
    const userInfo = {
        treasureName: treasureNameInput.value,
        name: userNameInput.value,
        address: userAddressInput.value,
        age: userAgeInput.value,
        schoolName: schoolNameInput.value,
        schoolTEL: schoolTelInput.value,
        dream: userDreamInput.value
    };
    socket.emit('submitUserInfo', userInfo);
    userInfoContainer.classList.add('hidden');
    getItemButton.disabled = false;
    getItemButton.focus();

    // Reset form fields
    treasureNameInput.value = '';
    userNameInput.value = '';
    userAddressInput.value = '';
    userAgeInput.value = '';
    schoolNameInput.value = '';
    schoolTelInput.value = '';
    userDreamInput.value = '';

    alert('ご入力ありがとうございました！次のアイテムを取得できます。');
});


//-----------------------------------------------------------------------
// Socket.IO Event Handlers
//-----------------------------------------------------------------------

socket.on('connect', () => {
    console.log(`Connected to server with ID: ${socket.id}`);
});

// --- Auth Results ---
socket.on('registerResult', (result) => {
    if (result.success) {
        alert('登録が完了しました！ログインしてください。');
        showLoginLink.click();
    } else {
        alert(`登録エラー: ${result.message}`);
    }
});

socket.on('loginResult', (result) => {
    if (result.success) {
        loggedInUser = result.username;
        authContainer.classList.add('hidden');
        gameArea.classList.remove('hidden');
        myItemsContainer.classList.remove('hidden');
        
        // Use the data sent on login to initialize the game
        initializeGame(result.initialModals, result.userTakenModalIds);
    } else {
        alert(`ログインエラー: ${result.message}`);
    }
});

// --- Game State Updates ---
socket.on('modalTaken', ({ modalId, userId }) => {
    console.log(`User ${userId} took modal ${modalId}.`);
    const takenModal = allModals.find(m => m.id === modalId);
    if (takenModal) {
        takenModal.takenBy = userId; // userId is a username
        if (userId === loggedInUser) {
            myTakenModals.push(takenModal);
            updateMyItemsList();

            const newCardElement = document.getElementById('modal-card-' + takenModal.id);
            if (newCardElement) {
                newCardElement.focus();
            }

            if (takenModal.isImportant) {
                getItemButton.disabled = true;
                setTimeout(() => {
                    customAlert.classList.remove('hidden');
                }, 3000);
            } else if (allModals.filter(modal => modal.takenBy === null).length > 0) {
                showIntermissionPasswordForm();
            }
        }
        updateRemainingCount();
    }
});

// --- In-game Password Results ---
socket.on('passwordResult', (result) => {
    if (result.success) {
        if (result.type === 'main_intermission') {
            intermissionLoginForm.classList.add('hidden');
            getItemButton.disabled = false;
        } else if (result.type === 'alert') {
            customAlert.classList.add('hidden');
            userInfoContainer.classList.remove('hidden');
            userInfoContainer.scrollIntoView({ behavior: 'smooth' });
            treasureNameInput.focus();
        }
        passwordInput.value = '';
        alertPasswordInput.value = '';
    } else {
        alert('パスワードが違います。');
        passwordInput.value = '';
        alertPasswordInput.value = '';
    }
});

socket.on('resetComplete', () => {
    alert('取得済みモーダルがリセットされました。ページをリロードします。');
    location.reload();
});

//-----------------------------------------------------------------------
// Functions
//-----------------------------------------------------------------------

function initializeGame(initialModals, userTakenModalIds) {
    allModals = initialModals;
    myTakenModals = allModals.filter(m => userTakenModalIds.includes(m.id));
    updateRemainingCount();
    updateMyItemsList();
}

function updateMyItemsList() {
    const headerContainer = myItemsContainer.querySelector('.my-items-header');
    if (!headerContainer) {
        console.error('.my-items-headerが見つかりません。');
        return;
    }

    let existingGrid = myItemsContainer.querySelector('.items-grid');
    if (existingGrid) {
        existingGrid.remove();
    }

    // Clear "no items" message if it exists
    const p = myItemsContainer.querySelector('p');
    if (p) p.remove();
    
    if (myTakenModals.length === 0) {
        const noItemsP = document.createElement('p');
        noItemsP.textContent = 'アイテムはまだありません。';
        myItemsContainer.appendChild(noItemsP);
        backToTopButton.classList.add('hidden');
        return;
    }
    
    backToTopButton.classList.remove('hidden');

    const itemsGrid = document.createElement('div');
    itemsGrid.className = 'items-grid';
    myTakenModals.sort((a, b) => a.id - b.id).forEach(modal => {
        const itemcard = document.createElement('div');
        itemcard.className = 'item-card';
        itemcard.id = 'modal-card-' + modal.id;
        itemcard.tabIndex = -1;
        itemcard.innerHTML = `<img src="${modal.image}" alt="Item Image"><p>${modal.text}</p>`;
        itemsGrid.appendChild(itemcard);
    });
    myItemsContainer.appendChild(itemsGrid);
}

function updateRemainingCount() {
    const remaining = allModals.filter(modal => modal.takenBy === null).length;
    remainingCountElement.textContent = `残り: ${remaining}個`;
    if (remaining === 0) {
        getItemButton.disabled = true;
        getItemButton.textContent = '終了';
    }
}

function showIntermissionPasswordForm() {
    initialLoginTitle.classList.add('hidden');
    intermissionTitle.classList.remove('hidden');
    intermissionLoginForm.classList.remove('hidden');
    passwordInput.focus();
}

