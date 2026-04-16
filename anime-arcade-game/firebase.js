
// ===============================
//  FIREBASE INITIALIZATION
// ===============================

// YOUR FIREBASE CONFIG HERE
const firebaseConfig = {
    apiKey: "AIzaSyDws4b6JgUEJZyFEGvt2qqWiCMRJB8pSIc",
    authDomain: "anime-arcade-game.firebaseapp.com",
    databaseURL: "https://anime-arcade-game-default-rtdb.firebaseio.com",
    projectId: "anime-arcade-game",
    storageBucket: "anime-arcade-game.firebasestorage.app",
    messagingSenderId: "466096966664",
    appId: "1:466096966664:web:e1f6f55c376fa3904d95bd"
};

firebase.initializeApp(firebaseConfig);

// Database reference
const db = firebase.database();

// ===============================
//  FIREBASE FUNCTIONS
// ===============================

// Create a new room
async function createRoom(roomId, playerData) {
    await db.ref(`rooms/${roomId}`).set({
        players: {
            [playerData.id]: playerData
        },
        createdAt: Date.now()
    });
}

// Join an existing room
async function joinRoom(roomId, playerData) {
    await db.ref(`rooms/${roomId}/players/${playerData.id}`).set(playerData);
}

// Listen for room player updates
function onPlayersUpdate(roomId, callback) {
    db.ref(`rooms/${roomId}/players`).on("value", snapshot => {
        callback(snapshot.val());
    });
}

// Update player position/state
function updatePlayer(roomId, playerId, data) {
    db.ref(`rooms/${roomId}/players/${playerId}`).update(data);
}

// Remove player when leaving
function removePlayer(roomId, playerId) {
    db.ref(`rooms/${roomId}/players/${playerId}`).remove();
}

