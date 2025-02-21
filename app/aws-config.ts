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
    // REQUIRED - Amazon Cognito Region
    region: process.env.NEXT_PUBLIC_AWS_REGION!,
    // OPTIONAL - Amazon Cognito Identity Pool ID (if using federated identities)
    identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID!,
    // REQUIRED - Amazon Cognito User Pool ID
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
    // REQUIRED - Amazon Cognito Web Client ID (note the key name change)
    userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
    // OPTIONAL - Enforce user authentication prior to accessing AWS resources
    mandatorySignIn: false,
    // OPTIONAL - Hosted UI configuration
    oauth: {
      domain: 'alumintel.auth.us-east-2.amazoncognito.com',
      scope: ['email', 'openid', 'profile'],
      // Use fully-qualified URLs (including protocol)
      redirectSignIn: 'https://www.alumintel.com/dashboard',
      redirectSignOut: 'https://www.alumintel.com/',
      responseType: 'code',
    },
  },
};


console.log('Final AWS Config:', config);
Amplify.configure(config as any);