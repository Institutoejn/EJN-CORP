
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lvaydsyinuvwobeqpfbd.supabase.co';
const supabaseAnonKey = 'sb_publishable_WKs0Ryhx72w5YrsNFD8muQ_jBvG05Mi';

// A chave fornecida não é um JWT padrão, mas será usada conforme solicitado.
// Para o SDK JS v2, a chave 'anon' geralmente é um JWT longo.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
