/* eslint-disable */
import Vue from 'vue'
import { EventEmitter } from 'events'
const store = new EventEmitter()
export default store

var TAG = 'store'
var DEBUG = false

// constants
var WEBAPP_PORT = 8585
var WS_PORT = 8587

/*
 * Global state variables
 */
var state = {
  DEBUG,
  projects: {},
  examples: [],
  current_project: {
    project: {
      folder: '',
      name: ''
    }
  },
  device_properties: {
    connected: false,
    info: {
      network: { 'ip': 'none' },
      device: { 'model name': 'none' },
      script: { 'running script': 'none', isRunning: false },
      other: { 'debugging': true },
      screen: { orientation: 'portrait' }
    }
  },
  show_ui_editor: false,
  show_load_project: false,
  show_dashboard: false,
  show_device_info: false,
  show_preferences: false,
  defaultPreferences: {
    'editor': {
      'text size': 18,
      /*
      'light theme': true,
      'autosave': true,
      */
      'tab bar': true,
      'sidebar': true
    },
    'Show in docs': {
      'advanced api': true,
      'documentation status': true,
      'TODO items': false
    },
  },
  preferences: {},
  webide: {
    'editor_width': '300px',
    'docs_height': '200px',
    'files_height': '100px'
  },
  lastNotificationId: 0
}

state.preferences = Object.assign({}, state.preferences, state.defaultPreferences)

var vm = new Vue({
  data: {
    state: state
  }
})

store.state = state
store.vm = vm

/*
 * List all projects
 */
store.project_list_all = function () {
  // console.log('project_list_all(query)')
  var query = {}

  Vue.axios.get(getUrlWebapp('/api/project/list/'), query).then(function (response) {
    Vue.set(store.state, 'projects', response.data)
    store.emit('project_listed_all')
  }, function (response) {
    console.error(TAG + ': project_list_all(status) > ' + response.status)
  })
}

/*
 * Load a project
 */
store.project_load = function (uri) {
  // console.log('project_load')
  var query = {}

  let id = store.state.lastNotificationId++
  store.emit('show_info', { id: id, icon: 'description', text: 'Loading Project...', status: 'progress' })

  Vue.axios.get(getUrlWebapp('/api/project' + uri + '/load'), query).then(function (response) {
    store.state.current_project = response.data
    store.emit('project_loaded', true)
    store.emit('project_files_list')
    store.load_project_preferences()
    store.emit('show_info', { id: id, icon: 'description', text: 'Project Loaded', status: 'done' })
    // store.list_files_in_path('')
    document.title = 'PHONK - ' + store.state.current_project.project.folder + '/' + store.state.current_project.project.name
  }, function (response) {
    store.emit('project_loaded', false)
    store.emit('show_info', { id: id, icon: 'error', text: 'Loading project error', status: 'error' })

    console.error(TAG + ': project_load(status) > ' + response.status)
  })
}

store.load_project_preferences = function () {
  var query = {}
  Vue.axios.get(this.getUrlForCurrentProject() + 'files/load/app.conf', query).then(function (response) {
    if (response.data.files[0].code) {
      console.log(response)
      var conf = JSON.parse(response.data.files[0].code)

      if (conf) store.state.current_project.conf = conf
    }
  }, function (response) {
    console.error(TAG + ': project_save(status) > ' + response.status)
  })
}

store.list_files_in_path = function (p) {
  var query = {} // path: p}

  // console.log('listing files in path ' + toPath)
  Vue.axios.get(getUrlWebapp('/api/project' + this.get_current_project() + '/files/list/' + p), query).then(function (response) {
    console.log('list_files_in_path(status) > ' + response.status)

    store.state.current_project.current_folder = '/' + p
    store.state.current_project.files = response.data
    
    store.emit('project_files_list', true)
  }, function (response) {
    store.emit('project_files_list', false)
    console.error(response)
  })
}

