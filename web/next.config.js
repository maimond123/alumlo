const fs = require('fs');
const path = require('path');

// One .env, at the repo root. The ingest pipeline reads it directly and Next
// only looks inside web/, so without this the web app would need a second copy
// of the same keys.
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = nextConfig;
