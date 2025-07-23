import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, onSnapshot, query, orderBy, where, addDoc, updateDoc, getDoc, getDocs } from 'firebase/firestore';

const STATUS_OPTIONS = [
  { label: 'Looking to Queue', value: 'Looking to Queue' },
  { label: 'Available for 5v5', value: 'Available for 5v5' },
  { label: 'Offline', value: 'Offline' },
];

const OFFLINE_THRESHOLD = 60 * 1000; // 60 seconds

function App() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  console.trace('Initializing error state with useState(null)');
  const [error, _setError] = useState(null);
  // Proxy setError to log every call
  const setError = (msg) => {
    console.trace('setError called (global catch-all):', msg);
    _setError(msg);
  };
  const [status, setStatus] = useState('Offline');
  const [statusLoading, setStatusLoading] = useState(false);
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [chatRequestsSent, setChatRequestsSent] = useState({}); // { [receiverId]: true }
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [activeChat, setActiveChat] = useState(null); // { chatId, participants, ... }
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [userChats, setUserChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [userIdToUsername, setUserIdToUsername] = useState({}); // { userId: username }
  const [username, setUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [currentPlayerData, setCurrentPlayerData] = useState(null); // Full player doc for current user
  const [usernameLoading, setUsernameLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setLoading(false);
      } else {
        setUserId(null);
        setLoading(false);
      }
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    if (!auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        setError(err.message);
        setLoading(false);
      });
    }

    return () => unsubscribe();
  }, []);

  // Log every time the error state changes
  useEffect(() => {
    if (error) {
      console.trace('Error state changed:', error);
    }
  }, [error]);

  useEffect(() => {
    setPlayersLoading(true);
    const q = query(
      collection(db, 'artifacts/valorant-finder/public/data/players'),
      orderBy('lastUpdated', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      setPlayers(list);
      setPlayersLoading(false);
      console.log('Fetched players:', list);
    }, (err) => {
      console.trace('setError about to be called (players):', err.message);
      setError(err.message);
      setPlayersLoading(false);
      console.error('onSnapshot error (players):', err);
    });
    return () => unsub();
  }, []);

  // Listen for incoming chat requests
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'artifacts/valorant-finder/public/data/chatRequests'),
      // Only requests for this user and still pending
      // Firestore doesn't support multiple where clauses on different fields with 'in', so filter in JS
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const requests = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.receiverId === userId && data.status === 'pending') {
          requests.push({ id: doc.id, ...data });
        }
      });
      setIncomingRequests(requests);
      setShowRequestsModal(requests.length > 0);
    }, (err) => setError(err.message));
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    if (!activeChat) return;
    // Ensure parent chat document exists before subscribing to messages
    const chatRef = doc(db, 'artifacts/valorant-finder/public/data/chats', activeChat.chatId);
    getDoc(chatRef).then(chatSnap => {
      if (!chatSnap.exists()) {
        setDoc(chatRef, {
          chatId: activeChat.chatId,
          participants: activeChat.participants,
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
        }).then(() => {
          console.log('Created parent chat document for subscription', activeChat.chatId);
        }).catch(err => {
          console.trace('setError about to be called (setDoc in messages subscription):', err.message);
          setError(err.message);
          console.error('setDoc error (messages subscription):', err);
        });
      }
      // Now subscribe to messages
      const q = query(
        collection(db, `artifacts/valorant-finder/public/data/chats/${activeChat.chatId}/messages`),
        orderBy('timestamp', 'asc')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const msgs = [];
        snapshot.forEach((doc) => {
          msgs.push(doc.data());
        });
        setChatMessages(msgs);
        console.log('Fetched messages for chat', activeChat.chatId, msgs);
      }, (err) => {
        console.trace('setError about to be called (messages):', err.message);
        setError(err.message);
        console.error('onSnapshot error (messages):', err);
      });
      // Clean up subscription on unmount
      return unsub;
    }).catch(err => {
      console.trace('setError about to be called (getDoc in messages subscription):', err.message);
      setError(err.message);
      console.error('getDoc error (messages subscription):', err);
    });
  }, [activeChat, db]);

  // Listen for all chats the user is a participant in
  useEffect(() => {
    if (!userId) return;
    setChatsLoading(true);
    
    const q = query(
      collection(db, 'artifacts/valorant-finder/public/data/chats'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const chats = [];
      snapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() });
      });
      setUserChats(chats);
      setChatsLoading(false);
      console.log('Fetched chats:', chats);
    }, (err) => {
      console.trace('setError about to be called (chats):', err.message);
      setError(err.message);
      setChatsLoading(false);
      console.error('onSnapshot error (chats):', err);
    });
  
    return () => unsub();
  }, [userId]);

  // Fetch all player usernames for mapping userId to username
  useEffect(() => {
    const q = collection(db, 'artifacts/valorant-finder/public/data/players');
    const unsub = onSnapshot(q, (snapshot) => {
      const map = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        map[data.userId] = data.username;
      });
      setUserIdToUsername(map);
      console.log('Fetched userIdToUsername map:', map);
    }, (err) => {
      console.error('onSnapshot error (userIdToUsername):', err);
    });
    return () => unsub();
  }, [db]);

  // Fetch current user's player document on load and on updates
  useEffect(() => {
    if (!userId) return;
    setUsernameLoading(true);
    const userDocRef = doc(db, 'artifacts/valorant-finder/public/data/players', userId);
    const unsub = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentPlayerData(data);
        setShowUsernameModal(!data.username || data.username.length < 3);
      } else {
        setCurrentPlayerData(null);
        setShowUsernameModal(true);
      }
      setUsernameLoading(false);
    });
    return () => unsub();
  }, [userId, db]);

  // Username validation
  const validateUsername = (name) => {
    if (!name || name.length < 3) return 'Username must be at least 3 characters.';
    if (name.length > 20) return 'Username must be at most 20 characters.';
    if (!/^[a-zA-Z0-9_]+$/.test(name)) return 'Username can only contain letters, numbers, and underscores.';
    return '';
  };

  // Save username to Firestore and update currentPlayerData
  const handleSaveUsername = async () => {
    const errorMsg = validateUsername(usernameInput);
    if (errorMsg) {
      setUsernameError(errorMsg);
      return;
    }
    try {
      const userDocRef = doc(db, 'artifacts/valorant-finder/public/data/players', userId);
      await setDoc(userDocRef, { username: usernameInput }, { merge: true });
      setUsernameError('');
      setShowUsernameModal(false);
      // currentPlayerData will update via onSnapshot
    } catch (err) {
      setUsernameError('Failed to save username. Try again.');
    }
  };

  // Heartbeat: update lastActive every 20 seconds
  useEffect(() => {
    if (!userId) return;
    const heartbeat = async () => {
      try {
        await setDoc(
          doc(db, 'artifacts/valorant-finder/public/data/players', userId),
          { lastActive: serverTimestamp() },
          { merge: true }
        );
      } catch (err) {
        // Don't set error for heartbeat failures
        console.error('Heartbeat error:', err);
      }
    };
    const interval = setInterval(heartbeat, 20000); // 20 seconds
    heartbeat(); // initial heartbeat
    return () => clearInterval(interval);
  }, [userId, db]);

  // onbeforeunload: best effort to set status to Offline
  useEffect(() => {
    if (!userId) return;
    const handleUnload = async (e) => {
      try {
        await setDoc(
          doc(db, 'artifacts/valorant-finder/public/data/players', userId),
          { status: 'Offline', lastActive: serverTimestamp() },
          { merge: true }
        );
      } catch (err) {
        // Ignore errors
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [userId, db]);

  // Update handleSetStatus to use currentPlayerData
  const handleSetStatus = async (newStatus) => {
    if (!userId) return;
    setStatusLoading(true);
    setStatus(newStatus);
    try {
      await setDoc(
        doc(db, 'artifacts/valorant-finder/public/data/players', userId),
        {
          userId,
          username: (currentPlayerData && currentPlayerData.username) ? currentPlayerData.username : `Player_${userId.slice(-6)}`,
          status: newStatus,
          lastUpdated: serverTimestamp(),
          lastActive: serverTimestamp(),
        },
        { merge: true }
      );
      setStatusLoading(false);
      console.log('Set status for user', userId, newStatus);
    } catch (err) {
      console.trace('setError about to be called (setStatus):', err.message);
      setError(err.message);
      setStatusLoading(false);
      console.error('setDoc error (setStatus):', err);
    }
  };

  // Update handleRequestChat to use currentPlayerData
  const handleRequestChat = async (player) => {
    if (!userId) return;
    setChatRequestsSent((prev) => ({ ...prev, [player.userId]: true }));
    try {
      await addDoc(collection(db, 'artifacts/valorant-finder/public/data/chatRequests'), {
        senderId: userId,
        senderUsername: (currentPlayerData && currentPlayerData.username) ? currentPlayerData.username : `Player_${userId.slice(-6)}`,
        receiverId: player.userId,
        receiverUsername: player.username || `Player_${player.userId.slice(-6)}`,
        status: 'pending',
        timestamp: serverTimestamp(),
      });
      console.log('Sent chat request to', player.userId);
    } catch (err) {
      console.trace('setError about to be called (requestChat):', err.message);
      setError(err.message);
      setChatRequestsSent((prev) => ({ ...prev, [player.userId]: false }));
      console.error('addDoc error (requestChat):', err);
    }
  };

  const handleAcceptRequest = async (req) => {
    try {
      await updateDoc(doc(db, 'artifacts/valorant-finder/public/data/chatRequests', req.id), {
        status: 'accepted',
      });
      // Create a new chat document (chatId: sorted userIds joined by '_')
      const chatId = [req.senderId, req.receiverId].sort().join('_');
      await setDoc(doc(db, 'artifacts/valorant-finder/public/data/chats', chatId), {
        chatId,
        participants: [req.senderId, req.receiverId],
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      }, { merge: true });
      setIncomingRequests((prev) => prev.filter((r) => r.id !== req.id));
      setShowRequestsModal(false);
      setActiveChat({ chatId, participants: [req.senderId, req.receiverId] });
      console.log('Accepted chat request and created chat', chatId);
    } catch (err) {
      console.trace('setError about to be called (acceptRequest):', err.message);
      setError(err.message);
      console.error('updateDoc/setDoc error (acceptRequest):', err);
    }
  };

  const handleDeclineRequest = async (req) => {
    try {
      await updateDoc(doc(db, 'artifacts/valorant-finder/public/data/chatRequests', req.id), {
        status: 'declined',
      });
      setIncomingRequests((prev) => prev.filter((r) => r.id !== req.id));
      setShowRequestsModal(false);
      console.log('Declined chat request', req.id);
    } catch (err) {
      console.trace('setError about to be called (declineRequest):', err.message);
      setError(err.message);
      console.error('updateDoc error (declineRequest):', err);
    }
  };

  const dismissError = () => {
    setError(null);
    console.trace('setError called (dismissError):', null);
  };

  // Open chat if user is a participant in an accepted chat (MVP: open on accept only)
  // (Future: listen for accepted requests and open automatically)

  // Update handleSendMessage to use currentPlayerData
  const handleSendMessage = async () => {
    if (!activeChat || !chatMessage.trim()) return;
    setChatLoading(true);
    try {
      // Ensure parent chat document exists before sending a message
      const chatRef = doc(db, 'artifacts/valorant-finder/public/data/chats', activeChat.chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          chatId: activeChat.chatId,
          participants: activeChat.participants,
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
        });
        console.log('Created parent chat document for', activeChat.chatId);
      }
      await addDoc(collection(db, `artifacts/valorant-finder/public/data/chats/${activeChat.chatId}/messages`), {
        senderId: userId,
        senderUsername: (currentPlayerData && currentPlayerData.username) ? currentPlayerData.username : `Player_${userId.slice(-6)}`,
        text: chatMessage.trim(),
        timestamp: serverTimestamp(),
      });
      setChatMessage('');
      setChatLoading(false);
      console.log('Sent message in chat', activeChat.chatId);
    } catch (err) {
      console.trace('setError about to be called (sendMessage):', err.message);
      setError(err.message);
      setChatLoading(false);
      console.error('addDoc/setDoc/getDoc error (sendMessage):', err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <svg className="animate-spin h-8 w-8 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
      Loading...
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white px-2">
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center border-2 border-red-400">
          <span>{error}</span>
          <button className="ml-4 text-white font-bold text-xl" onClick={dismissError}>&times;</button>
        </div>
      )}
      <h1 className="text-4xl font-extrabold mb-6 tracking-tight text-red-500 drop-shadow-lg">Valorant Team Finder</h1>
      <div className="bg-gray-800/90 p-8 rounded-2xl shadow-2xl mb-8 w-full max-w-lg border border-gray-700">
        <p className="mb-2 text-lg font-medium">{currentPlayerData && currentPlayerData.username ? `Welcome, Agent!` : 'Set your username to get started!'}</p>
        <p className="text-xs text-gray-400 mb-1">Your Username:</p>
        <code className="block bg-gray-700 p-2 rounded text-green-400 font-mono break-all text-xs border border-green-700">{currentPlayerData && currentPlayerData.username ? currentPlayerData.username : `Player_${userId ? userId.slice(-6) : 'Unknown'}`}</code>
        {(!currentPlayerData || !currentPlayerData.username) && !usernameLoading && (
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold" onClick={() => setShowUsernameModal(true)}>
            Set Username
          </button>
        )}
      </div>
      {/* Username Modal */}
      {showUsernameModal && !usernameLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-700 flex flex-col">
            <h3 className="text-lg font-bold text-blue-400 mb-4">Choose a Username</h3>
            <input
              className="rounded-lg p-2 bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              type="text"
              placeholder="Enter username"
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              maxLength={20}
            />
            {usernameError && <div className="text-red-400 text-xs mb-2">{usernameError}</div>}
            <div className="flex gap-2 mt-2">
              <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={handleSaveUsername}>Save Username</button>
              <button className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-bold" onClick={() => setShowUsernameModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-gray-800/90 p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700">
        <h2 className="text-2xl font-bold mb-5 text-blue-400">Set Your Status</h2>
        <div className="flex flex-col gap-4">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md border-2 ${
                status === opt.value
                  ? opt.value === 'Looking to Queue'
                    ? 'bg-blue-600 text-white border-blue-400 scale-105'
                    : opt.value === 'Available for 5v5'
                    ? 'bg-green-600 text-white border-green-400 scale-105'
                    : 'bg-gray-600 text-white border-gray-400 scale-105'
                  : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:text-white'
              }`}
              onClick={() => handleSetStatus(opt.value)}
              disabled={statusLoading}
            >
              {opt.label}
              {status === opt.value && statusLoading && (
                <span className="ml-2 animate-spin">⏳</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-gray-800/90 p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700">
        <h2 className="text-2xl font-bold mb-5 text-green-400">Players Online</h2>
        {playersLoading ? (
          <div className="flex items-center"><svg className="animate-spin h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Loading players...</div>
        ) : (
          <ul className="divide-y divide-gray-700">
            {(() => {
              const now = Date.now();
              // Map players to include derivedStatus
              const playersWithDerivedStatus = players.map(player => {
                const lastActive = player.lastActive && player.lastActive.seconds ? player.lastActive.seconds * 1000 : 0;
                const isOnline = lastActive && (now - lastActive < OFFLINE_THRESHOLD);
                const derivedStatus = isOnline ? player.status : 'Offline';
                // Fallback for missing username
                const displayUsername = player.username && player.username.length >= 3 ? player.username : `Player_${player.userId ? player.userId.slice(-6) : 'Unknown'}`;
                return { ...player, derivedStatus, displayUsername };
              });
              // Filter out Offline players
              const filteredPlayers = playersWithDerivedStatus.filter(p => p.derivedStatus !== 'Offline');
              if (filteredPlayers.length === 0) {
                return <li className="py-2 text-gray-400">No active players found. Be the first to set your status to 'Looking to Queue' or 'Available for 5v5'!</li>;
              }
              return filteredPlayers.map((player) => (
                <li
                  key={player.userId}
                  className={`flex items-center justify-between py-3 px-3 rounded-xl transition-all duration-100 mb-1 ${
                    player.userId === userId
                      ? 'bg-gray-700 border-l-4 border-blue-500 shadow-lg scale-105'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base text-green-400 font-bold">{player.displayUsername}</span>
                    {player.userId === userId && <span className="ml-2 text-xs text-blue-400">(You)</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold shadow-md border-2 ${
                        player.derivedStatus === 'Looking to Queue'
                          ? 'bg-blue-600 text-white border-blue-400'
                          : player.derivedStatus === 'Available for 5v5'
                          ? 'bg-green-600 text-white border-green-400'
                          : 'bg-gray-600 text-gray-300 border-gray-400'
                      }`}
                    >
                      {player.derivedStatus}
                    </span>
                    {/* Request Chat Button */}
                    {player.userId !== userId &&
                      (player.derivedStatus !== 'Offline') &&
                      (player.status === 'Looking to Queue' || player.status === 'Available for 5v5') && (
                        <button
                          className="ml-2 px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow border-2 border-red-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          onClick={() => handleRequestChat(player)}
                          disabled={!!chatRequestsSent[player.userId]}
                        >
                          {chatRequestsSent[player.userId] ? 'Request Sent' : 'Request Chat'}
                        </button>
                      )}
                  </div>
                </li>
              ));
            })()}
          </ul>
        )}
      </div>
      {showRequestsModal && incomingRequests.length > 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-700">
            <h3 className="text-lg font-bold mb-4 text-red-400">Incoming Chat Request</h3>
            {incomingRequests.map((req) => (
              <div key={req.id} className="mb-4 p-3 rounded-lg bg-gray-700 flex flex-col gap-2">
                <span className="text-white font-semibold">From: <span className="text-green-400">{req.senderUsername}</span></span>
                <div className="flex gap-2 mt-2">
                  <button className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-500 font-bold" onClick={() => handleAcceptRequest(req)}>Accept</button>
                  <button className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-500 font-bold" onClick={() => handleDeclineRequest(req)}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Chat Modal */}
      {activeChat && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700 flex flex-col h-[70vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-blue-400">Chat</h3>
              <button className="text-white text-2xl font-bold" onClick={() => setActiveChat(null)}>&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-3 mb-4">
              {/* Chat messages (MVP: empty or static for now) */}
              {chatMessages.length === 0 ? (
                <div className="text-gray-400 text-center">No messages yet.</div>
              ) : (
                <ul>
                  {chatMessages.map((msg, idx) => (
                    <li key={idx} className="mb-2">
                      <span className="font-mono text-green-400">{msg.senderUsername}:</span> <span className="text-white">{msg.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg p-2 bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="text"
                placeholder="Type a message..."
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                disabled={chatLoading}
              />
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-60"
                onClick={handleSendMessage}
                disabled={chatLoading || !chatMessage.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Past Chats List */}
      <div className="bg-gray-800/90 p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 mt-8 mb-8">
        <h2 className="text-2xl font-bold mb-5 text-yellow-400">Your Chats</h2>
        {chatsLoading ? (
          <div className="flex items-center"><svg className="animate-spin h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Loading chats...</div>
        ) : userChats.length === 0 ? (
          <div className="text-gray-400">No chats yet.</div>
        ) : (
          <ul className="divide-y divide-gray-700">
            {userChats.map((chat) => {
              const otherId = chat.participants.find((id) => id !== userId);
              const otherUsername = userIdToUsername[otherId] || otherId;
              return (
                <li key={chat.chatId} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-gray-700 transition-all duration-100 mb-1">
                  <span className="font-mono text-base text-green-400 font-bold">Chat with {otherUsername}</span>
                  <button
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow border-2 border-blue-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setActiveChat(chat)}
                  >
                    Open
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