store.project_files_move = function (files) {
  console.log('files move')
  var query = {}
  query.files = files
  console.log(query)

  Vue.axios.post(getUrlWebapp('/api/project' + this.get_current_project() + '/files/move/'), query).then(function (response) {
    console.log('rename_files_in_path(status) > ' + response.status)

    // maybe here refresh again the files
    store.list_files_in_path(store.state.current_project.current_folder)
    store.emit('project_files_action_completed', true)
  }, function (response) {
    store.emit('project_files_action_completed', false)
    console.error('list_files_in_path(status) > ' + response.status)
  })
}

store.project_files_delete = function (files) {
  console.log('files delete')
  var query = {}
  query.files = files

  Vue.axios.post(getUrlWebapp('/api/project' + this.get_current_project() + '/files/delete/'), query).then(function (response) {
    console.log('delete_files_in_path(status) > ' + response.status)

    // maybe here refresh again the files
    store.list_files_in_path(store.state.current_project.current_folder)
    store.emit('project_files_action_completed', true)
  }, function (response) {
    store.emit('project_files_action_completed', false)
    console.error('list_files_in_path(status) > ' + response.status)
  })
}

/*
 * Load file
 */
store.load_file = function (file) {
  var query = {}

  Vue.axios.get(this.getUrlForCurrentProject() + 'files/load/' + file.path, query).then(function (response) {
    file.code = response.data.files[0].code
    store.emit('file_loaded', file)
  }, function (response) {
    console.error(TAG + ': project_save(status) > ' + response.status)
  }
  )
}

/*
 * Create a file
 */
store.create_file = function (filetype, filename) {
  var query = {}
  query.files = [{ name: filename, path: store.state.current_project.current_folder, type: filetype }]

  Vue.axios.post(getUrlWebapp('/api/project' + this.get_current_project() + '/files/create'), query).then(function (response) {
    store.emit('project_files_action_completed', true)
    store.list_files_in_path(store.state.current_project.current_folder)
  }, function (response) {
    console.error('create_file(status) NOP > ' + response.status)
    store.emit('project_files_action_completed', false)
  })
}

/*
 * Create a project
 */
store.project_create = function (projectName) {
  let id = store.state.lastNotificationId++
  store.emit('show_info', { id: id, icon: 'description', text: 'Creating project...', status: 'progress' })

  Vue.axios.get(getUrlWebapp('/api/project' + this.get_userproject_url(projectName) + '/create'), {}).then(function (response) {
    var data = { 'type': store.userproject.type, 'folder': store.userproject.folder, 'name': projectName }
    store.emit('project_created', true, data)
    store.project_list_all()
    store.emit('show_info', { id: id, icon: 'description', text: 'Project created', status: 'done' })
  }, function (response) {
    store.emit('show_info', { id: id, icon: 'error', text: 'Creating project error', status: 'error' })
    store.emit('project_created', false)
    console.error('project_create(status) > ' + response.status)
  })
}

store.project_clone = function (uri, newName) {
  let query = { newName: newName }
  let id = store.state.lastNotificationId++
  store.emit('show_info', { id: id, icon: 'description', text: 'Cloning project...', status: 'progress' })

  Vue.axios.post(getUrlWebapp('/api/project' + '/' + uri + '/clone'), query).then(function (response) {
    var data = { 'type': store.userproject.type, 'folder': store.userproject.folder, 'name': newName }
    store.emit('project_cloned', true, data)
    store.project_list_all()
    store.emit('show_info', { id: id, icon: 'description', text: 'Cloned in User Projects', status: 'done' })
  }, function (response) {
    store.emit('project_created', false)
    store.emit('show_info', { id: id, icon: 'error', text: 'Cloning project error', status: 'error' })
    console.error('project_create(status) > ' + response.status)
  })
}

store.project_rename = function (uri, newName) {
  console.log('rename', uri, newName)

  let id = store.state.lastNotificationId++
  store.emit('show_info', { id: id, icon: 'description', text: 'Renaming project...', status: 'progress' })

  let query = { newName: newName }
  Vue.axios.post(getUrlWebapp('/api/project' + '/' + uri + '/rename'), query).then(function (response) {
    // var data = { 'type': store.userproject.type, 'folder': store.userproject.folder, 'name': newName }
    store.emit('project_renamed')
    store.project_list_all()
    store.emit('show_info', { id: id, icon: 'description', text: 'Renamed', status: 'done' })
  }, function (response) {
    store.emit('project_created', false)
    store.emit('show_info', { id: id, icon: 'error', text: 'Renamming project error', status: 'error' })
    console.error('project_create(status) > ' + response.status)
  })
}

