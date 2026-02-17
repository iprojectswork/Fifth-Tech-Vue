<template>
  <div class="system-home">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统管理</span>
        </div>
      </template>
      <el-empty description="请从左侧菜单选择要管理的模块" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.system-home {
  padding: 20px;
}

.card-header {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
}
</style>
