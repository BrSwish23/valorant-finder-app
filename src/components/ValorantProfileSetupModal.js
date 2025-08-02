import React, { useState, useEffect } from 'react';

const ValorantProfileSetupModal = ({ 
  onSave, 
  onCancel, 
  loading = false, 
  isEditMode = false,
  currentValorantName = '',
  currentValorantTag = ''
}) => {
  const [valorantName, setValorantName] = useState('');
  const [valorantTag, setValorantTag] = useState('');
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);

  // Pre-populate fields when in edit mode
  useEffect(() => {
    if (isEditMode) {
      setValorantName(currentValorantName);
      setValorantTag(currentValorantTag);
    }
  }, [isEditMode, currentValorantName, currentValorantTag]);

  // Validate inputs
  const validateInputs = () => {
    if (!valorantName.trim()) {
      setError('Valorant Name is required');
      return false;
    }
    if (!valorantTag.trim()) {
      setError('Valorant Tag is required');
      return false;
    }
    if (valorantName.length < 3 || valorantName.length > 16) {
      setError('Valorant Name must be between 3-16 characters');
      return false;
    }
    if (valorantTag.length < 3 || valorantTag.length > 5) {
      setError('Valorant Tag must be between 3-5 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(valorantName)) {
      setError('Valorant Name can only contain letters, numbers, and spaces');
      return false;
    }
    if (!/^[a-zA-Z0-9]+$/.test(valorantTag)) {
      setError('Valorant Tag can only contain letters and numbers');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!validateInputs()) {
      return;
    }

    setValidating(true);
    try {
      await onSave(valorantName.trim(), valorantTag.trim());
    } catch (err) {
      setError(err.message || 'Failed to verify Valorant profile. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !validating && !loading) {
      handleSubmit();
    }
  };

  const getTitle = () => {
    return isEditMode ? 'Edit Valorant Profile' : 'Link Your Valorant Profile';
  };

  const getButtonText = () => {
    if (validating) {
      return 'Verifying...';
    }
    return isEditMode ? 'Update Profile' : 'Verify & Continue';
  };

  const getDescription = () => {
    if (isEditMode) {
      return 'Update your Valorant in-game name and tag to keep your profile current.';
    }
    return 'Enter your Valorant in-game name and tag to link your profile.';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
      <div className="bg-gray-900 p-6 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700 flex flex-col">
        <h3 className="text-xl font-bold text-blue-400 mb-4 text-center">
          {getTitle()}
        </h3>
        
        <div className="mb-4 text-sm text-gray-300">
          <p className="mb-2">{getDescription()}</p>
          <p className="text-xs text-gray-400">
            Example: If your in-game name is "Kakashi1425#8516", enter "Kakashi1425" as name and "8516" as tag.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Valorant Name
            </label>
            <input
              className="w-full rounded-lg p-3 bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              type="text"
              placeholder="e.g., Kakashi1425"
              value={valorantName}
              onChange={e => {
                setValorantName(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              maxLength={16}
              disabled={validating || loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Valorant Tag
            </label>
            <input
              className="w-full rounded-lg p-3 bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              type="text"
              placeholder="e.g., 8516"
              value={valorantTag}
              onChange={e => {
                setValorantTag(e.target.value.replace(/[^a-zA-Z0-9]/g, ''));
                setError('');
              }}
              onKeyPress={handleKeyPress}
              maxLength={5}
              disabled={validating || loading}
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-600/20 border border-red-600 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button 
            className="flex-1 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            onClick={handleSubmit}
            disabled={validating || loading || !valorantName.trim() || !valorantTag.trim()}
          >
            {validating ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Verifying...
              </>
            ) : (
              getButtonText()
            )}
          </button>
          
          <button 
            className="px-4 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-bold disabled:opacity-60"
            onClick={onCancel}
            disabled={validating || loading}
          >
            Cancel
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-400 text-center">
          <p>We'll verify your profile with the Valorant API to ensure accuracy.</p>
        </div>
      </div>
    </div>
  );
};

export default ValorantProfileSetupModal; 