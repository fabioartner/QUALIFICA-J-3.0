
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bxsrcwxvuxpscwvucrcm.supabase.co';
const supabaseAnonKey = 'sb_publishable__iDgO1ugu9BcD9iQGiesVw_ot9FTnSX';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
