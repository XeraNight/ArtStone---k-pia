/// &lt;reference types="https://deno.land/x/deno/cli/tsc/dts/lib.deno.ns.d.ts" />
/// &lt;reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get the authorization header from the request
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('No authorization header')
        }

        // Create a Supabase client with the user's JWT
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: authHeader },
                },
            }
        )

        // Verify the user is an admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            throw new Error('Not authenticated')
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            throw new Error('Only admins can create users')
        }

        // Get the request body
        const { email, password, full_name, role, region_id } = await req.json()

        if (!email || !password || !full_name || !role) {
            throw new Error('Missing required fields')
        }

        // Create a Supabase Admin client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Create the user using Admin API (doesn't affect current session)
        const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name,
                role,
                region_id: region_id || null,
            },
        })

        if (signUpError) {
            throw signUpError
        }

        // Create the profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: newUser.user.id,
                email: email,
                full_name: full_name,
                role: role,
                region_id: region_id || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })

        if (profileError) {
            console.error('Profile creation error:', profileError)
            // Don't throw - user was created successfully
        }

        return new Response(
            JSON.stringify({
                success: true,
                user: {
                    id: newUser.user.id,
                    email: newUser.user.email,
                },
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
        return new Response(
            JSON.stringify({
                error: errorMessage,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
