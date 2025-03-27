import { defineComponent as _defineComponent } from 'vue'
import { computed, PropType } from 'vue'

import { QrSection, AmazonReviewCTASectionContent, AmazonReviewCTASectionStyle } from '@/api/types'


export default /*@__PURE__*/_defineComponent({
  props: {
  amazonReviewCTASection: {
    type: Object as PropType<QrSection<AmazonReviewCTASectionContent, AmazonReviewCTASectionStyle>>,
    required: true
  }
},
  emits: ['onPushClick'],
  setup(__props, { expose: __expose, emit: __emit }) {
  __expose();

const emit = __emit



const { section, style } = __props.amazonReviewCTASection

const cssVars = computed(() => {
  return {
    '--background-color': style.theme === 'dark' ? '#202F3F' : '#FFFFFF',
    '--title-color': style.theme === 'dark' ? '#FFFFFF' : '#212529',
    '--subtitle-color': style.theme === 'dark' ? '#FFFFFF' : '#212529'
  }
})

const logoSrc = computed(() => {
  return style.theme === 'dark'
    ? require('@/assets/images/qr-sections/amazon-logo-dark.png')
    : require('@/assets/images/qr-sections/amazon-logo.png')
})


const __returned__ = { emit, section, style, cssVars, logoSrc }
Object.defineProperty(__returned__, '__isScriptSetup', { enumerable: false, value: true })
return __returned__
}

})