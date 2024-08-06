import {
	Platform,
	Alert,
	Linking,
	StyleProp,
	TextStyle,
	PermissionsAndroid,
  } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from '@react-native-community/geolocation';

const requestLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "This app needs access to your location to function properly.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
		console.log('Location permission for bluetooth scanning granted');
		return true;
	  } else {
		console.log('Location permission for bluetooth scanning revoked');
		return false;
	  }
	} catch (err) {
	  console.warn(err);
	  return false;
	}
};

const requestPermissions = async () => {
	if (Platform.OS === 'ios') {
	  return true;
	}
  
	if (Platform.OS === 'android') {
	  const apiLevel = parseInt(Platform.Version.toString(), 10);
  
	  if (apiLevel < 31) {
		const locationGranted = await requestLocationPermission();
		if (!locationGranted) {
		  return false;
		}
	  }
  
	  const bluetoothPermissions = [
		PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
		PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
	  ];
  
	  const results = await PermissionsAndroid.requestMultiple(bluetoothPermissions);
  
	  return (
		results['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
		results['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
	  );
	}
  
	return true;
  };

const checkLocationEnabled = async () => {
	try {
		const authStatus = await Geolocation.requestAuthorization();
		if (authStatus !== 'granted') {
		  Alert.alert(
			'Location Services Disabled',
			'Please enable location services to continue.',
			[{ text: 'OK' }]
		  );
		  return false;
		}
		return true;
	  } catch (error) {
		console.error('Error checking location services:', error);
		return false;
	  }
};

const openLocationSettings = () => {
	if (Platform.OS === 'android') {
		Linking.openSettings().catch(() => {
		  Alert.alert("Cannot Open Settings", "Unable to open location settings.");
		});
	  } else if (Platform.OS === 'ios') {
		Linking.openURL('app-settings:').catch(() => {
		  Alert.alert("Cannot Open Settings", "Unable to open location settings.");
		});
	  }
};

const useBluetooth = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const manager = new BleManager();

  useEffect(() => {
    const checkBluetooth = async () => {
		handleLocationServicesCheck();
		const locationEnabled = await checkLocationEnabled();
		if (!locationEnabled) {
		  console.log("Location services are not enabled, cannot scan devices.");
		  return;
		}
	
		const hasPermissions = await requestPermissions();
		if (!hasPermissions) {
		  Alert.alert("Error", "Bluetooth permissions are required");
		  return;
		}
  
		const checkPermission = async () => {
		  const hasRequestedPermission = await AsyncStorage.getItem('hasRequestedLocationPermission');
		  if (hasRequestedPermission !== 'true') {
			const hasPermission = await requestLocationPermission();
			await AsyncStorage.setItem('hasRequestedLocationPermission', 'true');
			console.log('Permission granted:', hasPermission);
		  }
		};
	
		const bluetoothState = await manager.state();
		if (bluetoothState !== "PoweredOn") {
		  await manager.enable();
		}
  
		checkPermission();
		scanDevicesPeriodically();
    };

    checkBluetooth();

    const subscription = manager.onStateChange((state) => {
		if (state === "PoweredOff") {
			Alert.alert("Bluetooth is turned off", "Please turn on Bluetooth to continue scanning for devices.");
		  } else if (state === "PoweredOn" && !scanning) {
			handleLocationServicesCheck();
			scanDevicesPeriodically();
			subscription.remove();
		  }
    }, true);

    return () => {
      subscription.remove();
      manager.stopDeviceScan();
    };
  }, []);

  const scanDevicesPeriodically = () => {
	if (!scanning) {
		setScanning(true);
		const scan = () => {
		  manager.startDeviceScan(null, null, (error, device) => {
			if (error) {
			  console.warn(error);
			  setScanning(false);
			  return;
			}
			if (device) {
			  setDevices((prevDevices) => {
				const deviceIndex = prevDevices.findIndex(
				  (d) => d.id === device.id
				);
				if (deviceIndex === -1) {
				  return [
					...prevDevices,
					{ ...device, status: "unpaired (free)" },
				  ];
				} else {
				  const updatedDevices = [...prevDevices];
				  updatedDevices[deviceIndex] = {
					...device,
					status: updatedDevices[deviceIndex].status,
				  };
				  return updatedDevices;
				}
			  });
			}
		  });
  
		  setTimeout(() => {
			manager.stopDeviceScan();
			setScanning(false);
		  }, 3000);
		};
   
		scan();
		const intervalId = setInterval(scan, 5000);
		return () => clearInterval(intervalId);
	  }
  };

  const saveDeviceStatuses = async (devices: Device[]) => {
    try {
		await AsyncStorage.setItem("devices", JSON.stringify(devices));
	  } catch (error) {
		console.error("Failed to save devices", error);
		Alert.alert("Error", "Failed to save device statuses");
	  }
  };

  const updateDeviceStatus = (deviceId: string, status: string) => {
    setDevices((prevDevices) => {
		const updatedDevices = prevDevices.map((device) =>
		  device.id === deviceId ? { ...device, status } : device
		);
		saveDeviceStatuses(updatedDevices);
		return updatedDevices;
	  });
  };

  const handleLocationServicesCheck = async () => {
	try {
	  const isLocationEnabled = await checkLocationEnabled();
	  if (!isLocationEnabled) {
		Alert.alert(
		  "Location Services Disabled",
		  "Please enable location services to continue.",
		  [{ text: "OK" }]
		);
	  } else {

	}
	} catch (error) {
	  console.error("An error occurred while checking location services:", error);
	}
  };

  const handlePair = async (deviceId: string) => {
    const deviceIndex = devices.findIndex((d) => d.id === deviceId);
    if (deviceIndex === -1) {
      Alert.alert("Error", "Device not found");
      return;
    }

    updateDeviceStatus(deviceId, "connecting");

    try {
      const connectedDevice = await manager.connectToDevice(deviceId);
      await connectedDevice.discoverAllServicesAndCharacteristics();

      updateDeviceStatus(deviceId, "connected");
    } catch (error) {
      Alert.alert("Error", `Failed to connect to device: ${error.message}`);
      updateDeviceStatus(deviceId, "unpaired (free)");
    }
  };

  const handleUnpair = async (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) {
      Alert.alert("Error", "Device not found");
      return;
    }

    try {
      await manager.cancelDeviceConnection(deviceId);
      updateDeviceStatus(deviceId, "disconnected (paired)");
    } catch (error) {
      Alert.alert(
        "Error",
        `Failed to disconnect from device: ${error.message}`
      );
      // Optionally reset to previous state or handle error differently
    }
  };

  return {
    devices,
    scanning,
    scanDevicesPeriodically,
    handlePair,
    handleUnpair,
  };
};

export {
  useBluetooth,
  requestLocationPermission,
  checkLocationEnabled,
  openLocationSettings,
};
