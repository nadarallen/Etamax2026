/**
 * Script to check for missing environment variables.
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local if it exists
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    console.log("❌ .env.local file not found!");
    process.exit(1);
}

const requiredVars = [
    // Core
    'MONGODB_URI',
    'JWT_SECRET',

    // Payments
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'NEXT_PUBLIC_RAZORPAY_KEY_ID', // Frontend

    // Emails
    'EMAIL_USER',
    'EMAIL_PASS',

    // Rate Limiting (Optional but good)
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',

    // Cron
    'CRON_SECRET',
];

console.log("🔍 Checking Environment Configuration...\n");

let missingCount = 0;

requiredVars.forEach(key => {
    const value = process.env[key];
    const isSet = value && value.trim() !== '' && !value.includes('placeholder') && !value.includes('your-');

    if (isSet) {
        console.log(`✅ ${key} is set.`);
    } else {
        console.log(`❌ ${key} is MISSING or default value.`);
        missingCount++;
    }
});

console.log(`\nSummary: ${missingCount} missing configurations.`);
