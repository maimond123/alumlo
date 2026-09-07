/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      // Exclude ONNX Runtime binaries from webpack processing
      config.externals = [...(config.externals || []), 'onnxruntime-node'];
      
      // Add a rule to handle binary files
      config.module.rules.push({
        test: /\.node$/,
        use: 'node-loader',
        exclude: /node_modules/,
      });
      
      return config;
    },
    // This is important for Transformers.js to work properly
    experimental: {
      serverComponentsExternalPackages: ['onnxruntime-node', '@xenova/transformers'],
    },
  };
  
  module.exports = nextConfig;