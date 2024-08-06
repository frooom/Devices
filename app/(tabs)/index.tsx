import {
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleProp,
  TextStyle,
} from "react-native";
import { BleManager } from "react-native-ble-plx";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
  MenuProvider,
} from "react-native-popup-menu";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {useBluetooth} from './../../hooks/useBluetoothManager'


interface Device {
  id: string;
  name: string;
  isConnectable: string;
  manufacturerData: string;
  status:
    | "connected"
    | "connecting"
    | "disconnecting"
    | "unpaired (free)"
    | "disconnected (paired)";
}

interface DeviceMap {
  [id: string]: Device;
}

interface ScanningState {
  devices: Device[];
  scanning: boolean;
  selectedDevice: Device | null;
  modalVisible: boolean;
}

const Scanning = () => {
  const { devices, scanning, handlePair, handleUnpair } = useBluetooth();

  return (
    <MenuProvider style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          paddingVertical: 24,
          marginTop: 24,
          justifyContent: "space-between",
        }}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>All devices</Text>
        </View>
        <Text style={styles.headerText}>{scanning}</Text>
        <TouchableWithoutFeedback
          onPress={() => {
            console.log("Pressed");
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={"#FFFFFF"} />
        </TouchableWithoutFeedback>
      </View>
      {devices
        .filter((device) => device.name)
        .map((device, index) => (
          <View
            key={device.id}
            style={[
              styles.deviceContainer,
              {
                borderBottomEndRadius: index === devices.length - 1 ? 10 : 0,
                borderBottomStartRadius: index === devices.length - 1 ? 10 : 0,
                borderTopStartRadius: index === 0 ? 10 : 0,
                borderTopEndRadius: index === 0 ? 10 : 0,
              },
            ]}
          >
            <View style={styles.deviceInfo}>
              <Link
                href={{
                  pathname: "/explore",
                  params: {
                    deviceName: device.name,
                    deviceId: device.id,
                    isConnectable: device.isConnectable,
                    manufacturerData: device.manufacturerData,
                  },
                }}
              >
                <View>
                  <Text style={styles.deviceName}>
                    {device.name || `Unknown Device (${device.id})`}
                  </Text>
                  <Text
                    style={[styles.deviceStatus, getStatusStyle(device.status)]}
                  >
                    {device.status}
                  </Text>
                </View>
                <Menu>
                  <MenuTrigger text="..." customStyles={triggerStyles} />
                  <MenuOptions customStyles={menuOptionsStyles}>
                    <View style={styles.menuOptions}>
                      <MenuOption onSelect={() => handlePair(device.id)}>
                        <Text style={[styles.menuOption, { color: "white" }]}>
                          Connect
                        </Text>
                      </MenuOption>
                      <MenuOption onSelect={() => handleUnpair(device.id)}>
                        <Text style={[styles.menuOption, { color: "#F04438" }]}>
                          Remove
                        </Text>
                      </MenuOption>
                    </View>
                  </MenuOptions>
                </Menu>
              </Link>
            </View>
          </View>
        ))}
      {/* </View> */}
      {/* <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 34,
          backgroundColor: "#101828",
          justifyContent: "flex-end",
        }}
      >
        <TouchableOpacity
          onPress={checkBluetooth}
          disabled={scanning}
          style={{
            backgroundColor: "#1570EF",
            padding: 16,
            borderRadius: 16,
            borderColor: "#1570EF",
            borderWidth: 1,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              textAlign: "center",
              color: "#FFFFFF",
              lineHeight: 20,
            }}
          >
            {scanning ? "Scanning..." : "Scan"}
          </Text>
        </TouchableOpacity>
      </View> */}
    </MenuProvider>
  );
};

const getStatusStyle = (status: Device["status"]): StyleProp<TextStyle> => {
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
      return { color: "gray" };
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
    flex: 1,
    // marginTop: 48,
    marginBottom: 48,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  deviceContainer: {
    backgroundColor: "#2c2c2e",
    padding: 10,
    marginBottom: 1,
  },

  deviceInfo: {
    // flex: 1,
    width: "100%",
    justifyContent: "space-between",
  },
  deviceName: {
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 20,
    fontWeight: "600",
  },
  deviceStatus: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
  menuOptions: {
    flex: 1,
    borderRadius: 10,
    borderColor: "#FCFCFD",
    borderWidth: 1,
    backgroundColor: "#101828",
  },
  menuOption: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    padding: 10,
  },
});

const triggerStyles = {
  triggerText: {
    fontSize: 18,
    color: "white",
  },
  triggerWrapper: {
    flex: 1,
    padding: 5,
  },
  triggerOuterWrapper: {},
  triggerTouchable: {
    underlayColor: "darkgray",
    activeOpacity: 70,
  },
};

const menuOptionsStyles = {
  optionsContainer: {
    borderRadius: 10,
  },
  optionTouchable: {
    activeOpacity: 70,
  },
};

export default Scanning;
