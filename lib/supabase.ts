import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export type InteractionKind = 'comment' | 'reaction' | 'message'
export type InteractionTargetType = 'diary' | 'photo' | 'place' | 'inbox'

export type Interaction = {
  id: number
  owner_id: string
  owner_name: string | null
  target_type: InteractionTargetType
  target_id: string
  kind: InteractionKind
  content: string | null
  reaction: string | null
  reply_to: number | null
  created_at: string
}

export type Profile = {
  id: string
  name: string | null
  is_owner: boolean
  created_at: string
}

let _client: SupabaseClient | null = null

/**
 * 懒加载单例：只在浏览器环境真正被调用时才创建，
 * 避免服务端渲染（无 localStorage）时初始化失败。
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('缺少 Supabase 环境变量（NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY）')
  }
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }
  return _client
}
