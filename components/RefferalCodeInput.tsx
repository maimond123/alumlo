'use client'

import { useState } from 'react';
import { supabase } from '../app/data/supabase';

const ReferralCodeInput = () => {
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        return;
      }

      // Check if the code is already used
      if (data.is_used) {
        setError('Referral code has already been used.');
        return;
      }

      // Mark the referral code as used
      await supabase
        .from('referral_codes')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', data.id);

      // Log in the user (assuming you have a login function)
    //   const { user, error: loginError } = await supabase.auth.signIn({
    //     email: 'maimondavid553@gmail.com',
    //     password: 'your_password_here' // Replace with the actual password or use a secure method
    //   });

    //   if (loginError) {
    //     setError('Login error: ' + loginError.message);
    //     return;
    //   }

      setSuccess('Successfully logged in! Redirecting to dashboard...');
      // Redirect to the dashboard or refresh the page
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Error processing referral code:', err);
      setError('An error occurred while processing the referral code.');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="text"
        value={referralCode}
        onChange={(e) => setReferralCode(e.target.value)}
        placeholder="Enter referral code"
        className="px-4 py-3 rounded-l-full border-2 border-teal-500 border-r-0 focus:outline-none w-64"
      />
      <button 
        onClick={handleDemo}
        className="bg-teal-500 text-white px-8 py-3 rounded-r-full text-lg font-semibold hover:bg-teal-600 transition-colors border-2 border-teal-500"
      >
        Demo Now
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
    </div>
  );
};

export default ReferralCodeInput;