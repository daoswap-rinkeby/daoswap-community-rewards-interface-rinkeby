<template>
  <v-app-bar app color="primary" dark>
    <div class="d-flex align-center">
      <v-img
        alt="Daoswap"
        class="shrink mr-2"
        contain
        :src="require('@/assets/logo.png')"
        transition="scale-transition"
        width="40"
      />
      <span class="text-h5">Daoswap</span>
    </div>

    <v-spacer></v-spacer>

    <v-btn
      color="pink accent-3"
      href="https://app.daoswap.global"
      target="_blank"
      >Daoswap APP</v-btn
    >
  </v-app-bar>
</template>

<script>
export default {
  name: "Header",
  data: () => ({
    //
  })
};
</script>
