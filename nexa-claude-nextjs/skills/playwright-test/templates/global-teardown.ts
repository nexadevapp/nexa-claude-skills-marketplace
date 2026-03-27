import { readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';

const STATE_FILE = path.join(__dirname, '.global-state.json');

async function globalTeardown() {
  try {
    const state = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));

    // Stop the dev server
    if (state.devServerPid) {
      try {
        process.kill(state.devServerPid, 'SIGTERM');
      } catch {
        // Process may have already exited
      }
    }

    // The Testcontainer stops automatically when the Node process exits,
    // but we clean up the state file
    unlinkSync(STATE_FILE);
  } catch {
    // State file may not exist if setup failed
  }
}

export default globalTeardown;
