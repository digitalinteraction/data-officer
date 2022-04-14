<script lang="ts" setup>
import { Routes } from '../utils'
</script>

<template>
  <router-link :to="Routes.home" class="mainBrand">DataDiaries</router-link>
</template>

<style>
.mainBrand {
  color: black;
  text-decoration: underline;
  font-style: italic;
  font-size: 22px;
  font-weight: 800;
}
</style>
