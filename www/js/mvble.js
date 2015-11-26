angular.module('mvble', [])

.constant("mv_devices",
    [
        {
            name            : "rbl",
            detection_name  : "Movuino",
            uuid_service    : "713d0000-503e-4c75-ba94-3148f18d941e",
            uuid_tx         : "713d0003-503e-4c75-ba94-3148f18d941e",
            uuid_rx         : "713d0002-503e-4c75-ba94-3148f18d941e",
        },
        {
            name            : "v91",
            detection_name  : "ET Cable Replacement Demo",
            uuid_service    : "0bd51666-e7cb-469b-8e4d-2742f1ba77cc",
            uuid_tx         : "e7add780-b042-4876-aae1-112855353cc1",
            uuid_rx         : "e7add780-b042-4876-aae1-112855353cc1",
        },
    ])

// TODO: check if the use of $scope.$apply are correct
.controller("mvble-controller", function($scope, mv_devices) {
    // TODO: check if there is a better place to initialize the scope
    if (!$scope.devices) $scope.devices = [];
    if (!$scope.connectedTo) $scope.connectedTo = false;
    if (!$scope.mvDevice) $scope.mvDevice = false;
    if (!$scope.rxLog) $scope.rxLog = "";
    if (!$scope.inputCommand) $scope.inputCommand = {};

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
        for (var i in mv_devices) {
            console.log("BLE: trying " + mv_devices[i].name);

            if ($scope.connectedTo.name == mv_devices[i].detection_name) {
                console.log("BLE: device detected - " + mv_devices[i].name);
                $scope.mvDevice = mv_devices[i];
                return;
            }
        }

        // Fail
        // If we tried all the mv_devices list and
        // we coudn't find any compatible service, disconnect
        console.log("BLE: connected device is not a Movuino. Disconnecting...");
        ble.disconnect($scope.connectedTo.id,
            function() {
                $scope.connectedTo = false;
                $scope.mvDevice = false;
                $scope.$apply();
            }
        );
    }

    function listenNotifications()
    {
        // Listen to notifications
        ble.startNotification($scope.connectedTo.id, $scope.mvDevice.uuid_service, $scope.mvDevice.uuid_rx,
            function(buffer) {
                var str = bytesToString(buffer);
                console.log("BLE: rx:" + str);
                // Printable html
                // TODO: check this
                str = str.replace(/(?:\r\n|\r|\n)/g, '\n');
                $scope.rxLog = $scope.rxLog + str
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
        ble.connect(device.id, function() {connected(device);},
            function(arg) {
                console.log("BLE: Could not connect/Connection lost");
                console.log(arg);
                $scope.connectedTo = false;
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

    $scope.scan = scan;
    $scope.connect = connect;
    $scope.send = send;
})
