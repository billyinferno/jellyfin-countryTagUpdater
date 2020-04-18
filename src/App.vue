<template>
  <div id="app">
    <CountryTagUpdater />
  </div>
</template>

<script>
import CountryTagUpdater from './components/CountryTagUpdater.vue';

export default {
  name: 'App',
  components: {
    CountryTagUpdater
  },
}
</script>

<style>
body, html {
  font-family: Helvetica, Arial, sans-serif;
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #f1f1f1;
  background-color: #363636;
}

#app {
  margin: 30px;
}
</style>
