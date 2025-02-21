import { Amplify } from 'aws-amplify';

if (
  !process.env.NEXT_PUBLIC_USER_POOL_ID ||
  !process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ||
  !process.env.NEXT_PUBLIC_AWS_REGION
) {
  throw new Error('Required AWS configuration is missing');
}

const config = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
      region: process.env.NEXT_PUBLIC_AWS_REGION
    }
  }
};

console.log('Final AWS Config:', config);
Amplify.configure(config);