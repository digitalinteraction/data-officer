<script lang="ts" setup>
import { useEntryStore } from './entry-store'

const entry = useEntryStore()
</script>

<template>
  <stack-layout>
    <header>
      <h2>Let's compare</h2>
      <p>
        Lets look at your entries together and compare and contrast. Lorem ipsum
        dolor sit amet, consectetur adipisicing elit. Iste consequuntur ut iusto
        doloribus hic labore, nam quasi mollitia quam aspernatur laudantium
        ipsam animi tempora molestiae nulla laborum. Neque, delectus commodi.
      </p>
    </header>

    <p>Reorder based on X?</p>
  </stack-layout>
</template>
