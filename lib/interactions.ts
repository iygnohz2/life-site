import {
  getSupabase,
  type Interaction,
  type InteractionKind,
  type InteractionTargetType,
  type Profile,
} from './supabase'

// ---------- 邀请口令 ----------

export async function verifyInviteCode(code: string): Promise<boolean> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('verify_invite_code', { code })
  if (error) throw error
  return data === true
}

// ---------- 登录 / 会话 ----------

export async function sendOtp(email: string) {
  return getSupabase().auth.signInWithOtp({ email })
}

export async function verifyOtp(email: string, token: string) {
  return getSupabase().auth.verifyOtp({ email, token, type: 'email' })
}

export async function signOut() {
  return getSupabase().auth.signOut()
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await getSupabase().auth.getUser()
  return data.user?.id ?? null
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = getSupabase()
  const { data: session } = await supabase.auth.getUser()
  const userId = session.user?.id
  if (!userId) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return (data as Profile | null) ?? null
}

export async function setProfileName(name: string) {
  const supabase = getSupabase()
  const { data: session } = await supabase.auth.getUser()
  const userId = session.user?.id
  if (!userId) throw new Error('未登录')
  const { error } = await supabase.from('profiles').upsert({ id: userId, name })
  if (error) throw error
}

/** 站主（is_owner）的 user id 集合，用于前端标记「站主回复」 */
export async function getOwnerIds(): Promise<string[]> {
  const supabase = getSupabase()
  const { data } = await supabase.from('profiles').select('id').eq('is_owner', true)
  return ((data ?? []) as { id: string }[]).map((o) => o.id)
}

// ---------- 互动 ----------

export async function getInteractions(
  targetType: InteractionTargetType,
  targetId: string
): Promise<Interaction[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Interaction[]
}

export async function addInteraction(input: {
  target_type: InteractionTargetType
  target_id: string
  kind: InteractionKind
  content?: string
  reaction?: string
  reply_to?: number | null
  owner_name?: string | null
}): Promise<Interaction> {
  const supabase = getSupabase()
  const { data: session } = await supabase.auth.getUser()
  const userId = session.user?.id
  if (!userId) throw new Error('未登录')
  const { data, error } = await supabase
    .from('interactions')
    .insert({
      owner_id: userId,
      owner_name: input.owner_name ?? null,
      target_type: input.target_type,
      target_id: input.target_id,
      kind: input.kind,
      content: input.content ?? null,
      reaction: input.reaction ?? null,
      reply_to: input.reply_to ?? null,
    })
    .select()
  if (error) throw error
  return data?.[0] as Interaction
}

export async function deleteInteraction(id: number) {
  const supabase = getSupabase()
  const { error } = await supabase.from('interactions').delete().eq('id', id)
  if (error) throw error
}

/** 站主视角：列出所有发过私信的访客（target_id 去重，带昵称快照） */
export async function listInboxPartners(): Promise<{ id: string; name: string | null }[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('interactions')
    .select('target_id, owner_id, owner_name')
    .eq('target_type', 'inbox')
    .order('created_at', { ascending: true })
  if (error) throw error
  const map = new Map<string, string | null>()
  for (const m of (data ?? []) as {
    target_id: string
    owner_id: string
    owner_name: string | null
  }[]) {
    if (m.owner_id === m.target_id && !map.has(m.target_id)) {
      map.set(m.target_id, m.owner_name)
    }
  }
  return [...map.entries()].map(([id, name]) => ({ id, name }))
}
