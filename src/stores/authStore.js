import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, hasSupabaseConfig } from '../lib/supabase'

function makeDefaultName() {
  return `山野旅人${Math.floor(100 + Math.random() * 900)}`
}

function cleanText(value) {
  return String(value || '').trim()
}

function buildProfileDraft(options = {}) {
  return {
    username: cleanText(options.username) || makeDefaultName(),
    gender: cleanText(options.gender),
    birthday: cleanText(options.birthday),
    traveler_gender: options.travelerGender || options.traveler_gender || 'male',
    traveler_identity: options.travelerIdentity || options.traveler_identity || 'forest',
    updated_at: new Date().toISOString(),
  }
}

function normalizeProfile(profile, authUser) {
  if (!profile && !authUser) return null
  return {
    id: profile?.id || authUser?.id,
    username: profile?.username || authUser?.user_metadata?.username || makeDefaultName(),
    gender: profile?.gender || '',
    birthday: profile?.birthday || '',
    travelerGender: profile?.traveler_gender || 'male',
    travelerIdentity: profile?.traveler_identity || 'forest',
    isAnonymous: authUser?.is_anonymous ?? true,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const ready = ref(false)

  const isLoggedIn = computed(() => user.value !== null)
  const currentUserId = computed(() => user.value?.id || '')

  async function saveProfile(authUser, options = {}) {
    if (!authUser) throw new Error('匿名旅人创建失败，请稍后再试')

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
      throw new Error('旅人资料保存失败。请确认 Supabase 已运行建表 SQL，并开启匿名登录。')
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
        travelerGender: 'male',
        travelerIdentity: 'forest',
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

  async function startAnonymousJourney(options = {}) {
    const profileDraft = buildProfileDraft(options)

    if (!hasSupabaseConfig) {
      user.value = {
        id: `local-${Date.now()}`,
        username: profileDraft.username,
        gender: profileDraft.gender,
        birthday: profileDraft.birthday,
        travelerGender: profileDraft.traveler_gender,
        travelerIdentity: profileDraft.traveler_identity,
        isAnonymous: true,
      }
      return user.value
    }

    const { data: currentSession } = await supabase.auth.getUser()
    let authUser = currentSession?.user || null

    if (!authUser) {
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) {
        throw new Error('匿名登录失败。请在 Supabase Authentication 里开启 Anonymous sign-ins。')
      }
      authUser = data?.user
    }

    return saveProfile(authUser, profileDraft)
  }

  async function register(username, _password, gender, birthday, travelerGender = 'male', travelerIdentity = 'forest') {
    return startAnonymousJourney({ username, gender, birthday, travelerGender, travelerIdentity })
  }

  async function login() {
    return startAnonymousJourney()
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
    startAnonymousJourney,
    register,
    login,
    logout,
    init,
    loadProfile,
  }
})
