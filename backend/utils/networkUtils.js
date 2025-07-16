const os = require('os');

const getLocalIPAddress = () => {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return 'localhost'; // fallback
};

const getBaseURL = () => {
  const ip = getLocalIPAddress();
  const port = process.env.PORT || 5000;
  return `http://${ip}:${port}`;
};

module.exports = {
  getLocalIPAddress,
  getBaseURL
};
