import {
  Image,
  ScrollView,
  StyleSheet,
  Platform,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useState, useEffect } from "react";
import { BleManager } from "react-native-ble-plx";

import { requestPermissions } from "./../../permissions";

const Scanning = () => {
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const manager = new BleManager();

  const initializeBluetooth = async () => {
    const hasPermissions = await requestPermissions();
    console.log({ hasPermissions });
    if (hasPermissions) {
      setScanning(true);
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.log(error);
          setScanning(false);
          return;
        }
        if (device && device.name) {
          setDevices((prevDevices) => {
            if (!prevDevices.some((dev) => dev.id === device.id)) {
              return [...prevDevices, device];
            }
            return prevDevices;
          });
        }
      });

      setTimeout(() => {
        manager.stopDeviceScan();
        setScanning(false);
      }, 5000);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ paddingVertical: 100, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={initializeBluetooth} disabled={scanning}>
          <Text style={{ fontSize: 18, color: scanning ? "gray" : "blue" }}>
            {scanning ? "Scanning..." : "Scan"}
          </Text>
        </TouchableOpacity>
        {devices.map((device) => (
          <View key={device.id} style={{ marginTop: 10 }}>
            <Text>ID: {device.id}</Text>
            <Text>Name: {device.name}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default Scanning;