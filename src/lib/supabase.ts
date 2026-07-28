import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://gvykzbvvxptboqdwhcnz.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_iqY0f9Ynli0SuzwW0a_9FA_EADmCHSF';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

