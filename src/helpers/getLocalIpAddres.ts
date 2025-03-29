import os from "os";

export function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName of Object.keys(interfaces)) {
    const interfaceInfo = interfaces[interfaceName];
    if (interfaceInfo) {
      for (const iface of interfaceInfo) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
  return "localhost"; // Fallback to localhost if no IP is found
}