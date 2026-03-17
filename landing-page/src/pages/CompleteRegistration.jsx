import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2, Play, Apple } from 'lucide-react';

const CompleteRegistration = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [inviteData, setInviteData] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No invite token provided. Please use the exact link from your email.');
      setLoading(false);
      return;
    }
    
    // Fetch invite details
    fetch(`https://faculty-app-j8ct.onrender.com/api/auth/invite/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Invalid or expired invite link');
        }
        return data;
      })
      .then(data => setInviteData(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('https://faculty-app-j8ct.onrender.com/api/auth/complete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-kiit-green selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-kiit-green rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl leading-none">F</span>
          </div>
        </div>
        {!success && (
           <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
             Complete Your Registration
           </h2>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 relative overflow-hidden"
        >
          {loading ? (
             <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="w-10 h-10 text-kiit-green animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Verifying your invite link...</p>
             </div>
          ) : error && !inviteData ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
               <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                 <AlertCircle size={32} />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">Registration Error</h3>
               <p className="text-gray-600 mb-6">{error}</p>
               <a href="/" className="text-kiit-green font-semibold hover:underline">
                 Return to Home
               </a>
            </div>
          ) : success ? (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-center py-4"
             >
                <div className="w-20 h-20 bg-green-50 text-kiit-green rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Account Created Successfully!</h3>
                <p className="text-gray-600 mb-8">
                  Welcome, <span className="font-semibold text-gray-900">{inviteData?.name}</span>!<br/>
                  Your account has been created. Download the Faculty Substitute App to login and start using the platform.
                </p>

                <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left border border-gray-100">
                  <p className="text-sm text-gray-500 mb-2 uppercase tracking-wider font-semibold">Login Credentials</p>
                  <p className="text-gray-900 font-medium flex items-center gap-2 mb-1">
                    <span className="text-gray-400">📧</span> {inviteData?.email}
                  </p>
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    <span className="text-gray-400">🔑</span> ******** (the password you just set)
                  </p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <a href="#" className="flex items-center justify-center gap-2 bg-kiit-green text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors w-full">
                    <Play size={20} />
                    Download for Android
                  </a>
                  <button disabled className="flex items-center justify-center gap-2 bg-gray-100 text-gray-400 px-6 py-3 rounded-lg font-bold cursor-not-allowed w-full border border-gray-200">
                    <Apple size={20} />
                    Coming Soon: iOS
                  </button>
                </div>
             </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={inviteData.name}
                    readOnly
                    className="appearance-none block w-full px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm bg-gray-50 text-gray-500 focus:outline-none sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={inviteData.department}
                    readOnly
                    className="appearance-none block w-full px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm bg-gray-50 text-gray-500 focus:outline-none sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={inviteData.email}
                  readOnly
                  className="appearance-none block w-full px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm bg-gray-50 text-gray-500 focus:outline-none sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={inviteData.phone}
                  readOnly
                  className="appearance-none block w-full px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm bg-gray-50 text-gray-500 focus:outline-none sm:text-sm"
                />
              </div>

              <div className="border-t border-gray-100 pt-5 mt-2">
                <p className="text-sm text-gray-500 mb-4">Set a password to complete your account setup.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-kiit-green focus:border-kiit-green sm:text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-kiit-green focus:border-kiit-green sm:text-sm transition-colors"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm"
                >
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-kiit-green hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kiit-green disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Creating Account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CompleteRegistration;
