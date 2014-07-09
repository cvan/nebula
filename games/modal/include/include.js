(function () {

var $doc = $(document);
var $body = $(document.body);

var game = null;
var utils = {};
var user = null;

utils.escape = function (string) {
  if (!string) {
    return string;
  }
  return string.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/'/g, '&#39;')
               .replace(/"/g, '&#34;');
};

var RE_TAGS = /input|keygen|meter|option|output|progress|select|textarea/i;

utils.fieldFocused = function (string) {
  function fieldFocused(e) {
    return RE_TAGS.test(e.target.nodeName);
  }
};


function Modal(opts, inject) {
  // Create properties for `id`, `classes`, `title`, and `content`.
  Object.keys(opts).forEach(function (key) {
    this[key] = opts[key];
  }, this);

  if (inject) {
    this.inject();
  }
}

Modal.closeAll = Modal.prototype.close = function () {
  // Close any open modal.
  $('.md-show').removeClass('md-show');
  $('.overlayed').removeClass('overlayed');
};

Modal.injectOverlay = function () {
  // Inject the overlay we use for overlaying it behind modals.
  // TODO: Disable `overflow-y` on `body` when a modal is opened.
  if (!document.querySelector('.md-overlay')) {
    $('<div class="md-overlay"></div>').appendTo($body);
  }
};

Modal.prototype.html = function () {
  return (
    '<div class="md-modal md-effect-1 ' + (this.classes || '') + '" id="modal-' + this.id + '">' +
      '<div class="md-content">' +
        '<h3>' + utils.escape(this.title) + '</h3> ' +
        '<a class="md-close" title="Close"><span><div>Close</div></span></a>' +
        '<div>' + this.content + '</div>' +
      '</div>' +
    '</div>'
  );
};

Modal.prototype.inject = function () {
  Modal.injectOverlay();

  var $modal = $(this.html());

  $modal.appendTo($body);
  $body.addClass('overlayed');

  return this.el = $modal[0];
};

Modal.prototype.open = function () {
  this.el.classList.add('md-show');
};


function Game(opts) {
  this.data = opts;
}

Game.prototype.get = function (key) {
  console.log('Game.get');
  return this.data[key];
};

Game.prototype.set = function (key, value) {
  console.log('Game.set');
  return this.data[key] = value;
};


function addToGamesPlayed() {
  // TODO: Actually talk to API instead of keeped this local hashtable.
  var gamesPlayed = JSON.parse(localStorage.galaxy_gamesPlayed || '{}');
  if (!(game.get('name') in gamesPlayed)) {
    gamesPlayed[game.get('name')] = {};
  }

  // Indicate that this user has played this game.
  gamesPlayed[game.get('name')][user.get('username')] = true;

  localStorage.galaxy_gamesPlayed = JSON.stringify(gamesPlayed);
}

function addToGamesPlaying() {
  var gamesPlaying = JSON.parse(localStorage.galaxy_gamesPlaying || '{}');
  if (!(game.get('name') in gamesPlaying)) {
    gamesPlaying[game.get('name')] = {};
  }

  // Indicate that this user is playing this game.
  gamesPlaying[game.get('name')][user.get('username')] = true;

  localStorage.galaxy_gamesPlaying = JSON.stringify(gamesPlaying);
}

function removeFromGamesPlayed() {
  var gamesPlayed = JSON.parse(localStorage.galaxy_gamesPlayed || '{}');
  if (!(game.get('name') in gamesPlayed)) {
    gamesPlayed[game.get('name')] = {};
  }

  // Indicate that this user has played this game.
  delete gamesPlayed[game.get('name')][user.get('username')];

  localStorage.galaxy_gamesPlayed = JSON.stringify(gamesPlayed);
}

function removeFromGamesPlaying() {
  var gamesPlaying = JSON.parse(localStorage.galaxy_gamesPlaying || '{}');
  if (!(game.get('name') in gamesPlaying)) {
    gamesPlaying[game.get('name')] = {};
  }

  // Indicate that this user has played this game.
  delete gamesPlaying[game.get('name')][user.get('username')];

  localStorage.galaxy_gamesPlaying = JSON.stringify(gamesPlaying);
}


function User(opts) {
  this.data = opts;

  // Note: even if the user manipulates these values, user would be denied by
  // the server to make API calls.
  this.authenticated = false;
}

User.prototype.get = function (key) {
  console.log('User.get');
  return this.data[key];
};

User.prototype.set = function (key, value) {
  console.log('User.set');
  return this.data[key] = value;
};

User.prototype.authenticate = function () {
  // TODO: Talk to API to make sure data is sane.
  console.log('User.authenticate');
  user.authenticated = true;
};

User.prototype.beginPlaying = function () {
  console.log('User.beginPlaying');

  // TODO: Actually begin tracking play time.
  user.playing = true;

  addToGamesPlaying();
  addToGamesPlayed();
};

User.prototype.endPlaying = function () {
  // TODO: Talk to API.
  console.log('User.beginPlaying');

  // TODO: Actually stop tracking play time.
  user.playing = false;

  removeFromGamesPlaying();
};

User.prototype.save = function () {
  console.log('User.save');
  localStorage.galaxy_user = JSON.stringify(this.data);
};


var authForm = (
  '<form class="auth-form">' +
    '<label for="username">Username</label>' +
    '<input type="text" id="username" name="username" placeholder="Choose a username" autofocus>' +
  '</form>'
);


function connect(opts) {
  return new Promise(function (resolve, reject) {
    // TODO: Establish WebSocket connection to API server.

    game = new Game(opts);

    resolve();
  });
}


function authenticate() {
  return new Promise(function (resolve, reject) {
    console.log('galaxy.authenticate');

    if (localStorage.galaxy_user) {
      user = new User(JSON.parse(localStorage.galaxy_user));
      user.authenticate();

      var modal = new Modal({
        id: 'welcome',
        classes: 'slim',
        title: 'Welcome back',
        content: 'Nice to see you again, ' + utils.escape(user.data.username)
      }, true);

      setTimeout(function () {
        modal.open();
      }, 150);

      setTimeout(function () {
        modal.close();
        resolve();
      }, 2000);

      return;
    }

    var modal = new Modal({
      id: 'auth',
      classes: 'slim',
      title: 'Sign in',
      content: authForm
    }, true);

    setTimeout(function () {
      // `setTimeout` for the fancy effect.
      modal.open();
    }, 150);

    modal.el.addEventListener('submit', function (e) {
      e.preventDefault();

      // Create a new user and save locally.
      user = new User({
        username: e.target.elements[0].value,
      });
      user.authenticate();
      user.save();

      modal.close();

      console.log('resolving');

      resolve();
    });
  });
}

// Handle modal dismissals.
$body.on('click', '.md-close, .md-overlay', function (e) {
  e.stopPropagation();
  Modal.closeAll();
}).on('keyup', function (e) {
  if (utils.fieldFocused(e)) {
    return;
  }
  if (e.keyCode === 27) {
    Modal.closeAll();
  }
});


if (!('game' in window)) {
  window.galaxy = {
    authenticate: authenticate,
    connect: connect,
    beginPlaying: function () {
      return user.beginPlaying();
    },
    endPlaying: function () {
      return user.endPlaying();
    },
    getGame: function () {
      return game;
    },
    getUser: function () {
      return user;
    },
    utils: utils
  };
}

})();