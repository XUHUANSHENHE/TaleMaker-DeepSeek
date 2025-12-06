<template>
  <div v-if="showAgreementModal" class="agreement-modal-overlay">
    <div class="agreement-modal">
      <div class="modal-header">
        <h2>📜 DeepSeek 小说生成框架 用户协议与免责声明</h2>
        <div class="scroll-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: scrollProgress + '%' }"></div>
          </div>
          <span class="progress-text">已阅读 {{ Math.round(scrollProgress) }}%</span>
        </div>
      </div>

      <div class="modal-content" @scroll="onModalScroll" ref="modalContent">
        <div class="agreement-content">
          <div class="important-note">
            <p>
              <strong>重要提示：</strong>在访问或使用本网站提供的服务前，请您务必仔细阅读并充分理解本协议各项内容。一旦您开始使用本服务，即表示您已完全同意并接受本协议的所有条款。如果您不同意本协议的任何内容，请立即停止使用本服务。
            </p>
          </div>

          <section class="agreement-section">
            <h3>一、 服务性质</h3>
            <p><strong>1.1</strong> 本站是一个技术工具平台，为用户提供一个便捷的前端界面，以帮助用户通过其自行获取的、合法的第三方人工智能API密钥生成文本内容。</p>
            <p><strong>1.2</strong> 本站不提供任何人工智能大模型服务，不拥有、不运营也不代表任何AI API提供商。所有计算、内容生成和最终输出均由用户选择的第三方AI服务提供商完成。</p>
            <p><strong>1.3</strong> 本站不存储、不缓存、不备份用户通过本工具生成的任何文本内容。所有生成内容仅在您的浏览器会话中临时显示，由您自行负责保存或处理。</p>
          </section>

          <section class="agreement-section">
            <h3>二、 用户义务与行为规范</h3>
            <p><strong>2.1
                API密钥责任：</strong>您确认并保证，您在本站使用的所有API密钥均为您本人合法获取，并已遵守相关API提供商的服务条款。您独自承担因您的API密钥使用引发的一切后果。
            </p>

            <p><strong>2.2 内容合法性：</strong>您承诺使用本服务生成的所有内容必须遵守您所在国家/地区以及服务涉及国家/地区的所有适用法律法规。您严格禁止使用本服务生成以下内容，包括但不限于：</p>
            <ul class="prohibited-list">
              <li><strong>危害国家安全：</strong>煽动分裂国家、破坏国家统一、泄露国家秘密、颠覆国家政权、推翻社会主义制度的内容。</li>
              <li><strong>恐怖主义与暴力：</strong>宣扬恐怖主义、极端主义，煽动民族仇恨、民族歧视，渲染暴力、血腥的内容。</li>
              <li><strong>淫秽色情：</strong>制作、传播淫秽、色情，特别是涉及未成年人的色情内容。</li>
              <li><strong>欺诈与虚假信息：</strong>制作、传播虚假信息，扰乱经济秩序和社会秩序，侵犯他人知识产权、商业秘密的内容。</li>
              <li><strong>侮辱诽谤：</strong>侮辱或者诽谤他人，侵害他人名誉、隐私、肖像权等合法权益的内容。</li>
              <li><strong>其他违法信息：</strong>法律、行政法规禁止的其他任何内容。</li>
            </ul>

            <p><strong>2.3
                禁止规避审查：</strong>您明确承诺，不得以任何形式利用本工具旨在规避或破坏任何第三方AI服务提供商内置的内容安全策略、审查机制或使用限制。
            </p>
          </section>

          <section class="agreement-section">
            <h3>三、 免责声明</h3>
            <p><strong>3.1
                内容责任豁免：</strong>由于本站不参与、不控制、不干预具体的文本生成过程，且不存储任何生成内容，因此本站对用户生成的任何内容的合法性、准确性、完整性、适用性及产生的任何直接或间接后果，不承担任何法律责任。
            </p>
            <p><strong>3.2 服务稳定性：</strong>本站尽力为您提供稳定的技术服务，但对于服务的中断、终止或出现的缺陷，本站不承担责任。技术服务依赖于第三方API，其稳定性与可用性不在本站控制范围内。</p>
            <p><strong>3.3 间接损失：</strong>在任何情况下，本站均不对任何间接性、后果性、惩罚性、偶然性的损害承担责任。</p>
          </section>

          <section class="agreement-section">
            <h3>四、 侵权投诉与用户违规处理</h3>
            <p><strong>4.1</strong> 如您认为本网站用户生成的内容侵犯了您的合法权益，请立即通过本站公布的联系方式联系我们，并提供相关证据。我们将在核实后及时处理。</p>
            <p><strong>4.2</strong> 如果我们自行发现或根据第三方投诉/通知，认定用户违反了本协议的规定，我们有权立即终止向该用户提供服务，且不承担任何责任。</p>
          </section>

          <section class="agreement-section">
            <h3>五、 其他</h3>
            <p><strong>5.1</strong> 本站保留随时修改本协议条款的权利。修改后的协议将在本站公布后立即生效。您继续使用本服务即视为接受修改后的协议。</p>
            <p><strong>5.2</strong>
              本协议的订立、执行和解释及争议的解决均应适用中华人民共和国法律。如双方就本协议内容或其执行发生任何争议，应首先友好协商解决；协商不成时，双方同意将争议提交至本站运营方所在地有管辖权的人民法院诉讼解决。</p>
          </section>

          <div class="agreement-footer">
            <p class="effective-date">最后更新日期：2025年12月</p>
            <p class="contact-info">如有疑问，请联系：不知道</p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="footer-note">
          <p><strong>注意：</strong>请完整阅读并理解以上所有条款内容。滚动到底部后"同意并继续"按钮将可用。</p>
          <button v-if="isScrollingModal" @click="scrollToBottom" class="btn-scroll-bottom">
            📜 快速滚动到底部
          </button>
        </div>
        <div class="footer-actions">
          <button @click="handleReject" class="btn-reject">
            拒绝并离开
          </button>
          <button @click="handleAccept" :disabled="isScrollingModal"
            :class="{ 'btn-agree': true, 'disabled': isScrollingModal }">
            {{ isScrollingModal ? '请阅读完整内容' : '✅ 同意并继续使用' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserAgreement',
  props: {
    showAgreementModal: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      scrollProgress: 0,
      isScrollingModal: true
    }
  },
  watch: {
    showAgreementModal(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          const modalContent = this.$refs.modalContent;
          if (modalContent) {
            modalContent.scrollTop = 0;
            this.scrollProgress = 0;
            this.isScrollingModal = true;
          }
        });
      }
    }
  },
  methods: {
    onModalScroll(event) {
      const modalContent = event.target;
      const scrollTop = modalContent.scrollTop;
      const scrollHeight = modalContent.scrollHeight;
      const clientHeight = modalContent.clientHeight;

      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      this.scrollProgress = Math.min(100, Math.max(0, progress));
      this.isScrollingModal = scrollHeight - scrollTop > clientHeight + 10;
    },
    handleAccept() {
      const modalContent = this.$refs.modalContent;
      if (modalContent) {
        const isAtBottom = modalContent.scrollHeight - modalContent.scrollTop <= modalContent.clientHeight + 10;

        if (!isAtBottom) {
          alert('请先阅读完整的用户协议内容至底部，然后才能同意。');
          return;
        }
      }

      this.$emit('accept');
    },
    handleReject() {
      alert('要使用DeepSeek小说生成框架，您必须同意用户协议。');
      const modalContent = this.$refs.modalContent;
      if (modalContent) {
        modalContent.scrollTop = 0;
        this.scrollProgress = 0;
        this.isScrollingModal = true;
      }
      this.$emit('reject');
    },
    scrollToBottom() {
      const modalContent = this.$refs.modalContent;
      if (modalContent) {
        modalContent.scrollTop = modalContent.scrollHeight;
        this.scrollProgress = 100;
        this.isScrollingModal = false;
      }
    }
  }
}
</script>

