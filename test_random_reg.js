const { createClient } = require('@supabase/supabase-js');

const url = 'https://gcaohjowfxcrhehqglwv.supabase.co';
const key = 'sb_publishable_hR5FeWrt2obk419MoyAezQ_29uzmaaU';

const supabase = createClient(url, key);

async function testRandomRegistration() {
    const randomEmail = `test_${Date.now()}@example.com`;
    console.log(`Attempting to Register Random User: ${randomEmail}`);

    const { data, error } = await supabase.auth.signUp({
        email: randomEmail,
        password: 'password123',
        options: {
            data: { name: 'Test User' }
        }
    });

    if (error) {
        console.error('❌ REGISTRATION FAILED:', error.message);
        console.error('Error Details:', error);
    } else {
        console.log('✅ REGISTRATION SUCCESS!');
        console.log('User ID:', data.user?.id);
    }
}

testRandomRegistration();
