import { Amplify } from '@aws-amplify/core';

if (!process.env.NEXT_PUBLIC_USER_POOL_ID || 
    !process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID) {
  throw new Error('Required AWS configuration is missing');
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID
    }
  }
});