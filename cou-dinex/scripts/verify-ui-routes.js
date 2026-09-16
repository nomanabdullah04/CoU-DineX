const http = require('http');

const routes = [
  '/login',
  '/register',
  '/register/student',
  '/register/visitor',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
];

async function checkRoute(route) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${route}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          route,
          status: res.statusCode,
          length: data.length,
          hasPlateIcon: data.includes('🍽️') || data.includes('Dine'),
          hasSRSColor: data.includes('0F766E') || data.includes('0f766e'),
        });
      });
    }).on('error', (err) => {
      resolve({ route, error: err.message });
    });
  });
}

async function run() {
  console.log('Testing SRS UI Routes on localhost:3000...\n');
  for (const r of routes) {
    const res = await checkRoute(r);
    console.log(`[${res.status === 200 ? 'PASS' : 'FAIL'}] ${r} -> Status: ${res.status}, Size: ${res.length} bytes, SRS Brand: ${res.hasPlateIcon}`);
  }
}

run();
