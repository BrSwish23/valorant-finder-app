import React from 'react';

const ChatsListCard = ({ userChats, chatsLoading, userId, userIdToUsername, onOpenChat }) => (
  <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-white/20 mt-8 mb-8">
    <h2 className="text-2xl font-bold mb-5 text-yellow-400">Your Chats</h2>
    {chatsLoading ? (
      <div className="flex items-center">
        <svg className="animate-spin h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        Loading chats...
      </div>
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
                onClick={() => onOpenChat(chat)}
              >
                Open
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

export default ChatsListCard; 