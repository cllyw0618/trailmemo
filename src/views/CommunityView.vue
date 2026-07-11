<script setup>
import { ref, onMounted } from 'vue'
import { useCommunityStore } from '../stores/communityStore'
import { useAuthStore } from '../stores/authStore'
import CollageCard from '../components/CollageCard.vue'

const community = useCommunityStore()
const auth = useAuthStore()

const expandedPostId = ref('')
const commentText = ref('')
const submittingComment = ref(false)

onMounted(async () => {
  await community.fetchPosts()
})

/** 等级对应称号 */
function levelName(lv) {
  if (lv >= 16) return '地球漫游者'
  if (lv >= 12) return '远方收藏家'
  if (lv >= 8) return '雪山旅人'
  if (lv >= 5) return '峡谷探索者'
  if (lv >= 3) return '草甸行者'
  if (lv >= 1) return '初入山野'
  return '山野新手'
}

function formatDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

async function toggleComments(postId) {
  if (expandedPostId.value === postId) {
    expandedPostId.value = ''
    return
  }
  expandedPostId.value = postId
  await community.fetchComments(postId)
}

async function handleAddComment(postId) {
  const text = commentText.value.trim()
  if (!text || submittingComment.value) return
  submittingComment.value = true
  try {
    await community.addComment(postId, text)
    commentText.value = ''
  } finally {
    submittingComment.value = false
  }
}

async function handleDeleteComment(postId, commentId) {
  await community.deleteComment(postId, commentId)
}

async function handleDeletePost(postId) {
  await community.deletePost(postId)
}
</script>

<template>
  <main class="community-page">
    <header class="community-header">
      <h1>山野营地</h1>
      <p>旅人们分享的山野记忆</p>
    </header>

    <!-- 加载中 -->
    <div v-if="community.loading" class="loading-state">
      <span class="loading-dot"></span>
      <span class="loading-dot"></span>
      <span class="loading-dot"></span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!community.posts.length" class="empty-state">
      <span class="empty-emoji">🏕️</span>
      <p>营地还没有人分享记忆</p>
      <p>去记录你的山野旅程，成为第一个分享者吧</p>
    </div>

    <!-- 帖子列表 -->
    <div v-else class="post-list">
      <article
        v-for="post in community.posts"
        :key="post.id"
        class="post-card"
      >
        <!-- 作者信息栏 -->
        <div class="post-author">
          <div class="author-avatar">
            <span>{{ post.authorName.slice(0, 1) }}</span>
          </div>
          <div class="author-info">
            <span class="author-name">{{ post.authorName }}</span>
            <span class="author-level">{{ levelName(post.authorLevel) }}</span>
          </div>
          <span class="post-time">{{ formatDate(post.createdAt) }}</span>
          <button
            v-if="auth.currentUserId === post.userId"
            class="post-delete-btn"
            type="button"
            @click="handleDeletePost(post.id)"
            title="删除分享"
          >×</button>
        </div>

        <!-- 回忆卡 -->
        <CollageCard :journal="post" :trail="community.getTrailForPost(post)" />

        <!-- 操作栏 -->
        <div class="post-actions">
          <button
            class="comment-toggle-btn"
            type="button"
            :class="{ active: expandedPostId === post.id }"
            @click="toggleComments(post.id)"
          >
            💬 评论{{ (post.comments || []).length ? ` (${post.comments.length})` : '' }}
          </button>
        </div>

        <!-- 评论区 -->
        <div v-if="expandedPostId === post.id" class="comment-section">
          <div v-if="(post.comments || []).length" class="comment-list">
            <div
              v-for="c in post.comments"
              :key="c.id"
              class="comment-item"
            >
              <span class="comment-author">{{ c.authorName }}</span>
              <p class="comment-text">{{ c.text }}</p>
              <div class="comment-footer">
                <span class="comment-time">{{ formatDate(c.createdAt) }}</span>
                <button
                  v-if="auth.currentUserId === c.userId"
                  class="comment-delete-btn"
                  type="button"
                  @click="handleDeleteComment(post.id, c.id)"
                >删除</button>
              </div>
            </div>
          </div>
          <div v-else class="comment-empty">还没有评论，说点什么吧</div>

          <!-- 评论输入 -->
          <div class="comment-input-row">
            <input
              v-model="commentText"
              class="comment-input"
              type="text"
              placeholder="写下你的评论..."
              maxlength="200"
              @keyup.enter="handleAddComment(post.id)"
            />
            <button
              class="comment-send-btn"
              type="button"
              :disabled="!commentText.trim() || submittingComment"
              @click="handleAddComment(post.id)"
            >发送</button>
          </div>
        </div>
      </article>
    </div>
  </main>
