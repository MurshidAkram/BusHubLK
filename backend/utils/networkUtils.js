const os = require('os');

const getLocalIPAddress = () => {
  const interfaces = os.networkInterfaces();
  
  // Priority order for network interfaces - WiFi first for mobile connectivity
  const priorityOrder = ['WiFi', 'Wi-Fi', 'Wireless LAN adapter WiFi', 'Ethernet', 'en0', 'eth0', 'wlan0'];
  
  // First, try to find interfaces in priority order
  for (const interfaceName of priorityOrder) {
    if (interfaces[interfaceName]) {
      for (const iface of interfaces[interfaceName]) {
        if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('192.168.56')) {
          return iface.address;
        }
      }
    }
  }
  
  // Fallback: find any non-internal IPv4 address (excluding VirtualBox)
  for (const interfaceName of Object.keys(interfaces)) {
    // Skip VirtualBox and similar virtual adapters
    if (interfaceName.includes('VirtualBox') || interfaceName.includes('VMware')) {
      continue;
    }
    
    for (const iface of interfaces[interfaceName]) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('192.168.56')) {
        return iface.address;
      }
    }
  }
  
  // Final fallback
  return 'localhost';
};

const getDynamicBaseURL = () => {
  const port = process.env.PORT || 5000;

  // Always use the hosted backend URL for password reset links
  // This ensures links work from emails regardless of environment
  const hostedUrl = process.env.BACKEND_URL || `http://43.205.127.30:${port}`;

  // For development, also provide local IP option for testing
  if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_IP === 'true') {
    const localIP = getLocalIPAddress();
    return `http://${localIP}:${port}`;
  }

  return hostedUrl;
};

module.exports = {
  getLocalIPAddress,
  getDynamicBaseURL
};
