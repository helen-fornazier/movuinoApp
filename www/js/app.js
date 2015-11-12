service_uuid_v91_dash = "0bd51666-e7cb-469b-8e4d-2742f1ba77cc";
char_uuid_v91_dash = "e7add780-b042-4876-aae1-112855353cc1";

// ASCII only
function stringToBytes(string) {
   var array = new Uint8Array(string.length);
   for (var i = 0, l = string.length; i < l; i++) {
       array[i] = string.charCodeAt(i);
    }
    return array.buffer;
}

// ASCII only
function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

function connected(device)
{
    // Listen to notifications
    ble.startNotification(device.id, service_uuid_v91_dash, char_uuid_v91_dash,
        function(buffer) {
            //console.log("Notif received:");
            console.log(bytesToString(buffer));
        },
        function(arg) {
            console.log("Could not listen for notifications");
            console.log(arg);
        }
    );

    // Send a ping message
    ble.write(device.id, service_uuid_v91_dash, char_uuid_v91_dash, stringToBytes("l\n"),
        function() {
            console.log("Live sent");
        },
        function(arg) {
            console.log("Could not send ping");
            console.log(arg);
        }
    );
}

function scan()
{
    console.log("Initializing scan");
    ble.scan([], 10,
        function(device) {
            console.log(JSON.stringify(device));
            ble.connect(device.id,
                function() {
                    console.log("Bluetooth is connected");
                    connected(device);
                },
                function() {
                    console.log("Could not connect BLE");
                }
            );
        },
        function() {
            console.log("ble scan fail");
        }
    );
}

//--------------------------------------------
// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    ble.enable(
        function() {
            console.log("Bluetooth is enabled");
            scan();
        },
        function() {
            console.log("The user did *not* enable Bluetooth");
        }
    );
  });
})
