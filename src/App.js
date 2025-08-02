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
import UnreadMessagesModal from './components/UnreadMessagesModal';
import ValorantProfileSetupModal from './components/ValorantProfileSetupModal';

// Import API utilities
import { validateValorantProfile, updatePlayerProfile, formatRankForDisplay, fetchLifetimeMatches } from './utils/valorantApi';
import API_CONFIG from './config/apiConfig';
import { debugLog, debugError } from './utils/debugUtils';

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
  
  // Unread message states
  const [unreadConversationsCount, setUnreadConversationsCount] = useState(0);
  const [unreadConversations, setUnreadConversations] = useState([]);
  const [showUnreadModal, setShowUnreadModal] = useState(false);
  
  // Rate limiting state
  const [isProfileUpdateInProgress, setIsProfileUpdateInProgress] = useState(false);
  
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
    debugLog('Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
              debugLog('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
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
      debugLog('Cleaning up auth state listener');
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

  // Player data listener with stale data detection
  useEffect(() => {
    if (!authUser) return;

    const playerRef = doc(db, 'artifacts/valorant-finder/public/data/players', authUser.uid);
    
    const unsubscribe = onSnapshot(playerRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        debugLog('🔍 Current player data:', data);
        setCurrentPlayerData(data);
        setUsername(data.username || '');
        
        // Check if profile data is stale (older than 2 hours)
        const checkAndUpdateStaleProfile = async () => {
          if (data.valorantName && data.valorantTag) {
            const lastProfileUpdate = data.lastProfileUpdate?.toDate?.()?.getTime() || 0;
            const currentTime = Date.now();
            const twoHours = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
            
            if (currentTime - lastProfileUpdate > twoHours) {
                        debugLog('🔄 Profile data is stale (older than 2 hours), triggering immediate update...');
          debugLog(`📅 Last update: ${new Date(lastProfileUpdate).toLocaleString()}`);
          debugLog(`⏰ Current time: ${new Date(currentTime).toLocaleString()}`);
              
              try {
                await performRateLimitedProfileUpdate(data.valorantName, data.valorantTag);
                debugLog('✅ Stale profile updated successfully');
              } catch (error) {
                console.error('❌ Failed to update stale profile:', error.message);
              }
            } else {
              debugLog('✅ Profile data is fresh (updated within 2 hours)');
              debugLog(`📅 Last update: ${new Date(lastProfileUpdate).toLocaleString()}`);
            }
          }
        };
        
        // Show Valorant profile modal if username exists but no Valorant profile
        if (data.username && !data.valorantName && !data.valorantTag) {
          debugLog('📝 Showing Valorant profile modal - no valorantName/valorantTag found');
          setShowValorantProfileModal(true);
        } else if (data.valorantName && data.valorantTag) {
                      debugLog('✅ Valorant profile found:', `${data.valorantName}#${data.valorantTag}`);
            debugLog('📊 Profile stats:', {
            rank: data.valorantRank,
            wins: data.lifetimeWins,
            games: data.lifetimeGamesPlayed,
            winRate: data.lifetimeGamesPlayed > 0 ? (data.lifetimeWins / data.lifetimeGamesPlayed * 100).toFixed(1) + '%' : '0%'
          });
          
          // Check for stale data after a short delay to avoid blocking UI
          setTimeout(checkAndUpdateStaleProfile, 2000);
        }
      } else {
        debugLog('❌ No player document found - showing username modal');
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
      debugLog('🧪 Testing MMR API call with known player...');
      debugLog('🔍 API_CONFIG:', API_CONFIG);
      debugLog('🔗 Backend URL:', `${API_CONFIG.BACKEND_BASE_URL}${API_CONFIG.VALIDATE_PROFILE_ENDPOINT}`);
      
      // First test the backend health
              debugLog('🏥 Testing backend health...');
        const healthResponse = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/health`);
        debugLog('🏥 Health response:', healthResponse.status, healthResponse.statusText);
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
                  debugLog('🏥 Health data:', healthData);
      }
      
      const testData = await validateValorantProfile('TenZ', '0001');
              debugLog('🎯 Test MMR API result:', testData);
        debugLog('📊 Extracted data:', {
        rank: testData.valorantRank,
        wins: testData.lifetimeWins,
        games: testData.lifetimeGamesPlayed,
        winRate: testData.lifetimeGamesPlayed > 0 ? Math.round((testData.lifetimeWins / testData.lifetimeGamesPlayed) * 100) : 0
      });
    } catch (error) {
      debugError('❌ Test MMR API failed:', error.message);
      debugError('❌ Full error:', error);
    }
  };

  // Test current user's profile update
  const handleTestCurrentUserProfile = async () => {
    if (!currentPlayerData?.valorantName || !currentPlayerData?.valorantTag) {
      debugError('❌ No current user Valorant profile found');
      return;
    }
    
    try {
              debugLog(`🧪 Testing profile update for current user: ${currentPlayerData.valorantName}#${currentPlayerData.valorantTag}`);
        const updatedData = await updatePlayerProfile(currentPlayerData.valorantName, currentPlayerData.valorantTag);
        debugLog('🎯 Current user profile update result:', updatedData);
      
      // Actually update the profile in Firestore for testing
      const updatePayload = {
        ...updatedData,
        lastProfileUpdate: serverTimestamp(),
        lastUpdated: serverTimestamp()
      };
      
      const playerRef = doc(db, 'artifacts/valorant-finder/public/data/players', authUser.uid);
      await updateDoc(playerRef, updatePayload);
              debugLog('✅ Test profile update saved to Firestore');
      
    } catch (error) {
              debugError('❌ Current user profile test failed:', error.message);
    }
  };

  // Direct API test without CORS proxy
  const handleTestDirectApi = async () => {
    try {
              debugLog('🧪 Testing DIRECT API call (will likely fail due to CORS)...');
      const url = `https://api.henrikdev.xyz/valorant/v2/mmr/AP/TenZ/0001`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'HDEV-f1588d35-627e-4c94-8bc9-8d967b3d2f88',
          'Content-Type': 'application/json',
        }
      });
      
              debugLog('📥 Direct API Response status:', response.status);
        const data = await response.json();
        debugLog('📊 Direct API Response data:', data);
    } catch (error) {
              debugError('❌ Direct API failed (expected due to CORS):', error.message);
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

            debugLog('🔄 Setting up periodic profile updates...');
        debugLog(`👤 User: ${currentPlayerData.valorantName}#${currentPlayerData.valorantTag}`);
        debugLog('⏰ Update interval: 1 hour (rate limited to respect API limits)');
        debugLog('🛡️ Rate limiting: Maximum 1 update per hour per user');

    let retryCount = 0;
    const maxRetries = 2; // Reduced from 3 to 2
    const baseInterval = 60 * 60 * 1000; // 1 hour (increased from 15 minutes)
    
    const performUpdate = async (isRetry = false) => {
      try {
        debugLog(`🔄 ${isRetry ? 'Retrying' : 'Performing'} periodic profile update for ${currentPlayerData.valorantName}#${currentPlayerData.valorantTag}...`);
        
        // Check if we need to update (avoid unnecessary API calls)
        const lastUpdate = currentPlayerData.lastProfileUpdate?.toDate?.()?.getTime() || 0;
        const currentTime = Date.now();
        const timeSinceLastUpdate = currentTime - lastUpdate;
        
        if (timeSinceLastUpdate < baseInterval && !isRetry) {
                      debugLog(`⏭️ Skipping update - last update was ${Math.round(timeSinceLastUpdate / 60000)} minutes ago`);
          return;
        }
        
        await performRateLimitedProfileUpdate(currentPlayerData.valorantName, currentPlayerData.valorantTag);
        
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
                      debugLog(`🔄 Scheduling retry ${retryCount}/${maxRetries} in ${retryDelay / 1000} seconds...`);
          setTimeout(() => performUpdate(true), retryDelay);
        } else {
          console.error(`❌ Max retries (${maxRetries}) exceeded for profile update`);
          retryCount = 0; // Reset for next interval
        }
      }
    };

    // Initial update after 5 minutes (to avoid immediate load and reduce API calls)
    const initialTimeout = setTimeout(() => performUpdate(), 5 * 60000);
    
    // Regular interval updates (every 1 hour)
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
      
      // Calculate unread conversations
      const { count, conversations } = calculateUnreadConversations(chatsList);
      setUnreadConversationsCount(count);
      setUnreadConversations(conversations);
      
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
      
      // Mark chat as read when messages are loaded
      markChatAsRead(activeChat.id);
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
      debugLog('🔍 Step 1: Validating Valorant profile...');
      const validatedData = await validateValorantProfile(valorantName, valorantTag);
      debugLog('✅ Step 1 Complete: Profile validation successful');
      debugLog('📊 Validated data:', validatedData);

              debugLog('💾 Step 2: Saving to Firestore...');
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

              debugLog('📝 Data to save:', updateData);
      
      await updateDoc(playerRef, updateData);
              debugLog('✅ Step 2 Complete: Firestore save successful');

      setShowValorantProfileModal(false);
              debugLog('🎉 Valorant profile setup completed successfully!');
    } catch (error) {
              debugError('❌ Valorant profile setup failed:', error);
      
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
        // Mark messages as read when opening chat
        await markChatAsRead(existingChat.id);
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
        lastMessageBy: '',
        participantReadStatus: {
          [authUser.uid]: serverTimestamp(),
          [player.userId]: null
        }
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
        lastUpdated: serverTimestamp(),
        participantReadStatus: {
          [authUser.uid]: serverTimestamp(),
          [request.requestedBy]: null
        }
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

  // Mark chat as read for current user
  const markChatAsRead = async (chatId) => {
    if (!authUser) return;
    
    try {
      const chatRef = doc(db, 'artifacts/valorant-finder/public/data/chats', chatId);
      await updateDoc(chatRef, {
        [`participantReadStatus.${authUser.uid}`]: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  // Calculate unread conversations
  const calculateUnreadConversations = (chats) => {
    if (!authUser) return { count: 0, conversations: [] };
    
    const unread = chats.filter(chat => {
      const lastMessageAt = chat.lastMessageAt?.toDate?.()?.getTime() || 0;
      const lastReadAt = chat.participantReadStatus?.[authUser.uid]?.toDate?.()?.getTime() || 0;
      return lastMessageAt > lastReadAt;
    });
    
    return {
      count: unread.length,
      conversations: unread
    };
  };

  // Handle opening unread messages modal
  const handleShowUnreadMessages = () => {
    setShowUnreadModal(true);
  };

  // Handle clicking on unread conversation
  const handleUnreadChatClick = async (chat) => {
    setActiveChat(chat);
    setShowUnreadModal(false);
    await markChatAsRead(chat.id);
  };

  // Rate-limited profile update function
  const performRateLimitedProfileUpdate = async (valorantName, valorantTag, isForceUpdate = false) => {
    if (isProfileUpdateInProgress && !isForceUpdate) {
              debugLog('⏸️ Profile update already in progress, skipping...');
      return;
    }
    
    setIsProfileUpdateInProgress(true);
    
    try {
      debugLog(`🔄 Starting profile update for ${valorantName}#${valorantTag}...`);
      const updatedData = await updatePlayerProfile(valorantName, valorantTag);
      
      const updatePayload = {
        ...updatedData,
        lastProfileUpdate: serverTimestamp(),
        lastUpdated: serverTimestamp()
      };
      
      const playerRef = doc(db, 'artifacts/valorant-finder/public/data/players', authUser.uid);
      await updateDoc(playerRef, updatePayload);
      
              debugLog('✅ Profile update completed successfully');
        debugLog('📊 Updated data:', {
        rank: updatedData.valorantRank,
        wins: updatedData.lifetimeWins,
        games: updatedData.lifetimeGamesPlayed,
        winRate: updatedData.lifetimeWinRate
      });
      
    } catch (error) {
              debugError('❌ Profile update failed:', error.message);
      throw error;
    } finally {
      setIsProfileUpdateInProgress(false);
    }
  };

  // Get profile update status for debugging
  const getProfileUpdateStatus = () => {
    if (!currentPlayerData?.lastProfileUpdate) {
      return 'Never updated';
    }
    
    const lastUpdate = currentPlayerData.lastProfileUpdate.toDate?.()?.getTime() || 0;
    const currentTime = Date.now();
    const timeSinceUpdate = currentTime - lastUpdate;
    const minutesAgo = Math.round(timeSinceUpdate / 60000);
    
    if (minutesAgo < 1) return 'Just now';
    if (minutesAgo < 60) return `${minutesAgo} minutes ago`;
    if (minutesAgo < 1440) return `${Math.round(minutesAgo / 60)} hours ago`;
    return `${Math.round(minutesAgo / 1440)} days ago`;
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
        lastUpdated: serverTimestamp(),
        lastMessageAt: serverTimestamp()
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
      <div className="min-h-screen flex items-center justify-center">
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
      <div className="min-h-screen flex items-center justify-center p-4">
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
    <div className="min-h-screen">
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
        unreadConversationsCount={unreadConversationsCount}
        onShowUnreadMessages={handleShowUnreadMessages}
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

      {/* Debug Section - Only visible on localhost */}
      {API_CONFIG.IS_DEVELOPMENT && (
        <div className="w-full max-w-4xl mx-auto px-4 mb-4">
          <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="text-yellow-300 font-semibold mb-2">🔧 Debug Tools (Development Mode)</h4>
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
                      debugLog('🔄 Manually refreshing profile data...');
                      await performRateLimitedProfileUpdate(currentPlayerData.valorantName, currentPlayerData.valorantTag, true);
                      debugLog('✅ Profile refreshed manually');
                    } catch (error) {
                                              debugError('❌ Manual profile refresh failed:', error);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                >
                  🔄 Refresh Profile Data
                </button>
              )}
              {currentPlayerData?.valorantName && currentPlayerData?.valorantTag && (
                <button
                  onClick={async () => {
                    try {
                      debugLog('🚀 Force updating profile data (ignoring last update time)...');
                      await performRateLimitedProfileUpdate(currentPlayerData.valorantName, currentPlayerData.valorantTag, true);
                      debugLog('✅ Force profile update completed');
                    } catch (error) {
                                              debugError('❌ Force profile update failed:', error);
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                >
                  ⚡ Force Update Now
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
            {currentPlayerData?.valorantName && currentPlayerData?.valorantTag && (
              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                <h5 className="text-yellow-300 font-semibold mb-2">📊 Profile Update Status</h5>
                <div className="text-xs text-gray-300 space-y-1">
                  <div><strong>Player:</strong> {currentPlayerData.valorantName}#{currentPlayerData.valorantTag}</div>
                  <div><strong>Last Update:</strong> {getProfileUpdateStatus()}</div>
                  <div><strong>Current Rank:</strong> {currentPlayerData.valorantRank || 'Unknown'}</div>
                  <div><strong>Win Rate:</strong> {currentPlayerData.lifetimeGamesPlayed > 0 ? Math.round((currentPlayerData.lifetimeWins / currentPlayerData.lifetimeGamesPlayed) * 100) : 0}%</div>
                  <div><strong>Games Played:</strong> {currentPlayerData.lifetimeGamesPlayed || 0}</div>
                  <div><strong>Update Status:</strong> 
                    {isProfileUpdateInProgress ? (
                      <span className="text-yellow-400">🔄 In Progress</span>
                    ) : (
                      <span className="text-green-400">✅ Idle</span>
                    )}
                  </div>
                </div>
              </div>
            )}
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
        unreadChats={unreadConversations.reduce((acc, chat) => {
          const otherUserId = chat.participants.find(id => id !== authUser.uid);
          if (otherUserId) acc[otherUserId] = chat.id;
          return acc;
        }, {})}
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

      {/* Unread Messages Modal */}
      {showUnreadModal && (
        <UnreadMessagesModal
          unreadConversations={unreadConversations}
          loading={chatsLoading}
          userIdToUsername={userIdToUsername}
          onChatClick={handleUnreadChatClick}
          onClose={() => setShowUnreadModal(false)}
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