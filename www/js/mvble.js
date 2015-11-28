angular.module('mvble', [])

.constant("rxBuff_max_size", 100) // Amound of elements the array can have

.constant("mv_devices",
    [
        {
            name            : "rbl",
            uuid_service    : "713d0000-503e-4c75-ba94-3148f18d941e",
            uuid_tx         : "713d0003-503e-4c75-ba94-3148f18d941e",
            uuid_rx         : "713d0002-503e-4c75-ba94-3148f18d941e",
        },
        {
            name            : "v91",
            uuid_service    : "0bd51666-e7cb-469b-8e4d-2742f1ba77cc",
            uuid_tx         : "e7add780-b042-4876-aae1-112855353cc1",
            uuid_rx         : "e7add780-b042-4876-aae1-112855353cc1",
        },
    ])

// TODO: check if we can remove $ionicScrollDelegate and $state
// this module should be independed of the view
.controller("mvble-controller",
function($scope, $state, $ionicScrollDelegate, rxBuff_max_size, mv_devices) {
    // TODO: check if there is a better place to initialize the scope
    if (!$scope.devices) $scope.devices = [];
    if (!$scope.connectedTo) $scope.connectedTo = false;
    if (!$scope.mvDevice) $scope.mvDevice = false;
    if (!$scope.inputCommand) $scope.inputCommand = {};
    if (!$scope.rxBuff) $scope.rxBuff = [];

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

    function disconnect()
    {
        console.log("BLE: disconnecting...");
        ble.disconnect($scope.connectedTo.id,
            function() {
                console.log("BLE: disconnected");
                $scope.connectedTo = false;
                $state.go('ble-disconnected');
                $scope.mvDevice = false;
                $scope.$apply();
            }
        );
    }

    function deviceFound(device)
    {
        console.log("BLE: device found");
        console.log(JSON.stringify(device));
        $scope.devices.push(device);
        // Update the controller
        $scope.$apply();
    }

    function scan()
    {
        // Scan for 3 seconds
        console.log("BLE: scanning...");
        $scope.devices = []
        ble.scan([], 3, deviceFound,
            function(arg) {
                console.log("BLE: scan fail");
                console.log(arg);
            }
        );
    }

    function detectConnectedDevice()
    {
        // Check for services in the connected device that matches our mv_devices list
        for (var i in mv_devices)
        {
            console.log("BLE: trying " + mv_devices[i].name);

            for (var j in $scope.connectedTo.services)
            {
                if (mv_devices[i].uuid_service == $scope.connectedTo.services[j])
                {
                    console.log("BLE: device detected - " + mv_devices[i].name);
                    $scope.mvDevice = mv_devices[i];
                    return;
                }
            }
        }

        // Fail
        // If we tried all the mv_devices list and
        // we coudn't find any compatible service, disconnect
        console.log("BLE: connected device is not a Movuino. Disconnecting...");
        disconnect();
    }

    function listenNotifications()
    {
        // Listen to notifications
        ble.startNotification($scope.connectedTo.id, $scope.mvDevice.uuid_service, $scope.mvDevice.uuid_rx,
            function(buffer) {
                var str = bytesToString(buffer);
                console.log("BLE: rx>" + str);
                $scope.rxBuff.push(str);
                if ($scope.rxBuff.length == rxBuff_max_size)
                {
                    // Remove first line of it
                    $scope.rxBuff.shift();
                }
                $ionicScrollDelegate.scrollBottom();
                $scope.$apply();
            },
            function(arg) {
                console.log("BLE: Could not listen for notifications");
                console.log(arg);
            }
        );
    }

    function connected(device)
    {
        console.log("BLE: connected");
        $scope.connectedTo = device;
        $state.go('ble-connected');
        // Detect version of the device
        detectConnectedDevice();

        if ($scope.mvDevice) {
            // Listen for notifications
            listenNotifications();
        }
        $scope.$apply();
    }

    function connect(device)
    {
        console.log("BLE: connecting...");
        console.log(JSON.stringify(device));
        ble.connect(device.id, connected,
            function(arg) {
                console.log("BLE: Could not connect/Connection lost");
                console.log(arg);
                $scope.connectedTo = false;
                $state.go('ble-disconnected');
                $scope.mvDevice = false;
                $scope.$apply();
            }
        );
    }

    function send()
    {
        console.log("BLE: sending:" + $scope.inputCommand.text);
        if ($scope.inputCommand.text && $scope.inputCommand.text != "" && $scope.connectedTo) {
            ble.write($scope.connectedTo.id, $scope.mvDevice.uuid_service,
                      $scope.mvDevice.uuid_tx, stringToBytes($scope.inputCommand.text + "\n"),
                function() {
                    console.log("BLE: sent:" + $scope.inputCommand.text);
                },
                function(arg) {
                    console.log("BLE: could not sent command");
                    console.log(arg);
                }
            );
        }
    }

    function clearRxBuff()
    {
        $scope.rxBuff = [];
    }

    $scope.scan = scan;
    $scope.connect = connect;
    $scope.disconnect = disconnect;
    $scope.send = send;
    $scope.clearRxBuff = clearRxBuff;
})

// Controller used for testing the gui
.controller("mvble-controller-gui-test",
function($scope, $state, $ionicScrollDelegate, rxBuff_max_size, mv_devices) {
    if (!$scope.devices) $scope.devices = [];
    if (!$scope.connectedTo) $scope.connectedTo = false;
    if (!$scope.mvDevice) $scope.mvDevice = false;
    if (!$scope.inputCommand) $scope.inputCommand = {};
    if (!$scope.rxBuff) $scope.rxBuff = [];

    function scan()
    {
        $scope.devices = [
            {"name":"ET Cable Replacement Demo",
             "id":"00:07:80:7F:4D:0B",
             "advertising":{},
             "rssi":-36},
            {"name":"Movuino",
             "id":"FD:5D:4D:ED:2A:97",
             "advertising":{},
             "rssi":-64}
        ];
    }
    function connect(device)
    {
        $scope.connectedTo = device;
        $state.go('ble-connected');
        $scope.mvDevice = mv_devices[0];

    }
    function disconnect()
    {
        $scope.connectedTo = false;
        $state.go('ble-disconnected');
        $scope.mvDevice = false;
    }
    function send()
    {
        $scope.count++;
        $scope.rxBuff.push($scope.inputCommand.text + "\n");
        $ionicScrollDelegate.scrollBottom();
    }
    function clearRxBuff()
    {
        $scope.rxBuff = [];
    }

    $scope.scan = scan;
    $scope.connect = connect;
    $scope.disconnect = disconnect;
    $scope.send = send;
    $scope.clearRxBuff = clearRxBuff;
})

.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/')

    $stateProvider
    .state('ble-disconnected', {
        url: '/',
        templateUrl: 'ble-disconnected.html'
    })
    .state('ble-connected', {
        url: '/',
        templateUrl: 'ble-connected.html'
    })
})
