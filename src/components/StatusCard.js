import React from 'react';

const StatusCard = ({ status, statusLoading, onSetStatus, STATUS_OPTIONS }) => (
  <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-white/20 mb-8">
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
          onClick={() => onSetStatus(opt.value)}
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
);

export default StatusCard; 