<template>
  <div class="footer">
    <p>© {{ currentYear }} 桥梁病害检测分割系统 版权所有</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// 计算当前年份
const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
  padding: 15px 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  z-index: 10;
}
</style>