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
  background-color: #fff;
}

</style>