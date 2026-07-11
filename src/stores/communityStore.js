import { defineStore } from 'pinia'
import { supabase, hasSupabaseConfig } from '../lib/supabase'
import { useAuthStore } from './authStore'
import { useMemoryStore } from './memoryStore'
import { trails } from '../data/trails'

function toPost(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title || '',
    text: row.text || '',
    mood: row.mood || '',
    weather: row.weather || '',
    images: Array.isArray(row.images) ? row.images : [],
    template: row.template || 't1',
    trailId: row.trail_id,
    authorName: row.author_name || '山野旅人',
    authorLevel: row.author_level || 1,
    createdAt: row.created_at || new Date().toISOString(),
    comments: [],
    commentsLoaded: false,
  }
}

function toComment(row) {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    authorName: row.author_name || '山野旅人',
    text: row.text || '',
    createdAt: row.created_at || new Date().toISOString(),
  }
}

export const useCommunityStore = defineStore('community', {
  state: () => ({
    posts: [],
    loading: false,
  }),
  getters: {
    getTrailForPost: () => (post) => {
      return trails.find((t) => t.id === post.trailId) || null
    },
  },
  actions: {
    async fetchPosts() {
      if (!hasSupabaseConfig) {
        this.posts = []
        return
      }
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('community_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        if (error) {
          if (error.code === '42P01' || /relation .* does not exist/i.test(error.message || '')) {
            this.posts = []
            return
          }
          throw new Error(error.message)
        }
        this.posts = (data || []).map(toPost)
      } finally {
        this.loading = false
      }
    },

    async createPost(journal) {
      const auth = useAuthStore()
      const memory = useMemoryStore()
      const authorLevel = memory.unlockedCount

      if (!hasSupabaseConfig || !auth.currentUserId) {
        const localPost = {
          id: `post-${Date.now()}`,
          userId: auth.currentUserId,
          title: journal.title || '',
          text: journal.text || '',
          mood: journal.mood || '',
          weather: journal.weather || '',
          images: journal.images || [],
          template: journal.template || 't1',
          trailId: journal.trailId,
          authorName: auth.user?.username || '山野旅人',
          authorLevel,
          createdAt: new Date().toISOString(),
          comments: [],
          commentsLoaded: false,
        }
        this.posts.unshift(localPost)
        return localPost
      }

      const payload = {
        user_id: auth.currentUserId,
        title: journal.title || '',
        text: journal.text || '',
        mood: journal.mood || '',
        weather: journal.weather || '',
        images: journal.images || [],
        template: journal.template || 't1',
        trail_id: journal.trailId,
        author_name: auth.user?.username || '山野旅人',
        author_level: authorLevel,
      }

      const { data, error } = await supabase
        .from('community_posts')
        .insert(payload)
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      const post = toPost(data)
      this.posts.unshift(post)
      return post
    },

    async deletePost(postId) {
      const auth = useAuthStore()
      this.posts = this.posts.filter((p) => p.id !== postId)
      if (hasSupabaseConfig && auth.currentUserId && !postId.startsWith('post-')) {
        const { error } = await supabase
          .from('community_posts')
          .delete()
          .eq('id', postId)
          .eq('user_id', auth.currentUserId)
        if (error) throw new Error(error.message)
      }
    },

    async fetchComments(postId) {
      const post = this.posts.find((p) => p.id === postId)
      if (!post) return []
      if (post.commentsLoaded) return post.comments

      if (!hasSupabaseConfig) {
        post.commentsLoaded = true
        return post.comments || []
      }

      const { data, error } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
      if (error) {
        if (error.code === '42P01' || /relation .* does not exist/i.test(error.message || '')) {
          post.comments = []
          post.commentsLoaded = true
          return []
        }
        throw new Error(error.message)
      }
      post.comments = (data || []).map(toComment)
      post.commentsLoaded = true
      return post.comments
    },

    async addComment(postId, text) {
      const auth = useAuthStore()
      if (!text.trim()) throw new Error('评论不能为空')

      const comment = {
        id: `comment-${Date.now()}`,
        postId,
        userId: auth.currentUserId,
        authorName: auth.user?.username || '山野旅人',
        text: text.trim(),
        createdAt: new Date().toISOString(),
      }

      const post = this.posts.find((p) => p.id === postId)
      if (post) {
        if (!post.comments) post.comments = []
        post.comments.push(comment)
      }

      if (hasSupabaseConfig && auth.currentUserId && !postId.startsWith('post-')) {
        const { data, error } = await supabase
          .from('community_comments')
          .insert({
            post_id: postId,
            user_id: auth.currentUserId,
            author_name: auth.user?.username || '山野旅人',
            text: text.trim(),
          })
          .select('*')
          .single()
        if (error) throw new Error(error.message)
        if (post) {
          const idx = post.comments.findIndex((c) => c.id === comment.id)
          if (idx >= 0) post.comments.splice(idx, 1, toComment(data))
        }
      }
      return comment
    },

    async deleteComment(postId, commentId) {
      const auth = useAuthStore()
      const post = this.posts.find((p) => p.id === postId)
      if (post && post.comments) {
        post.comments = post.comments.filter((c) => c.id !== commentId)
      }
      if (hasSupabaseConfig && auth.currentUserId && !commentId.startsWith('comment-')) {
        const { error } = await supabase
          .from('community_comments')
          .delete()
          .eq('id', commentId)
          .eq('user_id', auth.currentUserId)
        if (error) throw new Error(error.message)
      }
    },
  },
})