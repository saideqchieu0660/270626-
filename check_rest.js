const https = require('https');
https.get('https://firestore.googleapis.com/v1/projects/henosis-web-b6df3/databases/(default)/documents/system_config/api_toggles', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});
