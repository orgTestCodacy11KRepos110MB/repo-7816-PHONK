<template>
  <div id = "tutorial" class = "proto_panel">
    <div class = "actionbar">
      <div class = "tutorial_chooser">
        <a
          v-for = "t in tutorial_files"
          v-on:click = "fetchTutorial(t.id)"
          v-bind:class = "{ 'selected': false }"
          :key="t.id">
            Tutorial {{t.id}}
          </a>
      </div>
    </div>
    <div class = "content">
      <div v-html = "marked(loaded_tutorial.text)"></div>
    </div>
  </div>
</template>

<script>
import Marked from 'marked'
import Highlight from 'highlight.js'
// import 'highlight.js/styles/monokai.css'

Marked.setOptions({
  highlight: function (code, lang) {
    return Highlight.highlightAuto(code, [lang]).value
  }
})

export default {
  name: 'TutorialLoader',
  filters: {
    marked: Marked
  },
  data () {
    return {
      currentTab: 0,
      tutorial_files: [
        { id: '1' },
        { id: '2' }
      ],
      loaded_tutorial: {
        name: '', text: ''
      }
    }
  },
  computed: {
  },
  methods: {
    fetchTutorial: function (selected) {
      this.$http({ url: 'static/tutorials/tut' + selected + '.txt', method: 'GET' }).then(function (response) {
        this.loaded_tutorial = { name: selected, text: response.data }
        // console.log(data)
      }, function (response) {
        console.error(response)
      })
    },
    marked: function (text) {
      return Marked(text)
    }
  },
  route: {
    data () {
      this.title = 'Tutorial ' + this.$route.params.id
      this.fetchTutorial(this.$route.params.id)
    }
  },
  created () {
  },
  mounted () {
  },
  destroyed () {
  }
}
</script>
<style lang = "less">
@import (reference) "../assets/css/variables.less";

.tutorial_chooser {
  z-index: 2;

  a {
    padding: 10px;
    cursor: pointer;

    &:hover {
    }

    &.selected {
    }
  }
}

#tutorial {
  overflow-y: hidden;
  .shadow-main;
  line-height: 1.1em;
  font-size: 1em;

  code {
    .font-mono-400;
  }

  h1, h2, h3, h4, h5, h6, p, ul, ol, li, blockquote, table, pre {
    padding: 0em 0em;
    margin-bottom: 0.5em;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 1em 0em 0.5em 0em;
  }

  h1, h2 {
    padding-bottom: 0.3em;
  }

  h1 { font-size: 2.2em;}
  h2 { font-size: 1.8em; }
  h3 { font-size: 1.6em; }
  h4 { font-size: 1.5em; }
  h5 { font-size: 1.4em; }
  h6 { font-size: 1.3em; }

  strong {
  }

  em {
    font-style: italic;
  }

  p {
  }

  ul, ol {
    margin: 5px 15px;
    li {
    }
  }

  ul {
    list-style: circle;
  }

  ol {
    list-style: decimal;
  }

  pre {
    overflow: scroll;
    border-radius: 2px;
    padding: 8px;
    font-size: 1.2em;
    line-height: 1.3em;
  }

  blockquote {
    margin: 0px;
    padding-left: 8px;
  }

  table {
    margin: 10px 0px;

    tr {

      th, td {
        padding: 5px 12px;
      }

      th {
      }
    }
  }

  .video_wrapper {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 */
    padding-top: 25px;
    height: 0;
  }

  .video_wrapper iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}

</style>
