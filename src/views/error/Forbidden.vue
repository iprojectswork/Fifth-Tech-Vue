<template>
  <div class="error-page">
    <h1>403</h1>
    <p>无权限访问该页面</p>
    <el-button type="primary" @click="goHome">返回工作台</el-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { WORKBENCH_PATH } from '@/constants/nav'

const router = useRouter()

function goHome() {
  void router.push(WORKBENCH_PATH)
}
</script>

<style scoped>
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  gap: 12px;
}

h1 {
  margin: 0;
  font-size: 64px;
  color: var(--el-color-danger);
}
</style>
