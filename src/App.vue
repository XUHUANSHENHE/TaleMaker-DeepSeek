<template>
  <div id="app">
    <UserAgreement :show-agreement-modal="showAgreementModal" @accept="acceptAgreement" @reject="rejectAgreement" />
    <div :class="{ 'blurred': showAgreementModal }">
      <MobilePage v-if="isPortrait" />
      <TaleMaker v-else msg="TaleMaker" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import TaleMaker from './components/TaleMaker.vue';
import MobilePage from './components/MobilePage.vue';
import UserAgreement from './components/UserAgreement.vue';

const isPortrait = ref(false);
const showAgreementModal = ref(false);

const checkOrientation = () => {
  isPortrait.value = window.innerHeight > window.innerWidth;
};

const checkAgreementStatus = () => {
  const savedAgreement = localStorage.getItem('novelGeneratorAgreement');
  if (savedAgreement === 'accepted') {
    showAgreementModal.value = false;
  } else {
    showAgreementModal.value = true;
    document.body.style.overflow = 'hidden';
  }
};

const acceptAgreement = () => {
  showAgreementModal.value = false;
  localStorage.setItem('novelGeneratorAgreement', 'accepted');
  document.body.style.overflow = '';
  document.body.style.overflowX = '';
  document.body.style.overflowY = '';
};

const rejectAgreement = () => {
  alert('要使用DeepSeek小说生成框架，您必须同意用户协议。');
};

onMounted(() => {
  checkOrientation();
  checkAgreementStatus();
  window.addEventListener('resize', checkOrientation);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkOrientation);
});
</script>

<style>
.blurred {
  filter: blur(5px);
  pointer-events: none;
  user-select: none;
}
</style>