store.project_delete = function (uri) {
  let id = store.state.lastNotificationId++
  store.emit('show_info', { id: id, icon: 'description', text: 'Deleting project...', status: 'progress' })

  Vue.axios.get(getUrlWebapp('/api/project' + '/' + uri + '/delete'), {}).then(function (response) {
    store.emit('project_deleted')
    store.project_list_all()
    store.emit('show_info', { id: id, icon: 'description', text: 'Project Deleted', status: 'done' })
  }, function (response) {
    store.emit('project_created', false)
    console.error('project_create(status) > ' + response.status)
    store.emit('show_info', { id: id, icon: 'description', text: 'Deleting project error', status: 'error' })
  })
}

/*
 * Save a project
 */
store.project_save = function (files) {
  console.log('project saving', files)

  // Query
  var query = {}
  query.project = Object.assign({}, store.state.current_project.project)
  query.project.files = null
  query.files = []
  query.files = Object.assign([], files)

  // Notification
  let id = store.state.lastNotificationId++
  store.emit('show_info', { id: id, icon: 'save', text: 'Saving...', status: 'progress' })

  Vue.axios.post(getUrlWebapp('/api/project' + this.get_current_project() + '/save'), query).then(function (response) {
    store.emit('show_info', { id: id, icon: 'save', text: 'Saved', status: 'done' })

    store.emit('project_saved')
    store.list_files_in_path(store.state.current_project.current_folder)

    if (!store.state.current_project.conf) return

    if (store.state.current_project.conf.execute_on_save) {
      store.execute_code(store.state.current_project.conf.execute_on_save)
    }
  }, function (response) {
    console.error('project_save(status) NOP > ' + response.status)
    if (!response.status) {
      store.emit('show_info', { id: id, icon: 'error', text: 'Cannot save! Check the connection', status: 'error' })
    }
  })
}

/*
 * Run a loaded project
 */
store.project_action = function (action) {
  var query = {}

  let msg = 'Running...'
  let icon = 'play_arrow'

  if (action === '/stop') {
    msg = 'Stopping'
    icon = 'stop'
    state.device_properties.info.script.isRunning = false
  } else if (action === '/stop_or_run') {
    if (state.device_properties.info.script.isRunning) {
      action = '/stop'
      msg = 'Stopping'
      icon = 'stop'
      state.device_properties.info.script.isRunning = false
    } else {
      action = '/stop_all_and_run'
      state.device_properties.info.script.isRunning = true
    }
  }

  let id = store.state.lastNotificationId++
  store.emit('show_info', { id: id, icon: icon, text: msg, status: 'progress' })

  Vue.axios.get(getUrlWebapp('/api/project' + this.get_current_project() + action), query).then(function (response) {
    store.emit('show_info', { id: id, icon: icon, text: msg, status: 'done' })
  }, function (response) {
    console.error('project_action error', response.status)
    store.emit('show_info', { id: id, icon: icon, text: 'Error ' + msg + '...', status: 'error' })
  })
}

/*
 * Execute a code line
 */
store.execute_code = function (code) {
  let id = store.state.lastNotificationId++

  var query = { code: code }
  store.emit('show_info', { id: id, icon: 'autorenew', text: 'Live...', status: 'progress' })

  Vue.axios.post(getUrlWebapp('/api/project/execute_code'), query).then(function (response) {
    store.emit('show_info', { id: id, icon: 'autorenew', text: 'Live...', status: 'done' })
  }, function (response) {
    store.emit('show_info', { id: id, icon: 'autorenew', text: 'Live...', status: 'error' })
    console.error(response.status)
  })
}

