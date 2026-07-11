import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, hasSupabaseConfig } from '../lib/supabase'

function cleanText(value) {
  return String(value || '').trim()
}

function makeDefaultName(userId = '') {
  const suffix = userId ? userId.slice(0, 6) : Math.floor(1000 + Math.random() * 9000)
  return `山野旅人${suffix}`
}

function normalizeEmail(email) {
  return cleanText(email).toLowerCase()
}

function validateEmailPassword(email, password) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !password) throw new Error('邮箱和密码不能为空')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('请输入有效的邮箱地址')
  if (password.length < 6) throw new Error('密码至少需要 6 位')
  return normalizedEmail
}

function isMissingTableError(error) {
  return error?.code === '42P01' || /relation .* does not exist/i.test(error?.message || '')
}

function isDuplicateEmailError(error) {
  const message = error?.message?.toLowerCase() || ''
  return message.includes('already') || message.includes('registered') || message.includes('exists')
}

function normalizeProfile(profile, authUser) {
  if (!profile && !authUser) return null
  return {
    id: profile?.id || authUser?.id || '',
    email: authUser?.email || '',
    username: profile?.username || authUser?.user_metadata?.username || makeDefaultName(authUser?.id),
    avatar: profile?.avatar || '',
    gender: profile?.gender || authUser?.user_metadata?.gender || '',
    birthday: profile?.birthday || authUser?.user_metadata?.birthday || '',
    level: profile?.level ?? 1,
    experience: profile?.experience ?? 0,
    travelerGender: profile?.traveler_gender || authUser?.user_metadata?.travelerGender || 'female',
    travelerIdentity: profile?.traveler_identity || authUser?.user_metadata?.travelerIdentity || 'forest',
    isAnonymous: authUser?.is_anonymous ?? !authUser?.email,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const session = ref(null)
  const profile = ref(null)
  const ready = ref(false)
  const authError = ref('')

  const isAnonymous = computed(() => Boolean(user.value?.isAnonymous))
  const isLoggedIn = computed(() => user.value !== null)
  const currentUserId = computed(() => user.value?.id || '')

  function setAuthState(authUser, authSession, profileRow = null) {
    session.value = authSession || null
    profile.value = normalizeProfile(profileRow, authUser)
    user.value = profile.value
    return user.value
  }

  async function saveProfile(authUser, options = {}) {
    if (!hasSupabaseConfig) return null
    if (!authUser) throw new Error('用户身份创建失败，请稍后再试')

    const payload = {
      id: authUser.id,
      username: cleanText(options.username) || authUser.user_metadata?.username || makeDefaultName(authUser.id),
      gender: cleanText(options.gender || authUser.user_metadata?.gender),
      birthday: cleanText(options.birthday || authUser.user_metadata?.birthday),
      traveler_gender: options.travelerGender || authUser.user_metadata?.travelerGender || 'female',
      traveler_identity: options.travelerIdentity || authUser.user_metadata?.travelerIdentity || 'forest',
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single()

    if (error) throw new Error('用户档案保存失败，请确认 Supabase 数据表和 RLS 已配置完成')
    return data
  }

  async function ensureCharacter(authUser, profileRow = null) {
    if (!hasSupabaseConfig || !authUser) return null

    const payload = {
      user_id: authUser.id,
      character_type: profileRow?.traveler_identity || authUser.user_metadata?.travelerIdentity || 'forest',
      equipment: [],
      level: profileRow?.level || 1,
    }

    const { error } = await supabase
      .from('characters')
      .upsert(payload, { onConflict: 'user_id' })

    if (error) {
      // 表不存在或其他错误，静默跳过，不阻断登录
      console.warn('characters 表写入跳过:', error.message)
      return null
    }
    return payload
  }

  async function loadProfile(authUser, authSession = session.value) {
    if (!hasSupabaseConfig || !authUser) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (error) throw new Error('用户资料加载失败，请检查网络后重试')

    const profileRow = data || await saveProfile(authUser)
    await ensureCharacter(authUser, profileRow)
    return setAuthState(authUser, authSession, profileRow)
  }

  async function initAuth() {
    authError.value = ''
    ready.value = false

    try {
      if (!hasSupabaseConfig) {
        user.value = null
        profile.value = null
        session.value = null
        return null
      }

      const { data, error } = await supabase.auth.getSession()
      if (error) throw new Error('登录状态恢复失败，请检查网络后重试')

      if (data?.session?.user) return await loadProfile(data.session.user, data.session)

      user.value = null
      profile.value = null
      session.value = null
      return null
    } catch (error) {
      authError.value = error.message || '认证初始化失败，请刷新页面重试'
      throw error
    } finally {
      ready.value = true
    }
  }

  async function anonymousLogin() {
    authError.value = ''

    if (!hasSupabaseConfig) {
      const localId = `local-${Date.now()}`
      const localProfile = {
        id: localId,
        username: makeDefaultName(localId),
        gender: '',
        birthday: '',
        travelerGender: 'female',
        travelerIdentity: 'forest',
        level: 1,
        experience: 0,
        isAnonymous: true,
      }
      user.value = localProfile
      profile.value = localProfile
      session.value = null
      return user.value
    }

    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw new Error('游客访问失败，请确认 Supabase 已开启 Anonymous Sign-ins')

    const profileRow = await saveProfile(data.user)
    await ensureCharacter(data.user, profileRow)
    return setAuthState(data.user, data.session, profileRow)
  }

  async function linkEmailAccount(email, password) {
    authError.value = ''
    const normalizedEmail = validateEmailPassword(email, password)

    if (!hasSupabaseConfig) {
      if (!user.value) await anonymousLogin()
      user.value = { ...user.value, email: normalizedEmail, isAnonymous: false }
      profile.value = user.value
      return user.value
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw new Error('登录状态读取失败，请刷新后重试')

    let currentSession = sessionData?.session
    if (!currentSession?.user) {
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) throw new Error('游客访问失败，请确认 Supabase 已开启 Anonymous Sign-ins')
      currentSession = data.session
    }

    const { data, error } = await supabase.auth.updateUser({
      email: normalizedEmail,
      password,
    })

    if (error) {
      if (isDuplicateEmailError(error)) throw new Error('这个邮箱已经绑定过账号，请换一个邮箱或直接登录')
      throw new Error(error.message || '邮箱绑定失败，请稍后再试')
    }

    const { data: refreshed } = await supabase.auth.getSession()
    const authUser = refreshed?.session?.user || data?.user || currentSession.user
    await loadProfile(authUser, refreshed?.session || currentSession)
    return user.value
  }

  async function register(email, password, options = {}) {
    if (isAnonymous.value) return linkEmailAccount(email, password)

    const normalizedEmail = validateEmailPassword(email, password)

    if (!hasSupabaseConfig) {
      const localId = `local-${Date.now()}`
      const localProfile = {
        id: localId,
        email: normalizedEmail,
        username: cleanText(options.username) || makeDefaultName(localId),
        gender: cleanText(options.gender),
        birthday: cleanText(options.birthday),
        travelerGender: options.travelerGender || 'female',
        travelerIdentity: options.travelerIdentity || 'forest',
        level: 1,
        experience: 0,
        isAnonymous: false,
      }
      user.value = localProfile
      profile.value = localProfile
      return user.value
    }

    const metadata = {
      username: cleanText(options.username) || makeDefaultName(),
      gender: cleanText(options.gender),
      birthday: cleanText(options.birthday),
      travelerGender: options.travelerGender || 'female',
      travelerIdentity: options.travelerIdentity || 'forest',
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { data: metadata },
    })

    if (error) {
      if (isDuplicateEmailError(error)) throw new Error('这个邮箱已经注册过啦，请直接登录')
      throw new Error(error.message || '注册失败，请稍后再试')
    }

    if (!data?.user) throw new Error('注册失败，请稍后再试')
    if (!data.session) throw new Error('注册成功，请先到邮箱确认后再登录；答辩演示建议关闭邮箱确认。')

    const profileRow = await saveProfile(data.user, metadata)
    await ensureCharacter(data.user, profileRow)
    return setAuthState(data.user, data.session, profileRow)
  }

  async function login(email, password) {
    authError.value = ''
    const normalizedEmail = validateEmailPassword(email, password)

    if (!hasSupabaseConfig) {
      user.value = {
        id: 'local-user',
        email: normalizedEmail,
        username: '山野旅人',
        gender: '',
        birthday: '',
        travelerGender: 'female',
        travelerIdentity: 'forest',
        level: 1,
        experience: 0,
        isAnonymous: false,
      }
      profile.value = user.value
      return user.value
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) throw new Error('邮箱或密码错误，请再检查一下')
    return loadProfile(data.user, data.session)
  }

  async function logout() {
    if (hasSupabaseConfig) await supabase.auth.signOut()
    user.value = null
    profile.value = null
    session.value = null
  }

  async function init() {
    return initAuth()
  }

  return {
    user,
    session,
    isAnonymous,
    profile,
    ready,
    authError,
    isLoggedIn,
    currentUserId,
    initAuth,
    anonymousLogin,
    linkEmailAccount,
    register,
    login,
    logout,
    init,
    loadProfile,
  }
})