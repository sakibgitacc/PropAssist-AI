const { execSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2).join(' ');
try {
  execSync(`node src/scripts/setup-super-admin.js ${args}`, {
    cwd: path.join(__dirname, '..', 'backend'),
    stdio: 'inherit'
  });
} catch (err) {
  process.exit(1);
}
