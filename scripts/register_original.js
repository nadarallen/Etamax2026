/**
 * Script to test original registration flow with Supabase.
 */
const { createClient } = require('@supabase/supabase-js');

const url = 'https://gcaohjowfxcrhehqglwv.supabase.co';
const key = 'sb_publishable_hR5FeWrt2obk419MoyAezQ_29uzmaaU';

const supabase = createClient(url, key);

async function testOriginal() {
    console.log("Attempting to Register super@etamax.com via Script...");

    const { data, error } = await supabase.auth.signUp({
        email: 'super@etamax.com',
        password: 'password123',
        options: {
            data: { name: 'Super Admin Legacy' }
        }
    });

    if (error) {
        console.log('FAILED:', error.message);
    } else {
        console.log('SUCCESS! User ID:', data.user?.id);
    }
}

testOriginal();
