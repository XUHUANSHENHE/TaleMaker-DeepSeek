<script setup>
import StoryForge from './components/TaleMaker.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const isMobile = ref(false)

const checkIfMobile = () => {
  // 检测是否为移动设备
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isSmallScreen = window.innerWidth <= 768
  isMobile.value = isTouchDevice && isSmallScreen
}

onMounted(() => {
  checkIfMobile()
  window.addEventListener('resize', checkIfMobile)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkIfMobile)
})
</script>

<template>
  <div id="app">
    <StoryForge msg="StoryForge" />
  </div>
</template>

<style>
/* 基础样式 */
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

/* 默认在PC端隐藏滚动条 */
@media (hover: hover) and (pointer: fine) {
  /* 针对PC设备（支持悬停和精确指针） */
  html,
  body {
    overflow: auto;
  }
  
  /* 隐藏所有滚动条 - 仅PC端 */
  ::-webkit-scrollbar {
    display: none;
  }

  * {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
}

/* 移动端保持滚动条正常显示 */
@media (hover: none) and (pointer: coarse) {
  /* 针对触摸设备（移动端） */
  html,
  body {
    overflow: auto;
    -webkit-overflow-scrolling: touch; /* 启用iOS弹性滚动 */
  }
  
  /* 在移动端显示滚动条 */
  ::-webkit-scrollbar {
    display: block;
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  
  ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
}

/* 或者使用更简单的屏幕宽度检测方法 */
@media (max-width: 768px) {
  /* 移动设备 */
  html,
  body {
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  ::-webkit-scrollbar {
    display: block;
    width: 6px;
    height: 6px;
  }
}

@media (min-width: 769px) {
  /* PC设备 */
  ::-webkit-scrollbar {
    display: none;
  }
  
  * {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
</style>