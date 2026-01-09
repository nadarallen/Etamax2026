/**
 * Simple script to list missing environment keys.
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '../.env.local');

if (!fs.existsSync(envPath)) {
    console.log("NO_ENV_FILE");
    process.exit(0);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));

const keys = [
    'MONGODB_URI',
    'JWT_SECRET',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'NEXT_PUBLIC_RAZORPAY_KEY_ID',
    'EMAIL_USER',
    'EMAIL_PASS',
    'UPSTASH_REDIS_REST_URL',
    'CRON_SECRET'
];

const missing = [];

keys.forEach(k => {
    const val = envConfig[k];
    const isSet = val && val.length > 2 && !val.includes('placeholder') && !val.includes('your-');
    if (!isSet) missing.push(k);
});

console.log("MISSING_KEYS_START");
console.log(missing.join(','));
console.log("MISSING_KEYS_END");
