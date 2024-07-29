import {
  Image,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  Modal,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useState, useEffect } from "react";
import bleManagerInstance, { BleManager } from "react-native-ble-plx";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
  MenuProvider,
} from "react-native-popup-menu";
import { useFonts } from "expo-font";

import { requestPermissions } from "./../../permissions";
import { Colors } from "react-native/Libraries/NewAppScreen";

let manager = new BleManager();

const enableBluetooth = async () => {
  try {
    await manager.enable();
    return true;
  } catch (error) {
    return false;
  }
};

const Scanning = () => {
  const [devices, setDevices] = useState([]);
  // const [devices, setDevices] = useState([
  //   { id: "1", name: "Device name #1", status: "connected" },
  //   { id: "2", name: "Device name #2", status: "connecting" },
  //   { id: "3", name: "Device name #3", status: "disconnected" },
  //   { id: "4", name: "Device name #4", status: "unpaired (free)" },
  //   { id: "5", name: "Device name #5", status: "disconnected (paired)" },
  // ]);
  const [scanning, setScanning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadStoredDeviceStatuses();
    return () => {
    //   if (manager) {
    //     manager.destroy();
    //   }
    };
  }, []);

  const loadStoredDeviceStatuses = async () => {
    try {
      const storedDevices = await AsyncStorage.getItem('devices');
      if (storedDevices) {
        setDevices(JSON.parse(storedDevices));
      }
    } catch (error) {
      console.log('Failed to load device statuses', error);
    }
  };

  const saveDeviceStatuses = async (updatedDevices) => {
    try {
      await AsyncStorage.setItem("devices", JSON.stringify(updatedDevices));
    } catch (error) {
      console.log("Failed to save device statuses", error);
    }
  };

  const initializeBluetooth = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      return;
    }

    const bluetoothState = await manager.state();
    if (bluetoothState !== "PoweredOn") {
      const enabled = await enableBluetooth();
      if (!enabled) {
        Alert.alert("Error", "Bluetooth is not powered on");
        return;
      }
    }

    setScanning(true);
    const discoveredDevices = new Map();

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
        setScanning(false);
        return;
      }
      if (device && device.name) {
        const deviceStatus = devices.find((d) => d.id === device.id) || {
          id: device.id,
          status: "unpaired (free)",
        };
        discoveredDevices.set(device.id, {
          ...device,
          status: deviceStatus.status,
        });
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      const updatedDevices = Array.from(discoveredDevices.values());
      setDevices(updatedDevices);
      saveDeviceStatuses(updatedDevices);
      setScanning(false);
    }, 8000);
  };

  const handleDevicePress = (device) => {
    setSelectedDevice(device);
    setModalVisible(true);
  };

  const handlePair = async (deviceId) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) {
      Alert.alert("Error", "Device not found");
      return;
    }
    try {
      const updatedDevices = devices.map((d) =>
        d.id === deviceId ? { ...d, status: "connecting" } : d
      );
      setDevices(updatedDevices);
      saveDeviceStatuses(updatedDevices);
  
      const connectedDevice = await manager.connectToDevice(deviceId);
      await connectedDevice.discoverAllServicesAndCharacteristics();
  
      const connectedDevices = devices.map((d) =>
        d.id === deviceId ? { ...d, status: "connected" } : d
      );
      setDevices(connectedDevices);
      saveDeviceStatuses(connectedDevices);
    } catch (error) {
      Alert.alert("Error", "Failed to connect to device");
      const updatedDevices = devices.map((d) =>
        d.id === deviceId ? { ...d, status: "disconnected" } : d
      );
      setDevices(updatedDevices);
      saveDeviceStatuses(updatedDevices);
    }
  };
  
  const handleUnpair = async (deviceId) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) {
      Alert.alert("Error", "Device not found");
      return;
    }
  
    try {
      await manager.cancelDeviceConnection(deviceId);
      const updatedDevices = devices.map((d) =>
        d.id === deviceId ? { ...d, status: "unpaired (free)" } : d
      );
      setDevices(updatedDevices);
      saveDeviceStatuses(updatedDevices);
    } catch (error) {
      Alert.alert("Error", "Failed to disconnect from device");
    }
  };

  return (
    <MenuProvider>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>All devices</Text>
        <TouchableOpacity onPress={initializeBluetooth} disabled={scanning}>
          <Text
            style={{
              fontSize: 18,
              marginVertical: 30,
              color: scanning ? "gray" : "green",
            }}
          >
            {scanning ? "Scanning..." : "Scan"}
          </Text>
        </TouchableOpacity>
        {devices
          .filter(device => device.name)
          .map((device) => (
            <TouchableOpacity
              key={device.id}
              style={styles.deviceContainer}
              onPress={() => handleDevicePress(device)}
            >
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>
                  {device.name || `Unknown Device (${device.id})`}
                </Text>
                {/* <Text style={styles.deviceName}>{device.id}</Text> */}
                <Text
                  style={[styles.deviceStatus, getStatusStyle(device.status)]}
                >
                  {device.status}
                </Text>
              </View>
              <Menu>
                <MenuTrigger text="..." customStyles={triggerStyles} />
                <MenuOptions>
                  <View style={styles.menuOptions}>
                    <MenuOption onSelect={() => handlePair(device.id)}>
                      <Text style={[styles.menuOption, { color: "white" }]}>
                        Connect
                      </Text>
                    </MenuOption>
                    {/* <View style={styles.divider}/> */}
                    <MenuOption onSelect={() => handleUnpair(device.id)}>
                      <Text style={{ color: "#F04438" }}>Remove</Text>
                    </MenuOption>
                  </View>
                </MenuOptions>
              </Menu>
            </TouchableOpacity>
          ))}
      </ScrollView>

      {selectedDevice && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Device Details</Text>
            <ScrollView>
              {Object.entries(selectedDevice).map(([key, value]) => (
                <View key={key} style={styles.propertyRow}>
                  <Text style={styles.propertyKey}>{key}:</Text>
                  <Text style={styles.propertyValue}>
                    {JSON.stringify(value, null, 2)}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </MenuProvider>
  );
};

const getStatusStyle = (status) => {
  switch (status) {
    case "unpaired (free)":
      return { color: "gray" };
    case "connecting":
      return { color: "royalblue" };
    case "connected":
      return { color: "#66C61C" };
    case "disconnecting":
      return { color: "gray" };
    case "disconnected (paired)":
      return { color: "#EAECF0" };
    default:
      return {};
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101828",
    padding: 20,
  },
  header: {
    fontSize: 20,
    color: "#FFFFFF",
    marginTop: 50,
    alignSelf: "center",
  },
  deviceContainer: {
    backgroundColor: "#2c2c2e",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    color: "white",
  },
  deviceStatus: {
    fontSize: 14,
    // marginTop: 5,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 24,
    marginBottom: 15,
    textAlign: "center",
  },
  propertyRow: {
    // flexDirection: "row",
    marginBottom: 10,
  },
  propertyKey: {
    fontWeight: "bold",
    marginRight: 5,
  },
  propertyValue: {
    flex: 1,
  },
  menuOptions: {
    flex: 1,
    borderRadius: 10,
    borderColor: "#FCFCFD",
    borderWidth: 1,
    backgroundColor: "#101828",
    padding: 10,
    // color: '#fff'
  },
  MenuOption: {
    fontSize: 16,
  },
});

const triggerStyles = {
  triggerText: {
    fontSize: 18,
    color: "white",
  },
  triggerWrapper: {
    padding: 5,
  },
  triggerTouchable: {
    underlayColor: "darkgray",
    activeOpacity: 70,
  },
};

export default Scanning;
