<template>
  <pop-over arrow = "top" :posx = "posx" :posy = "posy">
    <div class = "popup_content">
      <ul v-if = "sharedState.device_properties.connected" >
        <li
          class = "block"
          v-for = "(prop, key1)
          in sharedState.device_properties.info"
          :key="key1"
          >
          <h3 class = "title">{{key1}}</h3>
          <ul>
            <li
              v-for = "(value, key2) in prop"
              :key="key2"
            >
              <span class = "key">{{ key2 }}: </span>
              <span class = "value">{{ value }}</span>
            </li>
          </ul>
        </li>
      </ul>
      <div v-else class = "disconnected">
        <i class = "icon material-icons">wifi_off</i>
        <p>Your device is disconnected <br />Please double check the connection among both devices</p>
      </div>
    </div>
  </pop-over>
</template>

<script>
import Store from '../../Store'
import PopOver from '../views/PopOver'

export default {
  name: 'DeviceInfoPopover',
  components: {
    PopOver
  },
  data () {
    return {
      ready: false,
      posx: '38px',
      posy: '58px',
      device_properties: {},
      sharedState: Store.state
    }
  },
  methods: {
    togglepopup: function () {
      var rect = this.$el.getBoundingClientRect()
  
      this.posx = rect.left + 'px'
      this.posy = rect.top + rect.height + 5 + 'px'
    }
  },
}
</script>

<style lang = "less" scoped>
@import (reference) '../../assets/css/variables.less';

#device_frame {
  .all-transitions;
  border: 0;
  padding: 2px 1px 3px 1px;
  margin: 0px;
  border-radius: 1px;
  display: inline-block;

  #device_screen {
    .all-transitions;
    width: 12px;
    height: 20px;
    border-radius: 0px;
  }
}

ul {
  li {
    padding-bottom: 0.5em;
  }
}

.disconnected {
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  margin: 12px;
  gap: 12px;

  .icon {
    font-size: 40px;
    text-align: center;
  }

  .wifi {
    opacity: 0.3;
  }
  .ban {
    font-size: 1.5em;
    padding: 10px 0px 0 10px;
  }

  p {
    .font-mono-400;
    font-size: 0.8rem;
    line-height: 1.5em;
    color: var(--color-text-light);
  }
}
</style>
