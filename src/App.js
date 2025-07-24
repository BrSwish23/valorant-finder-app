import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { signInAnonymously, onAuthStateChanged, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, onSnapshot, query, orderBy, where, addDoc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
import LoginPage from './LoginPage';
import MainHeader from './components/MainHeader';
import StatusCard from './components/StatusCard';
import PlayersListCard from './components/PlayersListCard';
import ChatsListCard from './components/ChatsListCard';

const STATUS_OPTIONS = [
  { label: 'Looking to Queue', value: 'Looking to Queue' },
  { label: 'Available for 5v5', value: 'Available for 5v5' },
  { label: 'Offline', value: 'Offline' },
];

const OFFLINE_THRESHOLD = 60 * 1000; // 60 seconds

function App() {
  // Simplified auth states
  const [authUser, setAuthUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false); // Track if auth has been initialized
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false); // Only for auth actions, not state changes
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  
  // App states
  const [error, _setError] = useState(null);
  const setError = (msg) => {
    console.trace('setError called (global catch-all):', msg);
    _setError(msg);
  };
  
  const [status, setStatus] = useState('Offline');
  const [statusLoading, setStatusLoading] = useState(false);
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [chatRequestsSent, setChatRequestsSent] = useState({});
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [userChats, setUserChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [userIdToUsername, setUserIdToUsername] = useState({});
  const [username, setUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [currentPlayerData, setCurrentPlayerData] = useState(null);
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Add state for login/signup form
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [loginError, setLoginError] = React.useState('');

  // Simplified auth state listener - only runs once
  useEffect(() => {
    console.log('Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
      setAuthUser(user);
      setAuthInitialized(true);
      
      // Clear any auth errors when state changes
      if (user) {
        setAuthError('');
      }
    }, (err) => {
      console.error('Auth state change error:', err);
      setError(err.message);
      setAuthInitialized(true);
    });

    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
    };
  }, []); // Empty dependency array - this should only run once

  // Auth handlers
  // Utility: Map Firebase Auth error codes to user-friendly messages
  const getAuthErrorMessage = (code, context = 'signin') => {
    // context: 'signin' | 'signup' | 'google'
    switch (code) {
      // Sign Up
      case 'auth/email-already-in-use':
        return 'The email address is already in use. Please sign in or use a different email.';
      case 'auth/weak-password':
        return 'The password is too weak. Please choose a stronger password (min. 6 characters).';
      case 'auth/invalid-email':
        return 'The email address is not valid. Please check the format.';
      // Sign In
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up or check your email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again or use the "Forgot Password" option.';
      // Google
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was canceled.';
      // Common
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      default:
        if (context === 'signup') return 'Sign up failed. Please try again.';
        if (context === 'google') return 'Google sign-in failed. Please try again.';
        return 'Sign in failed. Please try again.';
    }
  };

  const handleEmailSignIn = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      // Don't set showAuthModal here - let auth state change handle it
    } catch (err) {
      console.error('Email sign in error:', err);
      setAuthError(getAuthErrorMessage(err.code, 'signin'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      // Don't set showAuthModal here - let auth state change handle it
    } catch (err) {
      console.error('Email sign up error:', err);
      setAuthError(getAuthErrorMessage(err.code, 'signup'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Don't set showAuthModal here - let auth state change handle it
    } catch (err) {
      console.error('Google sign in error:', err);
      setAuthError(getAuthErrorMessage(err.code, 'google'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      // Set offline status before signing out
      if (authUser) {
        await setDoc(
          doc(db, 'artifacts/valorant-finder/public/data/players', authUser.uid),
          { status: 'Offline', lastActive: serverTimestamp() },
          { merge: true }
        );
      }
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Use authenticated user's UID for all player data
  const userId = authUser ? authUser.uid : null;

  // Log every time the error state changes
  useEffect(() => {
    if (error) {
      console.trace('Error state changed:', error);
    }
  }, [error]);

  // Listen for players - only when authenticated
  useEffect(() => {
    if (!userId) {
      setPlayers([]);
      setPlayersLoading(false);
      return;
    }

    console.log('Setting up players listener for user:', userId);
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
      console.log('Fetched players:', list.length);
    }, (err) => {
      console.error('Players listener error:', err);
      setError(err.message);
      setPlayersLoading(false);
    });
    
    return () => {
      console.log('Cleaning up players listener');
      unsub();
    };
  }, [userId]); // Only depend on userId

  // Listen for incoming chat requests - only when authenticated
  useEffect(() => {
    if (!userId) {
      setIncomingRequests([]);
      return;
    }

    console.log('Setting up chat requests listener for user:', userId);
    
    const q = query(
      collection(db, 'artifacts/valorant-finder/public/data/chatRequests')
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
      console.log('[ChatRequest] Incoming requests updated:', requests.length);
    }, (err) => {
      console.error('[ChatRequest] Incoming requests listener error:', err);
      setError(err.message);
    });
    
    return () => {
      console.log('Cleaning up chat requests listener');
      unsub();
    };
  }, [userId]);

  // Listen for active chat messages
  useEffect(() => {
    if (!activeChat) {
      setChatMessages([]);
      return;
    }

    console.log('Setting up messages listener for chat:', activeChat.chatId);
    
    // Ensure parent chat document exists before subscribing to messages
    const chatRef = doc(db, 'artifacts/valorant-finder/public/data/chats', activeChat.chatId);
    
    getDoc(chatRef).then(chatSnap => {
      if (!chatSnap.exists()) {
        return setDoc(chatRef, {
          chatId: activeChat.chatId,
          participants: activeChat.participants,
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
        });
      }
    }).then(() => {
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
        console.log('Fetched messages for chat', activeChat.chatId, msgs.length);
      }, (err) => {
        console.error('Messages listener error:', err);
        setError(err.message);
      });
      
      return unsub;
    }).catch(err => {
      console.error('Chat setup error:', err);
      setError(err.message);
    });
  }, [activeChat]);

  // Listen for all chats the user is a participant in
  useEffect(() => {
    if (!userId) {
      setUserChats([]);
      setChatsLoading(false);
      return;
    }

    console.log('Setting up chats listener for user:', userId);
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
      console.log('Fetched chats:', chats.length);
    }, (err) => {
      console.error('Chats listener error:', err);
      setError(err.message);
      setChatsLoading(false);
    });
  
    return () => {
      console.log('Cleaning up chats listener');
      unsub();
    };
  }, [userId]);

  // Fetch all player usernames for mapping userId to username
  useEffect(() => {
    console.log('Setting up usernames listener');
    
    const q = collection(db, 'artifacts/valorant-finder/public/data/players');
    const unsub = onSnapshot(q, (snapshot) => {
      const map = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId && data.username) {
          map[data.userId] = data.username;
        }
      });
      setUserIdToUsername(map);
      console.log('Fetched userIdToUsername map:', Object.keys(map).length, 'entries');
    }, (err) => {
      console.error('Usernames listener error:', err);
    });
    
    return () => {
      console.log('Cleaning up usernames listener');
      unsub();
    };
  }, []);

  // Fetch current user's player document - only when authenticated
  useEffect(() => {
    if (!userId) {
      setCurrentPlayerData(null);
      setUsernameLoading(false);
      setShowUsernameModal(false);
      return;
    }

    console.log('Setting up current player listener for user:', userId);
    setUsernameLoading(true);
    
    const userDocRef = doc(db, 'artifacts/valorant-finder/public/data/players', userId);
    const unsub = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentPlayerData(data);
        setShowUsernameModal(!data.username || data.username.length < 3);
        console.log('Current player data updated:', data.username || 'no username');
      } else {
        setCurrentPlayerData(null);
        setShowUsernameModal(true);
        console.log('No current player data found');
      }
      setUsernameLoading(false);
    }, (err) => {
      console.error('Current player listener error:', err);
      setUsernameLoading(false);
    });
    
    return () => {
      console.log('Cleaning up current player listener');
      unsub();
    };
  }, [userId]);

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
    
    if (!userId) {
      setUsernameError('Not authenticated');
      return;
    }
    
    try {
      const userDocRef = doc(db, 'artifacts/valorant-finder/public/data/players', userId);
      await setDoc(userDocRef, { 
        userId,
        username: usernameInput,
        lastUpdated: serverTimestamp(),
        lastActive: serverTimestamp()
      }, { merge: true });
      setUsernameError('');
      setShowUsernameModal(false);
      setUsernameInput('');
      console.log('Username saved:', usernameInput);
    } catch (err) {
      console.error('Save username error:', err);
      setUsernameError('Failed to save username. Try again.');
    }
  };

  // Heartbeat: update lastActive every 20 seconds - only when authenticated
  useEffect(() => {
    if (!userId) return;

    console.log('Setting up heartbeat for user:', userId);
    
    const heartbeat = async () => {
      try {
        await setDoc(
          doc(db, 'artifacts/valorant-finder/public/data/players', userId),
          { lastActive: serverTimestamp() },
          { merge: true }
        );
      } catch (err) {
        console.error('Heartbeat error:', err);
      }
    };
    
    const interval = setInterval(heartbeat, 20000); // 20 seconds
    heartbeat(); // initial heartbeat
    
    return () => {
      console.log('Cleaning up heartbeat');
      clearInterval(interval);
    };
  }, [userId]);

  // onbeforeunload: best effort to set status to Offline
  useEffect(() => {
    if (!userId) return;

    const handleUnload = async () => {
      try {
        await setDoc(
          doc(db, 'artifacts/valorant-finder/public/data/players', userId),
          { status: 'Offline', lastActive: serverTimestamp() },
          { merge: true }
        );
      } catch (err) {
        console.error('Unload error:', err);
      }
    };
    
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [userId]);

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
      console.log('Set status for user', userId, newStatus);
    } catch (err) {
      console.error('Set status error:', err);
      setError(err.message);
    } finally {
      setStatusLoading(false);
    }
  };

  // Update handleRequestChat to use currentPlayerData
  const handleRequestChat = async (player) => {
    if (!userId) return;
    
    setChatRequestsSent((prev) => ({ ...prev, [player.userId]: true }));
    console.log('[ChatRequest] Attempting to send chat request to:', player.userId);
    
    try {
      await addDoc(collection(db, 'artifacts/valorant-finder/public/data/chatRequests'), {
        senderId: userId,
        senderUsername: (currentPlayerData && currentPlayerData.username) ? currentPlayerData.username : `Player_${userId.slice(-6)}`,
        receiverId: player.userId,
        receiverUsername: player.username || `Player_${player.userId.slice(-6)}`,
        status: 'pending',
        timestamp: serverTimestamp(),
      });
      console.log('[ChatRequest] Sent chat request to', player.userId);
    } catch (err) {
      console.error('[ChatRequest] Request chat error:', err);
      setError(err.message);
      setChatRequestsSent((prev) => ({ ...prev, [player.userId]: false }));
    }
  };

  const handleAcceptRequest = async (req) => {
    console.log('[ChatRequest] Accepting chat request:', req.id);
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
      console.log('[ChatRequest] Accepted chat request and created chat', chatId);
    } catch (err) {
      console.error('[ChatRequest] Accept request error:', err);
      setError(err.message);
    }
  };

  const handleDeclineRequest = async (req) => {
    console.log('[ChatRequest] Declining chat request:', req.id);
    try {
      await updateDoc(doc(db, 'artifacts/valorant-finder/public/data/chatRequests', req.id), {
        status: 'declined',
      });
      setIncomingRequests((prev) => prev.filter((r) => r.id !== req.id));
      setShowRequestsModal(false);
      console.log('[ChatRequest] Declined chat request', req.id);
    } catch (err) {
      console.error('[ChatRequest] Decline request error:', err);
      setError(err.message);
    }
  };

  const dismissError = () => {
    setError(null);
  };

  // Update handleSendMessage to use currentPlayerData
  const handleSendMessage = async () => {
    if (!activeChat || !chatMessage.trim() || !userId) return;
    
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
      console.log('Sent message in chat', activeChat.chatId);
    } catch (err) {
      console.error('Send message error:', err);
      setError(err.message);
    } finally {
      setChatLoading(false);
    }
  };

  // Show loading while auth is initializing
  if (!authInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="flex items-center">
          <svg className="animate-spin h-8 w-8 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <span>Initializing...</span>
        </div>
      </div>
    );
  }

  // Example: Replace this with your actual auth state logic
  const isAuthenticated = !!authUser; // or however you track auth

  // Handlers for login/signup/forgot password
  const handleLogin = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
    } catch (err) {
      setAuthError(getAuthErrorMessage(err.code, 'signin'));
    } finally {
      setAuthLoading(false);
    }
  };
  const handleSignUp = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, authEmail, authPassword);
    } catch (err) {
      setAuthError(getAuthErrorMessage(err.code, 'signup'));
    } finally {
      setAuthLoading(false);
    }
  };
  const handleGoogleLogin = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setAuthError(getAuthErrorMessage(err.code, 'google'));
    } finally {
      setAuthLoading(false);
    }
  };
  const handleForgotPasswordSubmit = async (email) => {
    if (!email) throw new Error('Please enter your email.');
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      throw new Error(getAuthErrorMessage(err.code, 'signin'));
    }
  };
  const handleSwitchMode = (mode) => {
    setAuthMode(mode);
    setAuthError('');
    setAuthEmail('');
    setAuthPassword('');
  };

  if (!isAuthenticated) {
    return (
      <LoginPage
        mode={authMode}
        email={authEmail}
        password={authPassword}
        onEmailChange={e => { setAuthEmail(e.target.value); setAuthError(''); }}
        onPasswordChange={e => { setAuthPassword(e.target.value); setAuthError(''); }}
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        onGoogleLogin={handleGoogleLogin}
        onForgotPasswordSubmit={handleForgotPasswordSubmit}
        onSwitchMode={handleSwitchMode}
        loading={authLoading}
        error={authError}
      />
    );
  }

  // Show username modal if username is required and loading is complete
  if (showUsernameModal && !usernameLoading) {
    return (
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
            <button 
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold" 
              onClick={handleSaveUsername}
            >
              Save Username
            </button>
            <button 
              className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-bold" 
              onClick={() => setShowUsernameModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading if username is still loading
  if (usernameLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="flex items-center">
          <svg className="animate-spin h-8 w-8 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-cover bg-center relative" style={{ backgroundImage: `url('/bg_image.png')` }}>
      <div className="absolute inset-0 bg-black bg-opacity-60 z-0" />
      <div className="relative z-10 flex flex-col items-center w-full px-2">
        {error && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center border-2 border-red-400">
            <span>{error}</span>
            <button className="ml-4 text-white font-bold text-xl" onClick={dismissError}>&times;</button>
          </div>
        )}
        <MainHeader
          username={currentPlayerData && currentPlayerData.username ? currentPlayerData.username : `Player_${userId ? userId.slice(-6) : 'Unknown'}`}
          onLogout={handleLogout}
          loading={authLoading}
        />
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 md:gap-6 mt-2">
          {/* Left Column: Status + Chats */}
          <div className="flex flex-col gap-6 w-full md:w-1/3 min-w-[280px] max-w-md">
            <StatusCard
              status={status}
              statusLoading={statusLoading}
              onSetStatus={handleSetStatus}
              STATUS_OPTIONS={STATUS_OPTIONS}
            />
            <ChatsListCard
              userChats={userChats}
              chatsLoading={chatsLoading}
              userId={userId}
              userIdToUsername={userIdToUsername}
              onOpenChat={setActiveChat}
            />
          </div>
          {/* Right Column: Players Online */}
          <div className="w-full md:w-2/3 flex flex-col">
            <div className="flex-1 min-h-[400px] max-h-[70vh] overflow-y-auto">
              <PlayersListCard
                players={players}
                playersLoading={playersLoading}
                userId={userId}
                chatRequestsSent={chatRequestsSent}
                onRequestChat={handleRequestChat}
                userIdToUsername={userIdToUsername}
                OFFLINE_THRESHOLD={OFFLINE_THRESHOLD}
              />
            </div>
          </div>
        </div>
        {/* Modals and overlays remain as before */}
        {/* ... Username Modal, Chat Modal, Requests Modal ... */}
      </div>
    </div>
  );
}

export default App;