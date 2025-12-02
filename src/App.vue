<script setup>
import TaleMaker from './components/TaleMaker.vue';
</script>

<template>
  <div id="app">
    <TaleMaker msg="TaleMaker" />
  </div>
</template>

<style>
/* 隐藏整个页面的滚动条 */
html,
body {
  overflow: hidden;
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

/* 隐藏所有滚动条 */
::-webkit-scrollbar {
  display: none;
}

* {
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
}
</style>