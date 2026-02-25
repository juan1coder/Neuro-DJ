const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

const url = 'https://uazu.net/sbagen/sbagen-river-1.4.1.tgz';
const file = fs.createWriteStream('river.tgz');

https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close();
    console.log('Download complete, extracting...');
    try {
      execSync('tar -xzf river.tgz');
      console.log('Extraction complete');
    } catch (e) {
      console.error('Extraction failed', e);
    }
  });
}).on('error', function(err) {
  fs.unlink('river.tgz');
  console.error('Error downloading:', err.message);
});
