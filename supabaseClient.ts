
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fiuegflibubdulagbcos.supabase.co';
const supabaseAnonKey = 'sb_publishable_QIzEqXEsr0h6HyZS6PcMDQ_wkV4g3mP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
