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
      // Check if the referral code exists
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', referralCode)
        .single();

      if (error || !data) {
        setError('Invalid referral code');
        setShowModal(true);
        return;
      }

      // Check if the code has uses remaining
      if (data.uses_remaining <= 0) {
        setError('Referral code has reached its usage limit.');
        setShowModal(true);
        return;
      }

      // Update the referral code usage
      const now = new Date().toISOString();
      await supabase
        .from('referral_codes')
        .update({ 
          uses_remaining: data.uses_remaining - 1,
          // If it's the first use, record when it was first used
          ...(data.first_used_at ? {} : { first_used_at: now }),
          // Always update the last used timestamp
          last_used_at: now
        })
        .eq('id', data.id);

      // Authenticate the user using environment variables
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        setError('Admin credentials not configured properly.');
        setShowModal(true);
        return;
      }
      
      const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });

      if (loginError) {
        setError('Login error: ' + loginError.message);
        setShowModal(true);
        return;
      }

      // No success message, just redirect
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