// This is a Node.js script to listen for UDP packets from the hardware
// and forward them to the Next.js application's API endpoint.
// It also exposes functions to be called by the Next.js app to configure hardware.

// To run this script:
// 1. Open a new terminal in your project's root directory.
// 2. Run `node udp-listener.js`

const dgram = require('dgram');
const http = require('http');
const fs = require('fs');
const ini = require('ini');

// --- Configuration ---
const LISTENER_PORT = 41234; // The port this listener will bind to.
const HARDWARE_PORT = 1234; // The port to send commands to on the hardware.
const BROADCAST_ADDRESS = '192.168.0.255'; // Use the correct broadcast address for your network.
const API_HOST = 'localhost';
const API_PORT = 9002;
const API_PATH = '/api/parser';
const TIMEOUT = 5000;

// Frame Constants
const FRAME_HEADER = 0x80;
const FRAME_FOOTER = 0xFF;
const FRAME_ACK_HEADER = 0x81;

// Request Types
const REQ_SET_DEVICE_IP = 0x01;
const REQ_GET_DEVICE_IP = 0x02;
const REQ_SET_SLAVE_ID = 0x03;
const REQ_GET_SLAVE_ID = 0x04;
const REQ_DATA_FRAME = 0x05;

let Current_DeviceID = 0x00; // This can be dynamically updated

// --- Helper Functions ---
function calculateChecksum(dataFrame) {
    // Sum all bytes except the checksum and footer
    const totalSum = dataFrame.slice(0, 53).reduce((a, b) => a + b, 0);
    return totalSum & 0xFF; // Return last 8 bits
}

function sendUdpCommand(frame, targetIp = BROADCAST_ADDRESS, targetPort = HARDWARE_PORT) {
    return new Promise((resolve, reject) => {
        const socket = dgram.createSocket('udp4');
        socket.bind(() => {
            socket.setBroadcast(true);
        });

        const buffer = Buffer.from(frame);
        socket.send(buffer, 0, buffer.length, targetPort, targetIp, (err) => {
            if (err) {
                console.error(`Error sending UDP packet to ${targetIp}:${targetPort}`, err);
                socket.close();
                return reject(err);
            }
            console.log(`UDP packet sent to ${targetIp}:${targetPort}`);
            socket.close();
            resolve();
        });
    });
}

