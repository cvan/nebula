(function () {

var username;
// if (localStorage.galaxy_username) {
//   username = localStorage.galaxy_username;
// } else {
//   // TODO: Use a real shortcode instead of simply asking for a username lol
//   localStorage.galaxy_username = username = window.prompt('What is your username?', 'guest');
// }

username = 'cvan';
var controllerRef = new Firebase('https://galaxy-controller.firebaseio.com/' + username);

controllerRef.update({accelerate: false});

// TODO: First check that the phone is paired before sending commands.

document.addEventListener('touchend', function (e) {
  socket.emit('accelerate', {accelerate: false});
}, false);

// Acclerate if the user touches the screen.
document.addEventListener('touchstart', function (e) {
  controllerRef.update({accelerate: true});
}, false);

// Stop accelerating if user stops touching screen.
document.addEventListener('touchend', function (e) {
  controllerRef.update({accelerate: false});
}, false);

// Prevent touchmove event from cancelling the `touchend` event above.
document.addEventListener('touchmove', function (e) {
  e.preventDefault();
}, false);

var currentDir; // Current direction of phone in landscape mode (left or right).

// Steer the vehicle based on the phone's orientation.
window.addEventListener('deviceorientation', function (e) {
  var alpha = e.alpha;  // Compass direction of the direction the device is facing, in degrees.
  var beta = e.beta;  // Front-to-back tilt, in degrees (front is positive).
  var gamma = e.gamma;  // Left-to-right tilt, in degrees (right is positive).

  // Regardless of phone direction, left/right tilt should behave the same.

  var turnDegrees = beta;  // When your right hand is on the top of the phone and your left hand is on the bottom of the phone.
  var dir = 'left';

  if (alpha < 90 || alpha > 270) {
    turnDegrees = 0 - beta;  // When your left hand is on the top of the phone and your right hand is on the bottom of the phone
    dir = 'right';
  }

  var oldMin = -90;
  var oldMax = 90;
  var oldRange = oldMax - oldMin;

  var newMin = -1;
  var newMax = 1;
  var newRange = newMax - newMin;

  var turn = ((turnDegrees - oldMin) * newRange) / oldRange + newMin;  // Ratio of turn in degrees (bound to the range of -1 and 1).

  controllerRef.update({
    alpha: alpha,
    beta: beta,
    gamma: gamma,
    dir: dir,
    turn: turn
  });
}, false);

})();