store.uploadFile = function (file, folder) {
  var formData = new FormData()
  // formData.append('_token', this.token) // just the csrf token
  formData.append('name', file.data.name)
  formData.append('type', file.data.type)
  formData.append('file', file.data)
  formData.append('toFolder', folder)

  let config = {
    headers: { 'Content-Type': 'multipart/form-data;charset=UTF-8' }
  }

  console.log('uploadFile', file, formData)
  Vue.axios.post(getUrlWebapp('/api/project' + this.get_current_project() + '/files/upload/'), formData, config).then(function (response) {
    console.log('File upload success', response)
    store.emit('project_file_uploaded', response.data)
  }, function (response) {
    console.log('File upload error...', response)
  })
}

/*
xhr: {
  onprogress: function (e) {
    // console.log(e)
    // console.log('uploading')

    if (e.lengthComputable) {
      // var progress = (e.loaded / e.total) * 100
      // console.log('p1 ' + progress)
    }
  },
  onreadystatechange: function (e) {
    // console.log(e + this.readyState)
    if (this.readyState === 4) {
      // console.log(e)
    }
  }
}
*/

/*
 * List views
 */
store.views_list_types = function (action) {
  var query = {}
  Vue.axios.get(getUrlWebapp('/api/project/views_list_types'), query).then(function (response) {
    // console.log(response.status)
    // console.log(response.data)
    store.emit('views_list_types', response.data)
  }, function (response) {
    // console.log(response.status)
  })
}

/*
 * Add views all
 */
store.views_get_all = function (action) {
  var query = {}
  Vue.axios.get(getUrlWebapp('/api/project/views_get_all'), query).then(function (response) {
    // console.log(response.status)
    // console.log(response.data)
    store.emit('views_get_all', response.data)
  }, function (response) {
    // console.log(response.status)
  })
}

/*
* Event Listeners
*/
store.on('project_list_all', store.project_list_all)
store.on('project_action', store.project_action)
store.on('project_load', store.project_load)
store.on('project_save', store.project_save)

/*
 * Helper functions
 */
store.get_current_project = function () {
  return '/' + store.state.current_project.project.folder + '/' + store.state.current_project.project.name
}

store.userproject = { 'type': 'playground', 'folder': 'User Projects' }
store.get_userproject_url = function (name) {
  return '/' + store.userproject.type + '/' + store.userproject.folder + '/' + name
}

store.clearArray = function (dst) {
  while (dst.length) dst.pop()
}

store.copyArray = function (or, dst) {
  this.clearArray(dst)
  for (var i in or) {
    dst.push(or[i])
  }
}

/*
 * Method that returns the PHONK Server, useful when debugging
 */
var getUrl = function (route) {
  if (DEBUG) {
    // return '192.168.2.151'
    return '127.0.0.1'
  } else {
    return window.location.hostname
  }
}

store.get_full_url_for_project = function (route) {
  return 'http://' + getUrl() + ':' + WEBAPP_PORT + '#/editor' + route
}

var getUrlWebapp = function (route) {
  return 'http://' + getUrl() + ':' + WEBAPP_PORT + route
}

var getUrlWs = function () {
  return 'ws://' + getUrl() + ':' + WS_PORT
}

store.getUrlForCurrentProject = function () {
  var p = store.state.current_project.project
  return getUrlWebapp('/api/project/' + encodeURIComponent(p.folder + '/' + p.name + '/'))
}

store.loadDocumentation = function () {
  var query = {}

  Vue.axios.get('/static/documentation.json', query).then(function (response) {
    store.state.documentation = response.data
    store.emit('documentation_loaded')
  }, function (response) {
  })
}

/*
* Websockets for rapid communication
*/
var ws
var wsIsConnected = false
var reconnectionInterval

store.websockets_init = function () {
  var that = this

  // console.log('trying to connect to ' + getUrlWs())
  ws = new WebSocket(getUrlWs())

  ws.onerror = function (e) {
    console.log('ws error', e)
  }

  ws.onopen = function () {
    // console.log('ws connected')
    wsIsConnected = true
    clearInterval(reconnectionInterval) // _s the reconnection
    state.device_properties.connected = true

    // restart
    store.emit('project_list_all')
  }

  ws.onmessage = function (e) {
    // console.log('ws message', e)
    var data = JSON.parse(e.data)

    // getting console data
    switch (data.module) {
      case 'webeditor':
        if (data.action === 'load_project') {
          store.emit('load_project_from_app', data)
        }
        break

      case 'console':
        store.emit('console', data)
        break

      // getting device data
      case 'device':
        data.connected = true
        state.device_properties.connected = true
        store.state.device_properties = Object.assign({}, store.state.device_properties, data)
        break
        
      case 'dashboard':
        console.log('dashboard', data)
        store.emit('dashboard', data)
        break

      default:
    }
  }

  ws.onclose = function () {
    // console.log('ws disconnected')
    // this.protoEvent.send('ui_appConnected', false)
    wsIsConnected = false
    store.emit('device', { connected: false })

    // try to reconnect
    reconnectionInterval = setTimeout(function () {
      console.log('trying to reconnect...')
      that.websockets_init()
    }, 200)
  }
}