</template>

<style scoped>
/* ===== 页面容器 ===== */
.community-page {
  padding: clamp(20px, 4vw, 40px) clamp(16px, 4vw, 40px) 100px;
  max-width: 720px;
  margin: 0 auto;
  background:
    radial-gradient(ellipse at 20% 10%, rgba(167, 243, 208, 0.12), transparent 35%),
    radial-gradient(ellipse at 70% 30%, rgba(196, 181, 253, 0.1), transparent 30%),
    linear-gradient(175deg, #f5faf8 0%, #f0f4ff 100%);
  min-height: 100vh;
}

/* ===== 头部 ===== */
.community-header {
  text-align: center;
  margin-bottom: 28px;
}
.community-header h1 {
  margin: 0 0 4px;
  color: #276749;
  font-size: 1.5rem;
  font-weight: 950;
}
.community-header p {
  margin: 0;
  color: #94a3b8;
  font-size: 0.82rem;
  font-weight: 800;
}

/* ===== 加载状态 ===== */
.loading-state {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 60px 0;
}
.loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6ee7b7;
  animation: dotPulse 1.4s ease-in-out infinite;
}
.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes dotPulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

/* ===== 空状态 ===== */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  border: 2px dashed rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  color: #94a3b8;
}
.empty-emoji {
  font-size: 2.8rem;
  display: block;
  margin-bottom: 12px;
}
.empty-state p {
  margin: 0 0 4px;
  font-size: 0.9rem;
  font-weight: 800;
}
.empty-state p + p {
  font-size: 0.78rem;
  font-weight: 700;
}

/* ===== 帖子列表 ===== */
.post-list {
  display: grid;
  gap: 24px;
}

/* ===== 帖子卡片 ===== */
.post-card {
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
}

/* ===== 作者信息栏 ===== */
.post-author {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.author-avatar {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #a7f3d0, #bae6fd);
  color: #276749;
  font-size: 0.9rem;
  font-weight: 950;
  flex-shrink: 0;
}
.author-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}
.author-name {
  color: #334155;
  font-size: 0.85rem;
  font-weight: 950;
}
.author-level {
  color: #6ee7b7;
  font-size: 0.68rem;
  font-weight: 800;
}
.post-time {
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 800;
  flex-shrink: 0;
}
.post-delete-btn {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 50%;
  color: #94a3b8;
  font-size: 1rem;
  cursor: pointer;
  background: transparent;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.post-delete-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

/* ===== 操作栏 ===== */
.post-actions {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}
.comment-toggle-btn {
  padding: 6px 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.2s;
}
.comment-toggle-btn:hover,
.comment-toggle-btn.active {
  color: #276749;
  border-color: rgba(110, 231, 183, 0.4);
  background: rgba(167, 243, 208, 0.15);
}

/* ===== 评论区 ===== */
.comment-section {
  margin-top: 12px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
}
.comment-list {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}
.comment-item {
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
}
.comment-author {
  color: #276749;
  font-size: 0.72rem;
  font-weight: 950;
}
.comment-text {
  margin: 4px 0;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 800;
  line-height: 1.5;
}
.comment-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}
.comment-time {
  color: #94a3b8;
  font-size: 0.65rem;
  font-weight: 800;
}
.comment-delete-btn {
  padding: 1px 6px;
  border: 0;
  border-radius: 999px;
  color: #94a3b8;
  font-size: 0.62rem;
  font-weight: 800;
  cursor: pointer;
  background: transparent;
}
.comment-delete-btn:hover { color: #ef4444; }
.comment-empty {
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 800;
  text-align: center;
  padding: 8px 0;
  margin-bottom: 12px;
}

/* ===== 评论输入 ===== */
.comment-input-row {
  display: flex;
  gap: 8px;
}
.comment-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 800;
  outline: none;
  background: rgba(255, 255, 255, 0.7);
  transition: border-color 0.2s;
}
.comment-input:focus {
  border-color: rgba(110, 231, 183, 0.5);
}
.comment-input::placeholder {
  color: #cbd5e1;
}
.comment-send-btn {
  padding: 8px 16px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 950;
  cursor: pointer;
  background: linear-gradient(135deg, #6ee7b7, #34d399);
  transition: opacity 0.2s;
  flex-shrink: 0;
}
.comment-send-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

/* ===== 响应式 ===== */
@media (max-width: 520px) {
  .post-card {
    padding: 16px;
  }
}
</style>