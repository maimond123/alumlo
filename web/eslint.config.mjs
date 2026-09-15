import next from 'eslint-config-next';

const config = [
  ...next,
  {
    // Existing browser-state effects need a separate refactor.
    rules: { 'react-hooks/set-state-in-effect': 'warn' },
  },
];

export default config;
