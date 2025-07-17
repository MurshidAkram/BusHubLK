const os = require('os');

const getLocalIPAddress = () => {
  const interfaces = os.networkInterfaces();
  
  // Priority order for network interfaces
  const priorityOrder = ['Wi-Fi', 'Ethernet', 'en0', 'eth0', 'wlan0'];
  
  // First, try to find interfaces in priority order
  for (const interfaceName of priorityOrder) {
    if (interfaces[interfaceName]) {
      for (const iface of interfaces[interfaceName]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
  
  // Fallback: find any non-internal IPv4 address
  for (const interfaceName of Object.keys(interfaces)) {
    for (const iface of interfaces[interfaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  // Final fallback
  return 'localhost';
};

const getDynamicBaseURL = () => {
  const ip = getLocalIPAddress();
  const port = process.env.PORT || 5000;
  
  // Always use HTTP for development to avoid SSL issues
  // In production, you should use HTTPS
  if (process.env.NODE_ENV === 'production') {
    return process.env.BACKEND_URL || `https://${ip}:${port}`;
  }
  
  // For development, always use HTTP
  return `http://${ip}:${port}`;
};

module.exports = {
  getLocalIPAddress,
  getDynamicBaseURL
};
