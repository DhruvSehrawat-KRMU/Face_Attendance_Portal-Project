import https from 'https';
import fs from 'fs';
import path from 'path';

const MODEL_DIR = './public/models';

const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const FILES = [
  // SSD Mobilenet V1
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  // Face Landmark 68
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  // Face Recognition
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true });
  }

  for (const file of FILES) {
    const dest = path.join(MODEL_DIR, file);
    if (fs.existsSync(dest)) {
      console.log(`Already exists: ${file}`);
      continue;
    }
    const url = `${BASE_URL}/${file}`;
    console.log(`Downloading: ${file}...`);
    try {
      await download(url, dest);
      console.log(`  Done: ${file}`);
    } catch (err) {
      console.error(`  Failed: ${file} - ${err.message}`);
    }
  }

  console.log('\nAll models downloaded.');
}

main();
