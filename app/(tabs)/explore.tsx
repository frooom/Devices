import {
  ScrollView,
  StyleSheet,
  Platform,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { useEffect } from "react";
import { useRouter, useNavigation } from "expo-router";
import { BleManager } from "react-native-ble-plx";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

const manager = new BleManager();

const Details = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { deviceName, deviceId, isConnectable, manufacturerData } =
    useLocalSearchParams();
  console.log({ deviceName, deviceId, isConnectable, manufacturerData });

  useEffect(() => {}, []);

  const handleDisconnect = async () => {
    try {
      await manager.cancelDeviceConnection(deviceId);
      router.back();
      Alert.alert(
        "Disconnected",
        "The device has been disconnected successfully."
      );
    } catch (error) {
      Alert.alert("Error", "Failed to disconnect from the device.");
    }
  };

  return (
    <View style={styles.container}>
      <View>
        <View
          style={{ flexDirection: "row", paddingVertical: 24, marginTop: 24 }}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              console.log("Pressed");
              router.back();
            }}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={"#FFFFFF"}
              style={styles.arrow}
            />
          </TouchableWithoutFeedback>
          <View style={styles.header}>
            <Text style={styles.headerText}>{deviceName}</Text>
          </View>
        </View>

        <View>
          <View style={styles.paramContainer}>
            <Text style={styles.paramKey}>Id</Text>
            <Text style={styles.paramValue}>{deviceId}</Text>
          </View>
          <View style={styles.paramContainer}>
            <Text style={styles.paramKey}>isConnectable</Text>
            <Text style={styles.paramValue}>{isConnectable}</Text>
          </View>
          {manufacturerData && (
            <View style={styles.paramContainer}>
              <Text style={styles.paramKey}>manufacturerData</Text>
              <Text style={styles.paramValue}>{manufacturerData}</Text>
            </View>
          )}
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 34,
          backgroundColor: "#101828",
        }}
      >
        <TouchableOpacity
          onPress={handleDisconnect}
          style={{
            backgroundColor: "#F04438",
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
              fontWeight: '700'
            }}
          >
            Disconnect
            {/* {scanning ? "Scanning..." : "Scan"} */}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101828",
    padding: 20,
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
    fontWeight: '700',
  },
  header: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // marginBottom: 24,
  },
  arrow: {
    position: "absolute",
    left: 10,
    top: 18,
    paddingVertical: 9,
    height: 38,
  },
  deviceContainer: {
    backgroundColor: "#2c2c2e",
    padding: 10,
    marginBottom: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deviceInfo: {
    flex: 1,
    flexWrap: "wrap",
  },
  deviceName: {
    fontSize: 18,
    color: "white",
  },

  paramContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#101828",
    borderRadius: 5,
  },
  paramKey: {
    fontSize: 16,
    color: "#FFF",
    width: "45%",
    fontWeight: '500',
  },
  paramValue: {
    fontSize: 14,
    color: "#FFF",
    width: "45%",
    opacity: 0.75,
    fontWeight: '400',
  },
});

export default Details;
