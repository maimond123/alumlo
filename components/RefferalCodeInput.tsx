'use client'

import { useState, useEffect } from 'react';
import { supabase } from '../app/data/supabase';

const ReferralCodeInput = () => {
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Close the modal after 3 seconds
  useEffect(() => {
    if (error && showModal) {
      const timer = setTimeout(() => {
        setShowModal(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [error, showModal]);

  const handleDemo = async () => {
    try {
      // Call the server-side API to verify and process the referral code
      const response = await fetch('/api/verify-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setError(result.error || 'An error occurred');
        setShowModal(true);
        return;
      }
      
      // Set the session in the client
      if (result.session) {
        await supabase.auth.setSession(result.session);
      }
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Error processing referral code:', err);
      setError('An error occurred while processing the referral code.');
      setShowModal(true);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2 w-full">
        <input
          type="text"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          placeholder="Enter referral code"
          className="px-4 py-3 rounded-l-full border-2 border-teal-500 border-r-0 focus:outline-none w-full sm:w-96"
        />
        <button 
          onClick={handleDemo}
          className="bg-teal-500 text-white px-8 py-3 rounded-r-full text-lg font-semibold hover:bg-teal-600 transition-colors border-2 border-teal-500"
        >
          Demo Now
        </button>
      </div>
      
      {/* Error Modal - No dark overlay */}
      {showModal && error && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg z-10 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-500">Error</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralCodeInput;