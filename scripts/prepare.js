const fs = require('fs');
const path = require('path');

// Create empty setup script to prevent errors
const setupScript = path.join(__dirname, '..', 'node_modules', '@react-native-community', 'cli', 'setup_env.sh');
const setupDir = path.dirname(setupScript);

if (!fs.existsSync(setupDir)) {
  fs.mkdirSync(setupDir, { recursive: true });
}

fs.writeFileSync(setupScript, '#!/bin/sh\n# Empty setup script\n', { mode: 0o755 });

console.log('Environment setup completed');