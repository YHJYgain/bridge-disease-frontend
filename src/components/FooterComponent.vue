<script setup>
import { computed } from 'vue'

// 计算当前年份
const currentYear = computed(() => new Date().getFullYear())
</script>

<template>
  <div class="footer">
    <p>© {{ currentYear }} 桥梁病害检测与分割系统 版权所有</p>
  </div>
</template>

<style scoped>
.footer {
  width: 100%;
  text-align: center;
  color: rgba(0, 0, 0, 0.5);
  font-size: 14px;
  z-index: 1000;
  position: fixed;
  bottom: 0;
}
</style>