import { Amplify } from 'aws-amplify';
import type { ResourcesConfig } from 'aws-amplify';

// Debug logging
console.log('AWS Config Environment Variables:', {
  userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
  userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
  region: process.env.NEXT_PUBLIC_AWS_REGION
});

if (!process.env.NEXT_PUBLIC_USER_POOL_ID ||
    !process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ||
    !process.env.NEXT_PUBLIC_AWS_REGION) {
  throw new Error('Required AWS configuration is missing');
}

const config: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
      loginWith: {
        username: true
      }
    }
  }
};

// Debug logging
console.log('Final AWS Config:', config);

Amplify.configure(config);