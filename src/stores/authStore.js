import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, hasSupabaseConfig } from '../lib/supabase'

function hashUsername(username) {
  let hash = 5381
  for (const char of username.trim()) {
    hash = ((hash << 5) + hash) + char.codePointAt(0)
    hash = hash >>> 0
  }
  return hash.toString(36)
}

function usernameToEmail(username) {
  return `trailmemo-${hashUsername(username)}@trailmemo.local`
}

function normalizeProfile(profile, authUser) {
  if (!profile && !authUser) return null
  return {
    id: profile?.id || authUser?.id,
    username: profile?.username || authUser?.user_metadata?.username || '',
    gender: profile?.gender || '',
    birthday: profile?.birthday || '',
    travelerGender: profile?.traveler_gender || 'male',
    travelerIdentity: profile?.traveler_identity || 'forest',
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const ready = ref(false)

  const isLoggedIn = computed(() => user.value !== null)
  const currentUserId = computed(() => user.value?.id || '')

  async function loadProfile(authUser) {
    if (!hasSupabaseConfig || !authUser) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    user.value = normalizeProfile(data, authUser)
    return user.value
  }

  async function init() {
    if (!hasSupabaseConfig) {
      ready.value = true
      return null
    }
    const { data, error } = await supabase.auth.getUser()
    if (!error && data?.user) {
      await loadProfile(data.user)
    }
    ready.value = true
    return user.value
  }

  async function register(username, password, gender, birthday, travelerGender = 'male', travelerIdentity = 'forest') {
    if (!username?.trim() || !password) throw new Error('用户名和密码不能为空')
    if (username.trim().length < 2 || username.trim().length > 20) throw new Error('用户名长度需在 2-20 个字符之间')
    if (password.length < 6) throw new Error('密码长度至少 6 个字符')
    if (!hasSupabaseConfig) {
      user.value = { id: `local-${Date.now()}`, username, gender, birthday, travelerGender, travelerIdentity }
      return user.value
    }

    const email = usernameToEmail(username)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim() } },
    })
    if (signUpError) {
      if (signUpError.message?.toLowerCase().includes('already')) throw new Error('用户名已存在，请换一个')
      throw new Error(signUpError.message || '注册失败')
    }
    if (!signUpData?.user) throw new Error('注册失败，请稍后再试')

    const profilePayload = {
      id: signUpData.user.id,
      username: username.trim(),
      gender: gender || '',
      birthday: birthday || '',
      traveler_gender: travelerGender,
      traveler_identity: travelerIdentity,
      updated_at: new Date().toISOString(),
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })
      .select('*')
      .single()

    if (profileError) {
      throw new Error('资料保存失败。请确认 Supabase 已运行建表 SQL，并关闭邮箱确认。')
    }

    user.value = normalizeProfile(profile, signUpData.user)
    return user.value
  }

  async function login(username, password) {
    if (!username?.trim() || !password) throw new Error('用户名和密码不能为空')
    if (!hasSupabaseConfig) {
      user.value = { id: 'local-user', username: username.trim(), gender: '', birthday: '', travelerGender: 'male', travelerIdentity: 'forest' }
      return user.value
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    })
    if (error) throw new Error('用户名或密码错误')
    return loadProfile(data.user)
  }

  async function logout() {
    if (hasSupabaseConfig) await supabase.auth.signOut()
    user.value = null
  }

  return { user, ready, isLoggedIn, currentUserId, register, login, logout, init, loadProfile }
})