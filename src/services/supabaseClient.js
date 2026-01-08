import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ltmlfuajigwohpohxvof.supabase.co"
const supabaseAnonKey = "sb_publishable_q0aIOQPfnfoxDfPKtgu9Lg_Nl3mdEmb"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)