function postToApi(data) {
    const postData = JSON.stringify(data);
    const options = {
        hostname: API_HOST,
        port: API_PORT,
        path: API_PATH,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
        },
    };

    const req = http.request(options, (res) => {
        let responseBody = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
            console.log(`API response status: ${res.statusCode}`);
            console.log(`API response body: ${responseBody}`);
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with API request: ${e.message}`);
    });

    req.write(postData);
    req.end();
}


// --- Main Logic ---

// Listen for incoming data frames from hardware
const dataListener = dgram.createSocket('udp4');

dataListener.on('error', (err) => {
    console.log(`UDP listener error:\n${err.stack}`);
    dataListener.close();
});

dataListener.on('message', (msg, rinfo) => {
    console.log(`\n--- Received UDP Data Frame from ${rinfo.address}:${rinfo.port} ---`);
    const receivedBytes = Array.from(msg);
    
    if (receivedBytes.length < 6 || receivedBytes[0] !== FRAME_HEADER || receivedBytes[receivedBytes.length-1] !== FRAME_FOOTER) {
        console.error('Received invalid or malformed data frame.');
        return;
    }
    
    if (receivedBytes[1] !== REQ_DATA_FRAME) {
        console.log('Received a command response, not a data frame. Ignoring in this listener.');
        return;
    }

    // Pass the raw hex string to the parser API
    const frameString = msg.toString('hex');
    console.log(`Forwarding Raw Frame to API: ${frameString}`);
    postToApi([frameString]); // The parser API expects an array of frame strings
});

dataListener.on('listening', () => {
    const address = dataListener.address();
    console.log(`UDP data listener started. Listening on ${address.address}:${address.port}`);
    console.log('---------------------------------------------------------');
});

dataListener.bind(LISTENER_PORT);


// --- Functions to be called from the Next.js backend ---

async function setDeviceIDAndIP(newDeviceId, ipAddress) {
    console.log(`--- Configuring Device ID: ${newDeviceId}, IP: ${ipAddress.join('.')} ---`);
    let frame = new Array(55).fill(0);
    
    frame[0] = FRAME_HEADER;
    frame[1] = REQ_SET_DEVICE_IP;
    frame[2] = Current_DeviceID; // Source device ID, 0x00 for broadcast
    frame[3] = parseInt(newDeviceId);
    
    for (let i = 0; i < 4; i++) {
        frame[4 + i] = ipAddress[i];
    }
    
    frame[53] = calculateChecksum(frame);
    frame[54] = FRAME_FOOTER;
    
    await sendUdpCommand(frame);
    console.log("Set Device ID/IP command sent.");

    // Here you would typically listen for a response to confirm success.
    // For now, we'll assume it works and update the local config.
    try {
        const config = ini.parse(fs.readFileSync('ini_ip.ini', 'utf-8'));
        const targetBlock = `BLOCK_${newDeviceId}`; // e.g. BLOCK_A
        if (!config[targetBlock]) {
            config[targetBlock] = {};
        }
        config[targetBlock]['block_id'] = newDeviceId;
        config[targetBlock]['ip_address'] = ipAddress.join('.');
        fs.writeFileSync('ini_ip.ini', ini.stringify(config));
        console.log(`ini_ip.ini updated for ${targetBlock}.`);
        return { success: true, message: `Device ${newDeviceId} configured.` };
    } catch (e) {
        console.error("Error updating ini file:", e);
        return { success: false, error: "Failed to update config file." };
    }
}

async function setSlaveID(deviceId, slaveId, floorCount) {
    console.log(`--- Configuring Slave ID: ${slaveId} for Device: ${deviceId} ---`);
    let frame = new Array(55).fill(0);

    frame[0] = FRAME_HEADER;
    frame[1] = REQ_SET_SLAVE_ID;
    frame[2] = parseInt(deviceId);
    frame[3] = parseInt(slaveId);
    frame[4] = parseInt(floorCount);
    
    frame[53] = calculateChecksum(frame);
    frame[54] = FRAME_FOOTER;

    // We need to know the specific IP of the device to send this command
    let targetIp = BROADCAST_ADDRESS;
    try {
        const config = ini.parse(fs.readFileSync('ini_ip.ini', 'utf-8'));
        const targetBlockKey = Object.keys(config).find(key => config[key].block_id === deviceId);
        if (targetBlockKey && config[targetBlockKey].ip_address) {
            targetIp = config[targetBlockKey].ip_address;
        } else {
             console.warn(`IP for Device ${deviceId} not found in ini file, using broadcast.`);
        }
    } catch (e) {
        console.error("Could not read ini file to find IP, using broadcast.", e);
    }
    
    await sendUdpCommand(frame, targetIp);
    console.log(`Set Slave ID command sent to ${targetIp}.`);
    
    // Again, assume success and update config
     try {
        const config = ini.parse(fs.readFileSync('ini_ip.ini', 'utf-8'));
        const targetBlockKey = Object.keys(config).find(key => config[key].block_id === deviceId);
        if (targetBlockKey) {
            const elevatorKey = `elevator_${slaveId}`;
            config[targetBlockKey][elevatorKey] = slaveId;
            config[targetBlockKey][`${elevatorKey}_floor_count`] = floorCount;
            fs.writeFileSync('ini_ip.ini', ini.stringify(config));
            console.log(`ini_ip.ini updated for slave ${slaveId} in ${targetBlockKey}.`);
            return { success: true, message: `Slave ${slaveId} configured.` };
        } else {
            return { success: false, error: `Device ${deviceId} not found in config.` };
        }
    } catch (e) {
        console.error("Error updating ini file:", e);
        return { success: false, error: "Failed to update config file." };
    }
}


// --- HTTP Server to receive commands from Next.js backend ---
const commandServer = http.createServer(async (req, res) => {
    if (req.url === '/api/configure-device' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const { action, payload } = JSON.parse(body);
                let result;

                if (action === 'set_device') {
                    const { deviceId, ipAddress } = payload;
                    const ipParts = ipAddress.split('.').map(Number);
                    result = await setDeviceIDAndIP(deviceId, ipParts);
                } else if (action === 'set_slave') {
                    const { deviceId, slaveId, floorCount } = payload;
                    result = await setSlaveID(deviceId, slaveId, floorCount);
                } else {
                    result = { success: false, error: 'Invalid action' };
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));

            } catch (error) {
                console.error("Error processing command request:", error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const COMMAND_PORT = 9003; // A separate port for the command server
commandServer.listen(COMMAND_PORT, () => {
    console.log(`Command server listening on http://localhost:${COMMAND_PORT}`);
});

module.exports = {
    setDeviceIDAndIP,
    setSlaveID
};
