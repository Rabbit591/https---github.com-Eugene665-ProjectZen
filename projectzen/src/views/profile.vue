<template>
</template>
<script>
import { inject } from "vue";
export default {
  setup () {
    const user = inject('user');
    console.log(user);
    return {
      user
    };
  }
}
</script>