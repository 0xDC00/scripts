// @name         LibUI
// @version      
// @author       blacktide082
// @description  Easily add an information or configuration UI to your script.

if (module.parent === null) {
    throw "libUI.js must be required from another script";
}

class UI {

    #notify = true;
    #description = '';
    #storage = true;
    #storageKey = module.parent.filename.slice(module.parent.path.length + 1).replace('.js', '');
    #title = 'UI';
    #options = [];
    #config;
    #onchange = () => {};

    constructor() {
        // the UI will call these methods
        rpc.exports.title = () => this.#title;
        rpc.exports.description = () => this.#description;
        rpc.exports.options = () => this.#options;
        rpc.exports.storage = () => ({ enabled: this.#storage, key: this.#storageKey });
        rpc.exports.changed = (key, value) => this.#changed(key, value);
    }

    set storageKey(storageKey) {
        // do nothing
    }

    set storage(storage) {
        this.#storage = storage;
    }

    set description(description) {
        this.#description = description;
    }

    set title(title) {
        this.#title = title;
    }

    get config() {
        return this.#config;
    }

    set options(options) {
        const ui = this;
        // proxy the setter call so that we can update the UI
        // if the configuration value is set from the script
        this.#config = new Proxy({}, {
            set(object, property, value) {
                if (ui.#notify) {
                    // value was set from within the script, so we notify the UI

                    // ensure that value types are set properly, e.g. prevent
                    // assigning a string to a number, etc.
                    if (typeof object[property] !== typeof value) {
                        console.error(`Tried to set property ${property} to ${typeof value} value when it should be ${typeof object[property]}!`);
                        return false;
                    }
                    rpc.send('changed', property, value);
                }
                object[property] = value;
                return true;
            },
        });
        // allow the configuration values to be retrieved
        // directly from the UI object
        for (const option of options) {
            // disallow duplicate option IDs
            if (this.#config[option.id] !== undefined) {
                console.warn(`Duplicate option "${option.id}" was found! Skipping the duplicate option.`);
                continue;
            }

            // add the option
            this.#options.push(option);

            // set the initial value for the select box if a default
            // value doesn't exist
            if (option.type === 'select' && option.options.length > 0) {
                if (option.multiple) {
                    const selected = option.options.filter(o => o.selected).map(o => o.value);
                    this.#setConfig(option.id, selected);
                } else {
                    this.#setConfig(option.id, option.defaultValue || option.options[0].value);
                }
                continue;
            }

            // set the default value for the config
            if (option.defaultValue !== undefined) {
                this.#setConfig(option.id, option.defaultValue);
                continue;
            }

            // checkboxes default to false
            if (option.type === 'checkbox') {
                this.#setConfig(option.id, false);
                continue;
            }

            // setting buttons to null, since they default to undefined
            // and the UI click update will send null instead of undefined
            if (option.type === 'button') {
                this.#setConfig(option.id, null);
                continue;
            }

            if (option.type === 'text') {
                this.#setConfig(option.id, '');
                continue;
            }

            if (option.type === 'number') {
                this.#setConfig(option.id, 0);
                continue;
            }
        }
    }

    alert(type, message, duration=5000) {
        rpc.send('alert', type, message, duration);
    }

    async open(wait = 100) {
        return new Promise((resolve, reject) => {
            loadHtml(getViewHtml());
            // loadHtmlFromFile(__filename.replace('.js', '.html'));

            // give the page time to load
            // don't know a better way to do this currently
            return setTimeout(() => resolve(), wait);
        });
    }

    #setConfig(key, value) {
        // kinda hack but prevents notifying the UI when
        // we are manually updating the config from within this class
        // (like on a config change event from the UI)
        this.#notify = false;
        this.#config[key] = value;
        this.#notify = true;
    }

    // sets the callback handler for when a config value
    // is changed in the UI
    set onchange(callback) {
        this.#onchange = callback;
    }

    // rpc.exports.changed()
    #changed(key, value) {
        const previous = this.#config[key];
        this.#setConfig(key, value);
        this.#onchange(key, value, previous);
    }
}

