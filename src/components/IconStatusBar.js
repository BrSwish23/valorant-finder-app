import React, { useState } from 'react';

const IconStatusBar = ({ currentStatus, onStatusChange, loading = false }) => {
  const [hoveredStatus, setHoveredStatus] = useState(null);

  const statusOptions = [
    {
      value: 'Looking to Queue',
      label: 'Looking to Queue',
      description: 'Find a partner or fill a slot in a party',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      value: 'Available for 5v5',
      label: 'Looking for Custom 5v5',
      description: 'Ready for competitive custom matches',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: 'green',
      gradient: 'from-green-500 to-green-600'
    },
    {
      value: 'Offline',
      label: 'Offline',
      description: 'Currently unavailable for matches',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
      ),
      color: 'gray',
      gradient: 'from-gray-500 to-gray-600'
    }
  ];

  const getStatusColorClasses = (status, isActive, isHovered) => {
    const statusConfig = statusOptions.find(s => s.value === status.value);
    const { color } = statusConfig;
    
    if (isActive) {
      return {
        bg: `bg-gradient-to-r ${statusConfig.gradient}`,
        text: 'text-white',
        border: `border-${color}-400`,
        shadow: `shadow-${color}-500/50`
      };
    }
    
    if (isHovered) {
      return {
        bg: `bg-${color}-600/20`,
        text: `text-${color}-300`,
        border: `border-${color}-500/50`,
        shadow: 'shadow-lg'
      };
    }
    
    return {
      bg: 'bg-gray-800/60',
      text: 'text-gray-400',
      border: 'border-gray-600/50',
      shadow: 'shadow-md'
    };
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-8">
      <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 text-center">
          Set Your Status
        </h3>
        
        <div className="flex justify-center items-center gap-6">
          {statusOptions.map((status) => {
            const isActive = currentStatus === status.value;
            const isHovered = hoveredStatus === status.value;
            const colorClasses = getStatusColorClasses(status, isActive, isHovered);
            
            return (
              <div key={status.value} className="relative">
                <button
                  onClick={() => !loading && onStatusChange(status.value)}
                  onMouseEnter={() => setHoveredStatus(status.value)}
                  onMouseLeave={() => setHoveredStatus(null)}
                  disabled={loading}
                  className={`
                    relative group p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                    ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} ${colorClasses.shadow}
                  `}
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center">
                    {status.icon}
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-current animate-pulse" />
                  )}
                  
                  {/* Loading indicator */}
                  {loading && isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                      <svg className="w-4 h-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                    </div>
                  )}
                </button>

                {/* Tooltip */}
                {hoveredStatus === status.value && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
                    <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl border border-gray-700 text-sm whitespace-nowrap">
                      <div className="font-semibold">{status.label}</div>
                      <div className="text-gray-300 text-xs mt-1">{status.description}</div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status Description */}
        <div className="mt-4 text-center">
          {currentStatus && (
            <div className="text-sm text-gray-400">
              Current Status: <span className="text-white font-medium">{currentStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IconStatusBar; 