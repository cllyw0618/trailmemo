import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, hasSupabaseConfig } from '../lib/supabase'

function makeDefaultName() {
  return `山野旅人${Math.floor(100 + Math.random() * 900)}`
}

function cleanText(value) {
  return String(value || '').trim()
}

function normalizeEmail(email) {
  return cleanText(email).toLowerCase()
}

function assertAuthInput(email, password) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !password) throw new Error('邮箱和密码不能为空')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('请输入有效的邮箱地址')
  if (password.length < 6) throw new Error('密码长度至少 6 位')
  return normalizedEmail
}

function buildProfileDraft(options = {}) {
  return {
    username: cleanText(options.username) || makeDefaultName(),
    gender: cleanText(options.gender),
    birthday: cleanText(options.birthday),
    traveler_gender: options.travelerGender || options.traveler_gender || 'female',
    traveler_identity: options.travelerIdentity || options.traveler_identity || 'forest',
    updated_at: new Date().toISOString(),
  }
}

function normalizeProfile(profile, authUser) {
  if (!profile && !authUser) return null
  return {
    id: profile?.id || authUser?.id,
    email: authUser?.email || '',
    username: profile?.username || authUser?.user_metadata?.username || makeDefaultName(),
    gender: profile?.gender || authUser?.user_metadata?.gender || '',
    birthday: profile?.birthday || authUser?.user_metadata?.birthday || '',
    travelerGender: profile?.traveler_gender || authUser?.user_metadata?.travelerGender || 'female',
    travelerIdentity: profile?.traveler_identity || authUser?.user_metadata?.travelerIdentity || 'forest',
    isAnonymous: false,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const ready = ref(false)

  const isLoggedIn = computed(() => user.value !== null)
  const currentUserId = computed(() => user.value?.id || '')

  async function saveProfile(authUser, options = {}) {
    if (!authUser) throw new Error('账号创建失败，请稍后再试')

    const profilePayload = {
      id: authUser.id,
      ...buildProfileDraft(options),
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })
      .select('*')
      .single()

    if (error) {
      throw new Error('旅人资料保存失败。请确认 Supabase 已运行建表 SQL，并关闭邮箱确认。')
    }

    user.value = normalizeProfile(profile, authUser)
    return user.value
  }

  async function loadProfile(authUser) {
    if (!hasSupabaseConfig || !authUser) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (error) throw new Error(error.message)

    if (!data) {
      return saveProfile(authUser, {
        username: authUser.user_metadata?.username || makeDefaultName(),
        gender: authUser.user_metadata?.gender || '',
        birthday: authUser.user_metadata?.birthday || '',
        travelerGender: authUser.user_metadata?.travelerGender || 'female',
        travelerIdentity: authUser.user_metadata?.travelerIdentity || 'forest',
      })
    }

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

  async function register(email, password, username, gender, birthday, travelerGender = 'female', travelerIdentity = 'forest') {
    const normalizedEmail = assertAuthInput(email, password)
    const profileDraft = buildProfileDraft({ username, gender, birthday, travelerGender, travelerIdentity })

    if (!hasSupabaseConfig) {
      user.value = {
        id: `local-${Date.now()}`,
        email: normalizedEmail,
        username: profileDraft.username,
        gender: profileDraft.gender,
        birthday: profileDraft.birthday,
        travelerGender: profileDraft.traveler_gender,
        travelerIdentity: profileDraft.traveler_identity,
        isAnonymous: false,
      }
      return user.value
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          username: profileDraft.username,
          gender: profileDraft.gender,
          birthday: profileDraft.birthday,
          travelerGender: profileDraft.traveler_gender,
          travelerIdentity: profileDraft.traveler_identity,
        },
      },
    })

    if (error) {
      const message = error.message?.toLowerCase() || ''
      if (message.includes('already') || message.includes('registered')) throw new Error('这个邮箱已经注册过啦，请直接登录')
      throw new Error(error.message || '注册失败，请稍后再试')
    }

    if (!data?.user) throw new Error('注册失败，请稍后再试')
    if (!data.session) throw new Error('注册成功，请先到邮箱确认后再登录；如果用于答辩演示，建议在 Supabase 关闭邮箱确认。')

    return saveProfile(data.user, profileDraft)
  }

  async function login(email, password) {
    const normalizedEmail = assertAuthInput(email, password)

    if (!hasSupabaseConfig) {
      user.value = {
        id: 'local-user',
        email: normalizedEmail,
        username: '山野旅人',
        gender: '',
        birthday: '',
        travelerGender: 'female',
        travelerIdentity: 'forest',
        isAnonymous: false,
      }
      return user.value
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) throw new Error('邮箱或密码错误，请再检查一下')
    return loadProfile(data.user)
  }

  async function logout() {
    if (hasSupabaseConfig) await supabase.auth.signOut()
    user.value = null
  }

  return {
    user,
    ready,
    isLoggedIn,
    currentUserId,
    register,
    login,
    logout,
    init,
    loadProfile,
  }
})