store.send_ws_data = function (data) {
  if (wsIsConnected) ws.send(JSON.stringify(data))
}

store.websockets_init()

store.mouse = function () {
  document.onmousemove = function (event) {
    event = event || window.event
  }
}

store.mydragg = function () {
  return {
    move: function (divid, xpos, ypos) {
      divid.style.left = xpos + 'px'
      divid.style.top = ypos + 'px'
    },
    startMoving: function (divid, container, evt) {
      evt = evt || window.event

      var posX = evt.clientX
      var posY = evt.clientY
      var divTop = divid.style.top
      var divLeft = divid.style.left

      var eWi = parseInt(divid.style.width)
      var eHe = parseInt(divid.style.height)
      var cWi = parseInt(document.getElementById(container).style.width)
      var cHe = parseInt(document.getElementById(container).style.height)

      document.getElementById(container).style.cursor = 'move'
      divTop = divTop.replace('px', '')
      divLeft = divLeft.replace('px', '')
      var diffX = posX - divLeft
      var diffY = posY - divTop

      document.onmousemove = function (evt) {
        evt = evt || window.event
        var posX = evt.clientX
        var posY = evt.clientY
        var aX = posX - diffX
        var aY = posY - diffY

        if (aX < 0) aX = 0
        if (aY < 0) aY = 0
        if (aX + eWi > cWi) aX = cWi - eWi
        if (aY + eHe > cHe) aY = cHe - eHe

        store.mydragg.move(divid, aX, aY)
      }
    },
    stopMoving: function (container) {
      document.getElementById(container).style.cursor = 'default'
      document.onmousemove = function () { }
    }
  }
}


store.save_browser_config = function () {
  localStorage.setItem('browser', JSON.stringify(state.browser))
  // console.log(state.preferences)
}

store.load_browser_config = function () {
  state.browser = JSON.parse(localStorage.getItem('browser') || '[]')
  // console.log(state.preferences)
}

store.loadSettings = function () {
  var savedSettings = localStorage.getItem('editor_preferences')

  if (typeof savedSettings === 'undefined' || !savedSettings || savedSettings === 'null') {
    store.clearSettings()
  } else {
    let parsedPreferences = JSON.parse(savedSettings)
  
    if (parsedPreferences.hasOwnProperty('savedTime')) {
      delete parsedPreferences.savedTime
      state.preferences = Object.assign({}, state.preferences, parsedPreferences)
    } else {
      store.clearSettings()
    }
  }

  // we get the settings injected from the app
  if (typeof settingsFromAndroid !== 'undefined') {
    console.log('WebIDE is loaded within the app', settingsFromAndroid.isTablet())
    Vue.set(store.state.preferences['other'], 'WebIDE as default editor', settingsFromAndroid.getWebIde())
  } else {
    // console.log('WebIDE is not loaded within the app')
  }
}

store.saveSettings = function () {
  console.log('saveSettings')

  let settings = JSON.parse(JSON.stringify(this.state.preferences))
  settings.savedTime = Date.now()
  localStorage.setItem('editor_preferences', JSON.stringify(settings))

  try {
    settingsFromAndroid.setWebIde(store.state.preferences['other']['WebIDE as default editor'])
  } catch(e) {
    console.log('no settings coming from Android')
  }
}

store.clearSettings = function () {
  console.log('clearSettings')
  state.preferences = Object.assign({}, state.preferences, state.defaultPreferences)

  store.saveSettings()
}
