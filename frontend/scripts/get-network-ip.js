#!/usr/bin/env node

/**
 * Get local network IP address for mobile testing
 */

import { networkInterfaces } from 'os';

function getLocalIP() {
  const nets = networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
      if (net.family === familyV4Value && !net.internal) {
        results.push({
          interface: name,
          address: net.address
        });
      }
    }
  }

  return results;
}

const ips = getLocalIP();

console.log('\n📱 Mobile Testing Configuration\n');
console.log('Your local network IP addresses:');
ips.forEach(({ interface: iface, address }) => {
  console.log(`  ${iface}: ${address}`);
});

if (ips.length > 0) {
  const primaryIP = ips[0].address;
  console.log('\n📝 To enable mobile testing:');
  console.log(`1. Copy .env.network to .env`);
  console.log(`2. Replace <YOUR_IP> with: ${primaryIP}`);
  console.log(`3. Restart the dev server`);
  console.log(`4. Access from mobile: http://${primaryIP}:5173`);
  console.log('\n✅ Backend will be accessible at: http://${primaryIP}:5000');
} else {
  console.log('\n⚠️  No network interfaces found. Make sure you are connected to Wi-Fi.');
}

console.log('\n');
