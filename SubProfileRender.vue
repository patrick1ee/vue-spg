<script setup lang="ts">
import { ref, computed, PropType } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import { SubProfile, UserSubProfile } from '@/types'

import SubProfileContainerModular from '@/components/profile/SubProfileContainerModular.vue'

const { subProfile } = defineProps({
    subProfile: {
        type: Object as PropType<SubProfile | UserSubProfile | null>,
        required: true
    }
})

const contentActive = ref(false)

function beforeUnloadListener (e: Event) {
  e.preventDefault()
  return ''
}

function onSetContentActive (active: boolean) {
  contentActive.value = active
  if (active) addEventListener('beforeunload', beforeUnloadListener, { capture: true })
  else removeEventListener('beforeunload', beforeUnloadListener, { capture: true })
}

function onSectionClick (id: number) {
  // SECTION CLICK
}

const c = computed(() => {
  return 'test'
})

onBeforeRouteLeave((to, from, next) => {
  onSetContentActive(false)
  next(false)
})

</script>

<template>
  <div class="sub-profile-view">
    <div v-if="subProfile && subProfile.id.length > 0" class="sub-profile-content">
      <SubProfileContainerModular
        :subProfile="subProfile"
        :contentActive="contentActive"
        @onSectionClick="onSectionClick"
        />
    </div>
  </div>
</template>

<style scoped lang="scss">
  div.sub-profile-view{
    width: 100%;
    min-height: 500px;
  }
  div.sub-profile-content{
    width: 25%;
    margin: 0 auto;
    padding-top: 5px;
    padding-bottom: 15px;
    min-height: 500px;
  }
  html, body {
    padding:0;
    margin:0;
    border: none
  }

  @media only screen and (min-width: 1200px){
    div.sub-profile-content{
      width: 40%;
    }
  }
  @media only screen and (min-width: 1001px){
    div.sub-profile-content{
      width: 45%;
    }
  }
  @media only screen and (max-width: 1000px){
    div.sub-profile-content{
      width: 50%;
    }
  }
  @media only screen and (max-width: 850px){
    div.sub-profile-content{
      width: 65%;
    }
  }
  @media only screen and (max-width: 750px){
    div.sub-profile-content{
      width: 75%;
    }
  }
  @media only screen and (max-width: 650px){
    div.sub-profile-content{
      width: 100%;
    }
  }
</style>
