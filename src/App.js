import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { signInAnonymously, onAuthStateChanged, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, onSnapshot, query, orderBy, where, addDoc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
import LoginPage from './LoginPage';

// Import new redesigned components
import RedesignedHeader from './components/RedesignedHeader';
import MainLandingBanner from './components/MainLandingBanner';
import EnhancedProfileBanner from './components/EnhancedProfileBanner';
import IconStatusBar from './components/IconStatusBar';
import RankFilterSection from './components/RankFilterSection';
import RedesignedPlayersGrid from './components/RedesignedPlayersGrid';

// Import existing components that we still need
import ChatsListCard from './components/ChatsListCard';
import ChatWindow from './components/ChatWindow';
import MessageRequests from './components/MessageRequests';
import ValorantProfileSetupModal from './components/ValorantProfileSetupModal';

// Import API utilities
import { validateValorantProfile, updatePlayerProfile, formatRankForDisplay, fetchLifetimeMatches } from './utils/valorantApi';

const STATUS_OPTIONS = [
  { label: 'Looking to Queue', value: 'Looking to Queue' },
  { label: 'Available for 5v5', value: 'Available for 5v5' },
  { label: 'Offline', value: 'Offline' },
];

const OFFLINE_THRESHOLD = 60 * 1000; // 60 seconds

function App() {
  // Auth states
  const [authUser, setAuthUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  
  // App states
  const [error, _setError] = useState(null);
  const setError = (msg) => {
    console.trace('setError called (global catch-all):', msg);
    _setError(msg);
  };
  
  // Player and status states
  const [status, setStatus] = useState('Offline');
  const [statusLoading, setStatusLoading] = useState(false);
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [onlinePlayersCount, setOnlinePlayersCount] = useState(0);
  
  // Chat states
  const [chatRequestsSent, setChatRequestsSent] = useState({});
  const [userChats, setUserChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  // Message request states
  const [messageRequests, setMessageRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [userIdToUsername, setUserIdToUsername] = useState({});
  
  // User profile states
  const [username, setUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [currentPlayerData, setCurrentPlayerData] = useState(null);
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Valorant profile states
  const [showValorantProfileModal, setShowValorantProfileModal] = useState(false);
  const [valorantProfileLoading, setValorantProfileLoading] = useState(false);

  // New redesign states
  const [rankFilter, setRankFilter] = useState('all');
  const [totalMatches, setTotalMatches] = useState(1247); // Mock data for now
  
  // Handle rank filter changes
  const handleRankFilterChange = (newFilter) => {
    setRankFilter(newFilter);
  };

  // Auth state listener
  useEffect(() => {
    console.log('Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
      setAuthUser(user);
      setAuthInitialized(true);
      
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
  }, []);

  // Auth error message utility
  const getAuthErrorMessage = (code, context = 'signin') => {
    switch (code) {
      case 'auth/user-not-found':
        return context === 'signin' ? 'No account found with this email.' : 'Account not found.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in cancelled.';
      case 'auth/cancelled-popup-request':
        return 'Another sign-in popup is already open.';
      default:
        return 'Authentication failed. Please try again.';
    }
  };

  // Auth handlers
  const handleEmailSignIn = async (email, password) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error.code, 'signin'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignUp = async (email, password) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error.code, 'signup'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError(getAuthErrorMessage(error.code, 'google'));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async (email) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      setAuthError(getAuthErrorMessage(error.code, 'reset'));
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      setError('Failed to logout: ' + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Player data listener
  useEffect(() => {
    if (!authUser) return;

    const playerRef = doc(db, 'artifacts/valorant-finder/public/data/players', authUser.uid);
    
    const unsubscribe = onSnapshot(playerRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log('🔍 Current player data:', data);
        setCurrentPlayerData(data);
        setUsername(data.username || '');
        
        // Show Valorant profile modal if username exists but no Valorant profile
        if (data.username && !data.valorantName && !data.valorantTag) {
          console.log('📝 Showing Valorant profile modal - no valorantName/valorantTag found');
          setShowValorantProfileModal(true);
        } else if (data.valorantName && data.valorantTag) {
          console.log('✅ Valorant profile found:', `${data.valorantName}#${data.valorantTag}`);
          console.log('📊 Profile stats:', {
            rank: data.valorantRank,
            wins: data.lifetimeWins,
            games: data.lifetimeGamesPlayed,
            winRate: data.lifetimeGamesPlayed > 0 ? (data.lifetimeWins / data.lifetimeGamesPlayed * 100).toFixed(1) + '%' : '0%'
          });
        }
      } else {
        console.log('❌ No player document found - showing username modal');
        setCurrentPlayerData(null);
        setShowUsernameModal(true);
      }
    }, (error) => {
      console.error('Error listening to player data:', error);
      setError('Failed to load player data: ' + error.message);
    });

    return unsubscribe;
  }, [authUser]);

  // Enhanced API test function for debugging
  const handleTestMmrApi = async () => {
    try {
      console.log('🧪 Testing MMR API call with known player...');
      const testData = await validateValorantProfile('TenZ', '0001');
      console.log('🎯 Test MMR API result:', testData);
      console.log('📊 Extracted data:', {
        rank: testData.valorantRank,
        wins: testData.lifetimeWins,
        games: testData.lifetimeGamesPlayed,
        winRate: testData.lifetimeGamesPlayed > 0 ? Math.round((testData.lifetimeWins / testData.lifetimeGamesPlayed) * 100) : 0
      });
    } catch (error) {
      console.error('❌ Test MMR API failed:', error.message);
    }
  };

  // Test current user's profile update
  const handleTestCurrentUserProfile = async () => {
    if (!currentPlayerData?.valorantName || !currentPlayerData?.valorantTag) {
      console.error('❌ No current user Valorant profile found');
      return;
    }
    
    try {
      console.log(`🧪 Testing profile update for current user: ${currentPlayerData.valorantName}#${currentPlayerData.valorantTag}`);
      const updatedData = await updatePlayerProfile(currentPlayerData.valorantName, currentPlayerData.valorantTag);
      console.log('🎯 Current user profile update result:', updatedData);
      
      // Actually update the profile in Firestore for testing
      const updatePayload = {
        ...updatedData,
        lastProfileUpdate: serverTimestamp(),
        lastUpdated: serverTimestamp()
      };
      
      const playerRef = doc(db, 'artifacts/valorant-finder/public/data/players', authUser.uid);
      await updateDoc(playerRef, updatePayload);
      console.log('✅ Test profile update saved to Firestore');
      
    } catch (error) {
      console.error('❌ Current user profile test failed:', error.message);
    }
  };

  // Direct API test without CORS proxy
  const handleTestDirectApi = async () => {
    try {
      console.log('🧪 Testing DIRECT API call (will likely fail due to CORS)...');
      const url = `https://api.henrikdev.xyz/valorant/v2/mmr/AP/TenZ/0001`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'HDEV-f1588d35-627e-4c94-8bc9-8d967b3d2f88',
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📥 Direct API Response status:', response.status);
      const data = await response.json();
      console.log('📊 Direct API Response data:', data);
    } catch (error) {
      console.error('❌ Direct API failed (expected due to CORS):', error.message);
    }
  };

  // Players list listener
  useEffect(() => {
    if (!authUser) return;

    setPlayersLoading(true);
    const playersRef = collection(db, 'artifacts/valorant-finder/public/data/players');
    const playersQuery = query(playersRef, orderBy('lastUpdated', 'desc'));

    const unsubscribe = onSnapshot(playersQuery, (snapshot) => {
      const currentTime = Date.now();
      const playersList = [];
      const usernameMap = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const lastUpdated = data.lastUpdated?.toDate?.()?.getTime() || 0;
        const isOnline = currentTime - lastUpdated < OFFLINE_THRESHOLD;
        
        if (doc.id !== authUser.uid && data.username) {
          playersList.push({
            ...data,
            userId: doc.id,
            isOnline,
            displayStatus: isOnline ? data.status : 'Offline'
          });
        }
        
        if (data.username) {
          usernameMap[doc.id] = data.username;
        }
      });

      setPlayers(playersList);
      setOnlinePlayersCount(playersList.filter(p => p.isOnline).length);
      setUserIdToUsername(usernameMap);
      setPlayersLoading(false);
    }, (error) => {
      console.error('Error listening to players:', error);
      setError('Failed to load players: ' + error.message);
      setPlayersLoading(false);
    });

    return unsubscribe;
  }, [authUser]);

  // Heartbeat effect
  useEffect(() => {
    if (!authUser || !currentPlayerData) return;

    const interval = setInterval(async () => {
      try {
        const playerRef = doc(db, 'artifacts/valorant-finder/public/data/players', authUser.uid);
        await updateDoc(playerRef, {
          lastUpdated: serverTimestamp(),
          lastActive: serverTimestamp()
        });
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [authUser, currentPlayerData]);

  // Periodic profile update effect with retry mechanism
  useEffect(() => {
    if (!authUser || !currentPlayerData?.valorantName || !currentPlayerData?.valorantTag) return;

    let retryCount = 0;
    const maxRetries = 3;
    const baseInterval = 15 * 60 * 1000; // 15 minutes
    
    const performUpdate = async (isRetry = false) => {
      try {
        console.log(`🔄 ${isRetry ? 'Retrying' : 'Performing'} periodic profile update for ${currentPlayerData.valorantName}#${currentPlayerData.valorantTag}...`);
        const updatedData = await updatePlayerProfile(currentPlayerData.valorantName, currentPlayerData.valorantTag);
        
        // Add serverTimestamp for lastProfileUpdate
        const updatePayload = {
          ...updatedData,
          lastProfileUpdate: serverTimestamp(),
          lastUpdated: serverTimestamp()
        };
        
        const playerRef = doc(db, 'artifacts/valorant-finder/public/data/players', authUser.uid);
        await updateDoc(playerRef, updatePayload);
        
        console.log('✅ Periodic profile update completed successfully');
        console.log('📊 Updated data:', {
          rank: updatedData.valorantRank,
          wins: updatedData.lifetimeWins,
          games: updatedData.lifetimeGamesPlayed,
          winRate: updatedData.lifetimeWinRate
        });
        
        // Reset retry count on success
        retryCount = 0;
        
      } catch (error) {
        console.error('❌ Periodic profile update failed:', error.message);
        retryCount++;
        
        // Log additional details for debugging
        if (error.message.includes('proxies')) {
          console.error('🔧 API connectivity issue - all CORS proxies failed');
        }
        
        // Retry with exponential backoff if under max retries
        if (retryCount <= maxRetries) {
          const retryDelay = Math.min(60000 * Math.pow(2, retryCount - 1), 300000); // Max 5 minutes
          console.log(`🔄 Scheduling retry ${retryCount}/${maxRetries} in ${retryDelay / 1000} seconds...`);
          setTimeout(() => performUpdate(true), retryDelay);
        } else {
          console.error(`❌ Max retries (${maxRetries}) exceeded for profile update`);
          retryCount = 0; // Reset for next interval
        }
      }
    };

    // Initial update after 1 minute (to avoid immediate load)
    const initialTimeout = setTimeout(() => performUpdate(), 60000);
    
    // Regular interval updates
    const interval = setInterval(() => performUpdate(), baseInterval);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [authUser, currentPlayerData]);

  // Chat listeners and handlers
  useEffect(() => {
    if (!authUser) return;

    setChatsLoading(true);
    const chatsRef = collection(db, 'artifacts/valorant-finder/public/data/chats');
    const chatsQuery = query(
      chatsRef,
      where('participants', 'array-contains', authUser.uid),
      where('status', '==', 'active'),
      orderBy('lastUpdated', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserChats(chatsList);
      setChatsLoading(false);
    }, (error) => {
      console.error('Error listening to chats:', error);
      setError('Failed to load chats: ' + error.message);
      setChatsLoading(false);
    });

    return unsubscribe;
  }, [authUser]);

  // Message requests listener
  useEffect(() => {
    if (!authUser) return;

    setRequestsLoading(true);
    const requestsRef = collection(db, 'artifacts/valorant-finder/public/data/chats');
    const requestsQuery = query(
      requestsRef,
      where('participants', 'array-contains', authUser.uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requestsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Separate incoming and outgoing requests
      const incoming = requestsList.filter(req => req.requestedBy !== authUser.uid);
      const outgoing = requestsList.filter(req => req.requestedBy === authUser.uid);
      
      setMessageRequests(incoming);
      
      // Update sent requests state
      const sentRequestsMap = {};
      outgoing.forEach(req => {
        const otherUserId = req.participants.find(id => id !== authUser.uid);
        sentRequestsMap[otherUserId] = req.id;
      });
      setChatRequestsSent(sentRequestsMap);
      
      setRequestsLoading(false);
    }, (error) => {
      console.error('Error listening to message requests:', error);
      setError('Failed to load message requests: ' + error.message);
      setRequestsLoading(false);
    });

    return unsubscribe;
  }, [authUser]);

  // Chat messages listener for active chat
  useEffect(() => {
    if (!activeChat) {
      setChatMessages([]);
      return;
    }

    const messagesRef = collection(db, 'artifacts/valorant-finder/public/data/chats', activeChat.id, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChatMessages(messagesList);
    }, (error) => {
      console.error('Error listening to messages:', error);
      setError('Failed to load messages: ' + error.message);
    });

    return unsubscribe;
  }, [activeChat]);

  // Username setup handler
  const handleSetUsername = async (newUsername) => {
    if (!authUser) return;

    setUsernameLoading(true);
    setUsernameError('');

    try {
      const trimmedUsername = newUsername.trim();
      if (!trimmedUsername) {
        setUsernameError('Username cannot be empty');
        return;
      }

      const playerRef = doc(db, 'artifacts/valorant-finder/public/data/players', authUser.uid);
      await setDoc(playerRef, {
        userId: authUser.uid,
        username: trimmedUsername,
        status: 'Offline',
        lastUpdated: serverTimestamp(),
        lastActive: serverTimestamp()
      });

      setShowUsernameModal(false);
      setUsernameInput('');
    } catch (error) {
      console.error('Error setting username:', error);
      setUsernameError('Failed to set username: ' + error.message);
    } finally {
      setUsernameLoading(false);
    }
  };

  // Valorant profile setup handler
  const handleSaveValorantProfile = async (valorantName, valorantTag) => {
    if (!authUser) return;

    setValorantProfileLoading(true);
    try {
      console.log('🔍 Step 1: Validating Valorant profile...');
      const validatedData = await validateValorantProfile(valorantName, valorantTag);
      console.log('✅ Step 1 Complete: Profile validation successful');
      console.log('📊 Validated data:', validatedData);

      console.log('💾 Step 2: Saving to Firestore...');
      const playerRef = doc(db, 'artifacts/valorant-finder/public/data/players', authUser.uid);
      
      // Calculate lifetime win rate
      let lifetimeWinRate = 0;
      const wins = validatedData.lifetimeWins || 0;
      const games = validatedData.lifetimeGamesPlayed || 0;
      if (games > 0) {
        lifetimeWinRate = Math.round((wins / games) * 100);
      }

      const updateData = {
        valorantName: valorantName,
        valorantTag: valorantTag,
        valorantRank: validatedData.valorantRank,
        profilePhotoUrl: validatedData.profilePhotoUrl,
        lifetimeWins: wins,
        lifetimeGamesPlayed: games,
        lifetimeWinRate: lifetimeWinRate,
        lastProfileUpdate: serverTimestamp()
      };

      console.log('📝 Data to save:', updateData);
      
      await updateDoc(playerRef, updateData);
      console.log('✅ Step 2 Complete: Firestore save successful');

      setShowValorantProfileModal(false);
      console.log('🎉 Valorant profile setup completed successfully!');
    } catch (error) {
      console.error('❌ Valorant profile setup failed:', error);
      
      // Distinguish between validation errors and Firebase errors
      if (error.message.includes('Failed to validate Valorant profile')) {
        console.error('🔴 API Validation Error:', error.message);
        throw new Error('API Validation Failed: ' + error.message);
      } else if (error.message.includes('Missing or insufficient permissions')) {
        console.error('🔴 Firebase Permissions Error:', error.message);
        throw new Error('Database Permission Error: Please check Firestore security rules. Contact support if this persists.');
      } else {
        console.error('🔴 Unknown Error:', error.message);
        throw error;
      }
    } finally {
      setValorantProfileLoading(false);
    }
  };

  // Status change handler
  const handleSetStatus = async (newStatus) => {
    if (!authUser || !currentPlayerData) return;

    setStatusLoading(true);
    try {
      const playerRef = doc(db, 'artifacts/valorant-finder/public/data/players', authUser.uid);
      await updateDoc(playerRef, {
        status: newStatus,
        lastUpdated: serverTimestamp(),
        lastActive: serverTimestamp(),
        // Preserve existing Valorant profile data
        ...(currentPlayerData.valorantName && {
          valorantName: currentPlayerData.valorantName,
          valorantTag: currentPlayerData.valorantTag,
          valorantRank: currentPlayerData.valorantRank,
          profilePhotoUrl: currentPlayerData.profilePhotoUrl,
          lifetimeWins: currentPlayerData.lifetimeWins || 0,
          lifetimeGamesPlayed: currentPlayerData.lifetimeGamesPlayed || 0,
          lastProfileUpdate: currentPlayerData.lastProfileUpdate
        })
      });
      setStatus(newStatus);
    } catch (error) {
      console.error('Error setting status:', error);
      setError('Failed to set status: ' + error.message);
    } finally {
      setStatusLoading(false);
    }
  };

  // Chat handlers
  const handleChatClick = async (player) => {
    if (player.clearFilter) {
      handleRankFilterChange('all');
      return;
    }

    try {
      // Check if active chat already exists
      const existingChat = userChats.find(chat => 
        chat.participants.includes(player.userId) && chat.status === 'active'
      );

      if (existingChat) {
        setActiveChat(existingChat);
        return;
      }

      // Check if there's already a pending request (sent or received)
      const allRequestsRef = collection(db, 'artifacts/valorant-finder/public/data/chats');
      const existingRequestQuery = query(
        allRequestsRef,
        where('participants', 'array-contains', authUser.uid)
      );
      
      const requestSnapshot = await getDocs(existingRequestQuery);
      const existingRequest = requestSnapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(player.userId) && 
               (data.status === 'pending' || data.status === 'active');
      });

      if (existingRequest) {
        const requestData = existingRequest.data();
        if (requestData.status === 'pending') {
          setError('Message request already sent or received for this user');
          return;
        }
      }

      // Create new message request
      const chatRef = await addDoc(collection(db, 'artifacts/valorant-finder/public/data/chats'), {
        participants: [authUser.uid, player.userId],
        requestedBy: authUser.uid,
        requestedTo: player.userId,
        status: 'pending',
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        lastMessage: '',
        lastMessageBy: ''
      });

      // Update sent requests state
      setChatRequestsSent(prev => ({
        ...prev,
        [player.userId]: chatRef.id
      }));

      setError('Message request sent! Wait for them to accept.');

    } catch (error) {
      console.error('Error handling chat:', error);
      setError('Failed to send message request: ' + error.message);
    }
  };

  // Accept message request
  const handleAcceptRequest = async (request) => {
    try {
      const chatRef = doc(db, 'artifacts/valorant-finder/public/data/chats', request.id);
      await updateDoc(chatRef, {
        status: 'active',
        lastUpdated: serverTimestamp()
      });

      // Remove from pending requests and add to active chats
      setMessageRequests(prev => prev.filter(req => req.id !== request.id));
      
      setError('Message request accepted!');
    } catch (error) {
      console.error('Error accepting request:', error);
      setError('Failed to accept request: ' + error.message);
    }
  };

  // Decline message request
  const handleDeclineRequest = async (request) => {
    try {
      const chatRef = doc(db, 'artifacts/valorant-finder/public/data/chats', request.id);
      await updateDoc(chatRef, {
        status: 'declined',
        lastUpdated: serverTimestamp()
      });

      // Remove from pending requests
      setMessageRequests(prev => prev.filter(req => req.id !== request.id));
      
      setError('Message request declined.');
    } catch (error) {
      console.error('Error declining request:', error);
      setError('Failed to decline request: ' + error.message);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !activeChat) return;

    setChatLoading(true);
    try {
      const messagesRef = collection(db, 'artifacts/valorant-finder/public/data/chats', activeChat.id, 'messages');
      await addDoc(messagesRef, {
        text: chatMessage.trim(),
        senderId: authUser.uid,
        senderUsername: currentPlayerData?.valorantName && currentPlayerData?.valorantTag 
          ? `${currentPlayerData.valorantName}#${currentPlayerData.valorantTag}`
          : currentPlayerData?.username || 'Unknown User',
        timestamp: serverTimestamp()
      });

      const chatRef = doc(db, 'artifacts/valorant-finder/public/data/chats', activeChat.id);
      await updateDoc(chatRef, {
        lastMessage: chatMessage.trim(),
        lastMessageBy: authUser.uid,
        lastUpdated: serverTimestamp()
      });

      setChatMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message: ' + error.message);
    } finally {
      setChatLoading(false);
    }
  };

  // Show login page if not authenticated
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <LoginPage
        mode={authMode}
        email={authEmail}
        password={authPassword}
        onEmailChange={(e) => setAuthEmail(e.target.value)}
        onPasswordChange={(e) => setAuthPassword(e.target.value)}
        onLogin={() => handleEmailSignIn(authEmail, authPassword)}
        onSignUp={() => handleEmailSignUp(authEmail, authPassword)}
        onGoogleLogin={handleGoogleSignIn}
        onForgotPasswordSubmit={handlePasswordReset}
        onSwitchMode={setAuthMode}
        loading={authLoading}
        error={authError}
      />
    );
  }

  // Show username modal if needed
  if (showUsernameModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-gray-900 p-6 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
          <h3 className="text-xl font-bold text-blue-400 mb-4 text-center">
            Welcome! Set Your Username
          </h3>
          <div className="space-y-4">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Enter your username"
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSetUsername(usernameInput)}
            />
            {usernameError && (
              <div className="text-red-400 text-sm">{usernameError}</div>
            )}
            <button
              onClick={() => handleSetUsername(usernameInput)}
              disabled={usernameLoading || !usernameInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-lg transition"
            >
              {usernameLoading ? 'Setting Username...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main redesigned app
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Redesigned Header */}
      <RedesignedHeader
        username={username}
        valorantName={currentPlayerData?.valorantName}
        valorantTag={currentPlayerData?.valorantTag}
        valorantRank={currentPlayerData?.valorantRank}
        profilePhotoUrl={currentPlayerData?.profilePhotoUrl}
        onLogout={handleLogout}
        loading={authLoading}
        messageRequestsCount={messageRequests.length}
        onShowRequests={() => setShowRequestsModal(true)}
      />

      {/* Main Landing Banner */}
      <MainLandingBanner
        onlinePlayersCount={onlinePlayersCount}
        totalMatches={totalMatches}
      />

      {/* Enhanced Profile Banner */}
      <EnhancedProfileBanner
        username={username}
        valorantName={currentPlayerData?.valorantName}
        valorantTag={currentPlayerData?.valorantTag}
        valorantRank={currentPlayerData?.valorantRank}
        profilePhotoUrl={currentPlayerData?.profilePhotoUrl}
        lifetimeWins={currentPlayerData?.lifetimeWins || 0}
        lifetimeGamesPlayed={currentPlayerData?.lifetimeGamesPlayed || 0}
        onlinePlayersCount={onlinePlayersCount}
        currentStatus={currentPlayerData?.status || status}
      />

      {/* Debug Section - Only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="w-full max-w-4xl mx-auto px-4 mb-4">
          <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="text-yellow-300 font-semibold mb-2">🔧 Debug Tools (Development Only)</h4>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleTestMmrApi}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm"
              >
                Test MMR API
              </button>
              <button
                onClick={handleTestDirectApi}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
              >
                Test Direct API (CORS)
              </button>
              <button
                onClick={() => setShowValorantProfileModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                Show Profile Modal
              </button>
              {currentPlayerData?.valorantName && currentPlayerData?.valorantTag && (
                <button
                  onClick={async () => {
                    try {
                      console.log('🔄 Refreshing profile data...');
                      const updatedData = await updatePlayerProfile(currentPlayerData.valorantName, currentPlayerData.valorantTag);
                      const playerRef = doc(db, 'artifacts/valorant-finder/public/data/players', authUser.uid);
                      await updateDoc(playerRef, updatedData);
                      console.log('✅ Profile refreshed');
                    } catch (error) {
                      console.error('❌ Profile refresh failed:', error);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                >
                  Refresh Profile Data
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
              >
                🔄 Reload Page
              </button>
              <button
                onClick={handleTestMmrApi}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                🧪 Test MMR API
              </button>
              <button
                onClick={handleTestCurrentUserProfile}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm"
              >
                🎯 Test Current Profile
              </button>
            </div>
            <div className="mt-2 text-xs text-yellow-200">
              Check browser console for detailed logs. If you see Firebase permission errors, contact support.
            </div>
          </div>
        </div>
      )}

      {/* Icon Status Bar */}
      <IconStatusBar
        currentStatus={currentPlayerData?.status || status}
        onStatusChange={handleSetStatus}
        loading={statusLoading}
      />

      {/* Rank Filter Section */}
      <RankFilterSection
        onFilterChange={handleRankFilterChange}
        selectedFilter={rankFilter}
      />

      {/* Redesigned Players Grid */}
      <RedesignedPlayersGrid
        players={players}
        currentUserId={authUser?.uid}
        onChatClick={handleChatClick}
        existingChats={userChats.reduce((acc, chat) => {
          const otherUserId = chat.participants.find(id => id !== authUser.uid);
          if (otherUserId) acc[otherUserId] = chat.id;
          return acc;
        }, {})}
        chatRequestsSent={chatRequestsSent}
        rankFilter={rankFilter}
        loading={playersLoading}
      />

      {/* Chat Modal */}
      {activeChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl h-96 border border-gray-700">
            <ChatWindow
              activeChat={activeChat}
              chatMessages={chatMessages}
              chatMessage={chatMessage}
              setChatMessage={setChatMessage}
              onSendMessage={handleSendMessage}
              chatLoading={chatLoading}
              userIdToUsername={userIdToUsername}
              currentPlayerData={currentPlayerData}
              currentUserId={authUser?.uid}
              onClose={() => setActiveChat(null)}
            />
          </div>
        </div>
      )}

      {/* Message Requests Modal */}
      {showRequestsModal && (
        <MessageRequests
          messageRequests={messageRequests}
          requestsLoading={requestsLoading}
          userIdToUsername={userIdToUsername}
          onAcceptRequest={handleAcceptRequest}
          onDeclineRequest={handleDeclineRequest}
          onClose={() => setShowRequestsModal(false)}
        />
      )}

      {/* Valorant Profile Setup Modal */}
      {showValorantProfileModal && (
        <ValorantProfileSetupModal
          onSave={handleSaveValorantProfile}
          onCancel={() => setShowValorantProfileModal(false)}
          loading={valorantProfileLoading}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;