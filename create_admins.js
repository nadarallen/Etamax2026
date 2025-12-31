const { createClient } = require('@supabase/supabase-js');

const url = 'https://gcaohjowfxcrhehqglwv.supabase.co';
const key = 'sb_publishable_hR5FeWrt2obk419MoyAezQ_29uzmaaU';

const supabase = createClient(url, key);

async function registerAdmins() {
    console.log("Creating new admin accounts...");

    // 1. Register Super Admin
    const { data: d1, error: e1 } = await supabase.auth.signUp({
        email: 'superadmin@etamax.com',
        password: 'password123',
        options: {
            data: { name: 'Super Admin New' }
        }
    });

    if (e1) console.log('Super Admin Create:', e1.message);
    else console.log('Super Admin Created:', d1.user?.id);

    // 2. Register Club Admin
    const { data: d2, error: e2 } = await supabase.auth.signUp({
        email: 'clubadmin@etamax.com',
        password: 'password123',
        options: {
            data: { name: 'Club Admin New' }
        }
    });

    if (e2) console.log('Club Admin Create:', e2.message);
    else console.log('Club Admin Created:', d2.user?.id);
}

registerAdmins();
