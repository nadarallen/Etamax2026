/**
 * Advanced script to check env vars and output JSON status.
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

const results = {};

keys.forEach(k => {
    const val = envConfig[k];
    const isSet = val && val.length > 5 && !val.includes('placeholder') && !val.includes('your-');
    results[k] = isSet ? "OK" : "MISSING";
});

console.log(JSON.stringify(results, null, 2));
