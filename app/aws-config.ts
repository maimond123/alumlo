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
    region: process.env.NEXT_PUBLIC_AWS_REGION!,
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
    userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
    mandatorySignIn: false,
    oauth: {
      domain: 'alumintel.auth.us-east-2.amazoncognito.com',
      scope: ['email', 'openid', 'profile'],
      redirectSignIn: 'https://www.alumintel.com/dashboard',
      redirectSignOut: 'https://www.alumintel.com/',
      responseType: 'code',
    },
  },
};

console.log('Final AWS Config:', config);
Amplify.configure(config as any);