<style scoped>
.agreement-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.agreement-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid #3498db;
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  background: linear-gradient(135deg, #2c3e50, #4a6572);
  color: white;
  padding: 20px 30px;
  border-bottom: 3px solid #3498db;
}

.modal-header h2 {
  margin: 0 0 15px 0;
  font-size: 1.5rem;
  text-align: center;
}

.scroll-progress {
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 15px;
  border-radius: 8px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #9b59b6);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  min-width: 100px;
  text-align: right;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 25px 30px;
  background: #f8fafc;
}

.agreement-content {
  max-width: 800px;
  margin: 0 auto;
}

.important-note {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 15px 20px;
  margin-bottom: 25px;
  border-radius: 0 8px 8px 0;
}

.important-note strong {
  color: #856404;
}

.agreement-section {
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #3498db;
}

.agreement-section h3 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #eaeaea;
}

.agreement-section p {
  line-height: 1.7;
  margin-bottom: 12px;
  color: #333;
}

.prohibited-list {
  margin: 15px 0 15px 20px;
  padding: 0;
}

.prohibited-list li {
  margin-bottom: 10px;
  line-height: 1.6;
  padding-left: 5px;
}

.agreement-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #eaeaea;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.effective-date {
  font-weight: 600;
  color: #2c3e50;
}

.contact-info {
  margin-top: 5px;
}

.modal-footer {
  background: #f8f9fa;
  padding: 20px 30px;
  border-top: 2px solid #eaeaea;
}

.footer-note {
  text-align: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #e9ecef;
  border-radius: 8px;
  font-size: 14px;
}

.footer-note strong {
  color: #e74c3c;
}

.footer-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.btn-reject {
  padding: 12px 30px;
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 180px;
}

.btn-reject:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(149, 165, 166, 0.3);
}

.btn-agree {
  padding: 12px 30px;
  background: linear-gradient(135deg, #27ae60, #219a52);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 200px;
}

.btn-agree:not(.disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.btn-agree.disabled {
  background: linear-gradient(135deg, #bdc3c7, #95a5a6);
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-scroll-bottom {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.3s;
}

.btn-scroll-bottom:hover {
  background: #2980b9;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 767px) {
  .agreement-modal {
    max-height: 85vh;
    margin: 10px;
  }

  .modal-header {
    padding: 15px 20px;
  }

  .modal-header h2 {
    font-size: 1.2rem;
  }

  .modal-content {
    padding: 15px 20px;
  }

  .agreement-section {
    padding: 15px;
  }

  .footer-actions {
    flex-direction: column;
    gap: 10px;
  }

  .btn-reject,
  .btn-agree {
    width: 100%;
    min-width: auto;
  }

  .scroll-progress {
    flex-direction: column;
    gap: 10px;
  }

  .progress-text {
    text-align: center;
    min-width: auto;
  }
}
</style>