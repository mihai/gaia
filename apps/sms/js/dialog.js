/*global WeakMap */

/* exported Dialog */

(function(exports) {
'use strict';

/*
 Generic confirm screen. Only 'cancel/default' is mandatory.

 Text field are localized when their `l10nId' parameter is set -- in which case,
 the optional `l10nArgs' parameter is applied. Without `l10nId', the `value'
 parameter will be used: it can be either an HTML node or plain text.

 Options should follow the following structure:

 {
  title: {
    value: 'foo Title'
  },
  body: {
    l10nId: 'showMessageCount',
    l10nArgs: { n: count }
  },
  options: {
    // Cancel is a mandatory option. You need to define at least the text.
    cancel: {
      text: {
        l10nId: 'cancel'
      }
    },
    // Confirm is an optional one. As in cancel, you could add as well a method
    // with params.
    confirm: {
      text: {
        l10nId: 'remove'
      },
      method: function(params) {
        fooFunction(params);
      },
      params: [arg1, arg2,....]
    }
  }
*/

// helper to localize an element given parameters
function createLocalizedElement(tagName, param) {
  var element = document.createElement(tagName);

  // if we passed an l10nId, use the l10n `setAttributes' method
  if (param.l10nId) {
    navigator.mozL10n.setAttributes(element, param.l10nId, param.l10nArgs);

  // if we passed in a HTML Fragment, it is already localized
  } else if (param.value.nodeType) {
    element.appendChild(param.value);

  // otherwise - stuff text in here...
  } else {
    element.textContent = param.value;
  }
  return element;
}

var Dialog = function(params) {
  // We need, at least, one cancel option string
  if (!params || !params.options || !params.options.cancel) {
    return;
  }
  var handlers = new WeakMap();
   // Create the structure
  this.form = document.createElement('form');
  this.form.dataset.type = 'confirm';
  this.form.setAttribute('role', 'dialog');
  this.form.tabIndex = -1;
  // Pick up option_menu.css styling
  this.form.dataset.subtype = 'menu';

  // We fill the main info

  // take into account localization as well
  var titleDOM = createLocalizedElement('strong', params.title);
  var bodyDOM = createLocalizedElement('small', params.body);

  // Adding this elements to the DOM
  var infoSection = document.createElement('section');
  // We create the info container
  var infoContainer = document.createElement('p');
  infoContainer.appendChild(titleDOM);
  infoContainer.appendChild(bodyDOM);
  // We append to the section
  infoSection.appendChild(infoContainer);
  // At the end we have to append to the form
  this.form.appendChild(infoSection);

  // Adding options. In this case we have a maximum of 2, with different styles
  // per button
  var menu = document.createElement('menu');
  // Default button (Cancel button). It's mandatory
  var cancelOption = params.options.cancel;
  var cancelButton = createLocalizedElement('button', cancelOption.text);
  handlers.set(cancelButton, cancelOption);

  if (params.options.confirm) {
    var confirmOption = params.options.confirm;
    var confirmButton = createLocalizedElement('button', confirmOption.text);
    confirmButton.className = params.options.confirm.className || 'recommend';
    handlers.set(confirmButton, confirmOption);

    menu.appendChild(cancelButton);
    menu.appendChild(confirmButton);
  } else {
    // If there is only one item, we take the 100% of the space available
    cancelButton.style.width = '100%';
    menu.appendChild(cancelButton);
  }

  this.form.addEventListener('submit', function(event) {
    event.preventDefault();
  });

  this.form.addEventListener('transitionend', function(event) {
    if (!event.target.classList.contains('visible') &&
        event.target.parentNode) {
      document.body.removeChild(event.target);
    }
    // If we add a class, the animation will not be perform properly.
    // see Bug 1095338 for further information
    document.body.style.pointerEvents = 'initial';
  });

  menu.addEventListener('click', function(event) {
    var action = handlers.get(event.target);

    if (!action) {
      return;
    }

    var method = (action && action.method) || function() {};

    // Delegate operation to target method. This allows
    // for a custom "Cancel" to be provided by calling program
    method.apply(null, action.params || []);

    // Hide action menu when click is received
    this.hide();

  }.bind(this));
  // Appending the action menu to the form
  this.form.appendChild(menu);
};

// We prototype functions to show/hide the UI of action-menu
Dialog.prototype.show = function() {
  if (!this.form.parentNode) {
    document.body.appendChild(this.form);

    // Flush style on form so that the show transition plays once we add
    // the visible class.
    this.form.clientTop;
  }
  this.form.classList.add('visible');
  // If we add a class, the animation will not be perform properly.
  // see Bug 1095338 for further information
  document.body.style.pointerEvents = 'none';
  this.form.focus();
};

Dialog.prototype.hide = function() {
  this.form.classList.remove('visible');
};

exports.Dialog = Dialog;

// end global closure
}(this));

