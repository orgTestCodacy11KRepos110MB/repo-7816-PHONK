<template>
  <div id = "info_todo">
  <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'Banner',
  data () {
    return {
      msg: 'Hello World!'
    }
  }
}
</script>

<style lang = "less">
#info_todo {
    z-index: 10;
    bottom: 52px;
    position: absolute;
    border-radius: 2px 2px 0px 0px;
    padding: 28px 18px;
    box-shadow: 2px 2px 2px black;
    left: 5%;
    text-align: center;
    right: 5%;
    font-size: 1.2em;
}
</style>