function getViewHtml() {
    return /*html*/`
<html>
<head>
  <style>
    /* position alerts at the bottom of the page */
    .alert {
      position: fixed;
      bottom: 0;
      left: 1em;
      width: calc(100% - 2em);
    }
    #loading {
      height: calc(100% - 3em);
    }
    #options {
      margin-bottom: 2em;
    }
  </style>
</head>
<body>
  <div id="loading" class="d-flex justify-content-center align-items-center">
    <div class="spinner-border" role="status">
      <span class="sr-only">Loading...</span>
    </div>
  </div>
  <div class="container p-3">
    <div class="row">
      <div class="col-md-12">
        <h2 id="title" class="text-center"></h2>
        <p id="description" class="text-center"></p>
        <div id="options"></div>
      </div>
    </div>
  </div>
  <small id="loaded"></small>
  <div id="info" style="display: none" class="alert alert-info mt-3" role="alert"></div>
  <div id="warn" style="display: none" class="alert alert-warning mt-3" role="alert"></div>
  <div id="success" style="display: none" class="alert alert-success mt-3" role="alert"></div>
  <div id="error" style="display: none" class="alert alert-danger mt-3" role="alert"></div>
  <script>
    // Doesn't work :(
    // window.addEventListener('error', (e) => error('An error occured in the UI: ' + e.error));

    let storageEnabled   = false;
    let storageKey       = null;
    const titleElement   = document.getElementById('title');
    const descElement    = document.getElementById('description');
    const optionsElement = document.getElementById('options');
    const alertTimeouts  = {};
    const alertElements  = {
      info:  document.getElementById('info'),
      error: document.getElementById('error'),
      warn:  document.getElementById('warn'),
      success:  document.getElementById('success'),
    };

    // handle configuration changes from the script
    rpc.on('changed', (id, value) => {
      if (setConfig(id, value)) {
        // no need to notify the script since this
        // came from the script.
        onChange({id}, value, false);
      }
    });

    // handle incoming alerts
    rpc.on('alert', alert);

    function updateStorage(id, value) {
      if (!storageEnabled) {
        return;
      }

      const json = localStorage.getItem(storageKey) || '{}';
      const config = JSON.parse(json);
      config[id] = value;
      localStorage.setItem(storageKey, JSON.stringify(config));
    }

    function loadStorage() {
      if (!storageEnabled) {
        return;
      }

      const json = localStorage.getItem(storageKey) || '{}';
      const config = JSON.parse(json);
      for (const key of Object.keys(config)) {
        if (setConfig(key, config[key])) {
          // notify the script
          onChange({id: key}, config[key], true, false);
        }
      }
    }

    // unused but this function can be used to load an external CSS file
    function addStyle(file) {
      const link = document.createElement('link');
      link.href = window.location.href.replace('resources/app/dist/index.html', 'data/scripts/' + file);
      link.rel = 'stylesheet';
      // use prepend so the stylesheet is above our styles
      document.head.prepend(link);
    }

    function onChange(option, value, notify=true, showAlert=true) {
      if (!option.ephemeral) {
        updateStorage(option.id, value);
      }
      if (!notify) {
        return;
      }

      rpc.exports.changed(option.id, value).then(() => {
        if (!showAlert) return;
        const text = (option.label || option.id) + " updated!";
        alert('info', text, 1000);
      });
    }

    function setConfig(id, value) {
      if (id === undefined) {
        return false;
      }

      const element = document.getElementById('config_' + id);
      if (element === undefined) {
        error('Could not find element with ID ' + id);
        return false;
      }

      const tag = element.tagName.toLowerCase();

      // handle buttons
      if (tag === 'button') {
        // do nothing
        return false;
      }
      
      // handle checkboxes, numbers, and text
      if (tag === 'input') {
        switch(element.type) {
          case 'checkbox':
            element.checked = value;
            return true;
          case 'number':
          case 'text':
            element.value = value;
            return true;
          default:
            error('Could not handle update for ' + tag + ' with type ' + element.type + '!');
        }
        return false;
      }
      
      // handle selects
      if (tag === 'select') {
        const options = element.getElementsByTagName('option');
        for (const option of options) {
          const multiple = typeof value !== 'string';
          option.selected = multiple ? value.includes(option.value) : (option.value === value);
        }
        return true;
      }

      // unsupported element
      error('Could not handle update for tag ' + tag + '!');
      return false;
    }

    function addHelp(element, option) {
      if (!option.help) {
        return;
      }

      // don't add help text for inline checkboxes
      if (option.type === 'checkbox' && option.inline === true) {
        return;
      }

      const help = document.createElement('small');
      help.className = 'form-text text-muted';
      help.innerHTML = option.help;
      element.append(help);
    }

    function addOption(element, option) {
      const div = document.createElement('div');
      div.className = 'form-group mb-2';
      const label = document.createElement('label');
      label.innerText = option.label;
      label.htmlFor = element.id;
      div.append(label);
      div.append(element);
      addHelp(div, option);
      optionsElement.append(div);
    }

    function addTextField(option) {
      const input = document.createElement('input');
      input.id = 'config_' + option.id;
      input.className = 'form-control';
      input.readOnly = option.readOnly === true;
      if (option.type === 'number') {
        input.type = 'number';
        input.value = option.defaultValue || 0;
        input.onchange = (e) => onChange(option, parseInt(e.target.value));
      } else if (option.type === 'text') {
        input.type = 'text';
        input.value = option.defaultValue || '';
        input.onchange = (e) => onChange(option, e.target.value);
      } else  {
        error('Unknown input type: ' + option.type);
        return;
      }
      addOption(input, option);
    }

    function addSelect(option) {
      const select = document.createElement('select');
      select.id = 'config_' + option.id;
      select.className = 'custom-select';
      select.onchange = function () {
        const selected = option.multiple ? [...this.selectedOptions].map(o => o.value) : this.value;
        onChange(option, selected);
      };

      if (option.multiple === true) {
        select.setAttribute('multiple', 'multiple');        
      }
      
      // add the options
      for (const opt of option.options) {
        const element = document.createElement('option');
        element.value = opt.value;
        element.innerText = opt.text;
        element.selected = (opt.value === option.defaultValue) || (option.multiple && opt.selected);
        select.appendChild(element);
      }

      addOption(select, option);
    }

    function addCheckbox(option) {
      const div = document.createElement('div');
      div.className = 'form-check mb-2';

      const input = document.createElement('input');
      input.id = 'config_' + option.id;
      input.className = 'form-check-input';
      input.type = 'checkbox';
      input.role = 'switch';
      input.checked = option.defaultValue || false;
      input.onchange = (e) => onChange(option, e.currentTarget.checked);

      const label = document.createElement('label');
      label.className = 'form-check-label';
      label.innerText = option.label;
      label.htmlFor = input.id;

      div.appendChild(input);
      div.appendChild(label);
      addHelp(div, option);
      optionsElement.appendChild(div);
    }

    function addButton(option) {
      const button = document.createElement('button');
      button.type = "button";
      button.id = 'config_' + option.id;
      button.className = 'btn btn-success btn-block mt-2'; // success to match Agent's button
      button.innerText = option.label;
      button.onclick = () => onChange(option, undefined);

      optionsElement.appendChild(button);
    }

    // display an error in the UI
    function error(message) { alert('error', message); }

    // display an alert in the UI (info, warn, error)
    function alert(type, message, duration=5000) {
      if (message === undefined) return;
      const element = alertElements[type];
      if (element === undefined) return;

      element.innerText = message;
      element.style.display = '';
      clearTimeout(alertTimeouts[type]);
      alertTimeouts[type] = setTimeout(() => element.style.display = 'none', duration);
    }

    function loaded() {
      document.getElementById("loading").remove();
    }

    // call script to get title, description, and configuration
    rpc.exports.title().then(title => titleElement.innerHTML = title);
    rpc.exports.description().then(desc => descElement.innerHTML = desc);
    rpc.exports.options().then(options => {
      for (const option of options) {
        switch(option.type) {
          case 'select':
            addSelect(option);
            break;
          case 'checkbox':
            addCheckbox(option);
            break;
          case 'number':
          case 'text':
            addTextField(option);
            break;
          case 'button':
            addButton(option);
            break;
          default:
            error('No handler for "' + option.type + '" option type!');
        }
      }

      loaded();

      rpc.exports.storage().then(storage => {
        if (!storage.enabled) return;

        storageKey = 'config-' + storage.key;
        storageEnabled = true;
        console.log('Enabling storage with key ' + storageKey + '...');
        loadStorage();
      });
    })

    addStyle('../../resources/app/dist/bundle.css');
  </script>
</body>
</html>
`;
}

module.exports = exports = new UI();