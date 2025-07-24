import React, { useState } from 'react';

const valorantLogo = '/favicon.png'; // Use PNG logo from public directory
const backgroundImg = '/bg_image.png';
const googleLogo = '/google.png';

const LoginPage = ({
  mode = 'signin',
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onSignUp,
  onGoogleLogin,
  onForgotPasswordSubmit,
  onSwitchMode,
  loading,
  error
}) => {
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleForgotSubmit = async e => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);
    try {
      await onForgotPasswordSubmit(forgotEmail);
      setForgotSuccess('Password reset email sent! Check your inbox.');
    } catch (err) {
      setForgotError(err.message || 'Failed to send reset email.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-cover bg-center relative" style={{ backgroundImage: `url(${backgroundImg})` }}>
      <div className="absolute inset-0 bg-black bg-opacity-60 z-0" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md p-8 rounded-3xl backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl">
        <img src={valorantLogo} alt="Valorant Logo" className="h-16 w-auto mb-2 rounded-lg shadow-lg" />
        <div className="text-lg font-bold tracking-widest text-white mb-1">VALORANT TEAM FINDER</div>
        <h2 className="text-3xl font-extrabold text-white mb-6">{mode === 'signup' ? 'Sign up' : 'Log in'}</h2>
        <form className="w-full flex flex-col gap-4" onSubmit={e => { e.preventDefault(); mode === 'signup' ? onSignUp() : onLogin(); }}>
          <input
            type="email"
            placeholder="Username or Email"
            className="w-full rounded-xl bg-gray-800 bg-opacity-80 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400"
            value={email}
            onChange={onEmailChange}
            autoComplete="username"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl bg-gray-800 bg-opacity-80 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400"
            value={password}
            onChange={onPasswordChange}
            autoComplete="current-password"
            disabled={loading}
          />
          {error && <div className="text-red-400 text-xs font-semibold text-center -mt-2">{error}</div>}
          <div className="flex justify-end">
            {mode === 'signin' && (
              <button type="button" className="text-xs text-gray-300 hover:text-red-400 transition" onClick={() => setShowForgot(true)} disabled={loading}>
                Forgot password?
              </button>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-md transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? (mode === 'signup' ? 'Signing up...' : 'Logging in...') : (mode === 'signup' ? 'Sign up' : 'Log in')}
          </button>
        </form>
        <button
          className="w-full flex items-center justify-center gap-2 mt-4 py-3 rounded-xl bg-white/80 hover:bg-white text-gray-900 font-semibold text-base shadow transition border border-gray-200"
          onClick={onGoogleLogin}
          disabled={loading}
        >
          <img src={googleLogo} alt="Google" className="h-5 w-5" />
          Sign in with Google
        </button>
        <div className="mt-6 text-center text-gray-300 text-sm">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button className="text-red-400 hover:underline font-semibold" onClick={() => onSwitchMode('signin')} disabled={loading}>
                Log in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button className="text-red-400 hover:underline font-semibold" onClick={() => onSwitchMode('signup')} disabled={loading}>
                Sign up
              </button>
            </>
          )}
        </div>
        {/* Forgot Password Modal */}
        {showForgot && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl max-w-xs w-full border border-gray-700 flex flex-col relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-red-400" onClick={() => setShowForgot(false)}>&times;</button>
              <h3 className="text-xl font-bold text-white mb-4">Reset Password</h3>
              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="rounded-lg p-2 bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={forgotEmail}
                  onChange={e => { setForgotEmail(e.target.value); setForgotError(''); setForgotSuccess(''); }}
                  disabled={forgotLoading}
                />
                {forgotError && <div className="text-red-400 text-xs font-semibold text-center">{forgotError}</div>}
                {forgotSuccess && <div className="text-green-400 text-xs font-semibold text-center">{forgotSuccess}</div>}
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-base shadow-md transition disabled:opacity-60"
                  disabled={forgotLoading || !forgotEmail}
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Email'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage; 