import { Amplify } from 'aws-amplify';

if (!process.env.NEXT_PUBLIC_AWS_REGION || 
    !process.env.NEXT_PUBLIC_USER_POOL_ID || 
    !process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID) {
  throw new Error('Required AWS configuration is missing');
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
      signUpVerificationMethod: 'link'
    }
  }
});