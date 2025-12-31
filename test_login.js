const { createClient } = require('@supabase/supabase-js');

// Credentials you provided earlier
const url = 'https://gcaohjowfxcrhehqglwv.supabase.co';
const key = 'sb_publishable_hR5FeWrt2obk419MoyAezQ_29uzmaaU';

const supabase = createClient(url, key);

async function test() {
    console.log("Attempting to login as super@etamax.com...");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'super@etamax.com',
        password: 'password123'
    });

    if (error) {
        console.error('❌ Login Failed:', error.message);
    } else {
        console.log('✅ Login Success!');
        console.log('User ID:', data.user.id);
        console.log('Role in Metadata:', data.user.user_metadata.role);
    }
}

test();
