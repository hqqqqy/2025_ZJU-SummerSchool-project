<script setup lang="ts">
import { RouterView } from 'vue-router';
import { onMounted } from "vue";
import { ElMessage } from "element-plus";

async function initApp() {
  console.log('App initialized');
}

onMounted(() => initApp()
    .catch(e => {
      ElMessage.error('Fail to initialize app: ' + e.message);
      throw e;
    }));

</script>

<template>
  <div id="root">
    <RouterView/>
  </div>
</template>

<style>

html, body, #app{
  padding: 0;
  margin: 0;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #1d2129;
  line-height: 1.5;
}

* {
  box-sizing: border-box;
}

/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Element Plus 主题定制 */
:root {
  --el-color-primary: #E6162D;
  --el-color-primary-light-3: #ea4459;
  --el-color-primary-light-5: #ee6c7f;
  --el-color-primary-light-7: #f294a5;
  --el-color-primary-light-8: #f5a9b8;
  --el-color-primary-light-9: #f9bccb;
  --el-color-primary-dark-2: #b8111f;
}

/* 卡片阴影统一 */
.card-shadow {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
}

.card-shadow:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* 文本选择颜色 */
::selection {
  background-color: rgba(230, 22, 45, 0.3);
  color: #1d2129;
}

</style>