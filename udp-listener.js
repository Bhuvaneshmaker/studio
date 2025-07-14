
// This is a Node.js script to listen for UDP packets from the hardware
// and forward them to the Next.js application's API endpoint.
// It also exposes functions to be called by the Next.js app to configure hardware.

const dgram = require('dgram');
const http = require('http');
const fs = require('fs');
const ini = require('ini');
const path = require('path');

// --- Configuration ---
const LISTENER_PORT = 41234; // The port this listener will bind to.
const HARDWARE_PORT = 1234; // The port to send commands to on the hardware.
const BROADCAST_ADDRESS = '192.168.0.255'; // Use the correct broadcast address for your network.
const API_HOST = 'localhost';
const API_PORT = 9002;
const API_PATH = '/api/parser';
const INI_FILE_PATH = path.join(__dirname, 'ini_ip.ini');


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

let Current_DeviceID = 0x00; // This can be dynamically updated for broadcast commands

// --- Helper Functions ---
function calculateChecksum(bytes) {
    // The checksum is a simple sum of all bytes, overflowing at 255 (uint8_t).
    const sum = bytes.reduce((acc, byte) => acc + byte, 0);
    return sum & 0xFF; // Return only the last 8 bits.
}

function sendUdpCommand(frame, targetIp = BROADCAST_ADDRESS, targetPort = HARDWARE_PORT) {
    return new Promise((resolve, reject) => {
        const socket = dgram.createSocket('udp4');
        socket.bind(() => {
            socket.setBroadcast(targetIp === BROADCAST_ADDRESS);
        });

        const buffer = Buffer.from(frame);
        socket.send(buffer, 0, buffer.length, targetPort, targetIp, (err) => {
            if (err) {
                console.error(`Error sending UDP packet to ${targetIp}:${targetPort}`, err);
                socket.close();
                return reject(err);
            }
            console.log(`UDP command packet sent to ${targetIp}:${targetPort}`);
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
            if (res.statusCode >= 400) {
                 console.error(`API response status: ${res.statusCode} | body: ${responseBody}`);
            } else {
                 console.log(`API response status: ${res.statusCode} | body: ${responseBody}`);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with API request: ${e.message}`);
    });

    req.write(postData);
    req.end();
}


// --- Main Logic: Data Listener ---

const dataListener = dgram.createSocket('udp4');

dataListener.on('error', (err) => {
    console.log(`UDP listener error:\n${err.stack}`);
    dataListener.close();
});

dataListener.on('message', (msg, rinfo) => {
    console.log(`\n--- Received UDP Packet from ${rinfo.address}:${rinfo.port} ---`);
    const receivedBytes = Array.from(msg);
    
    // Check for data frames (type 0x05)
    if (receivedBytes[1] === REQ_DATA_FRAME) {
        if (receivedBytes.length < 6 || receivedBytes[0] !== FRAME_HEADER || receivedBytes[receivedBytes.length-1] !== FRAME_FOOTER) {
            console.error('Received invalid or malformed data frame.');
            return;
        }
        
        const frameString = msg.toString('hex');
        console.log(`Forwarding Raw Data Frame to API: ${frameString}`);
        postToApi([frameString]); // The parser API expects an array of frame strings
    } else {
        console.log("Received a command ACK or other non-data frame. Ignoring.")
    }

});

dataListener.on('listening', () => {
    const address = dataListener.address();
    console.log(`UDP data listener started. Listening on ${address.address}:${address.port}`);
    console.log('---------------------------------------------------------');
});

dataListener.bind(LISTENER_PORT);


// --- Command Functions ---

async function setDeviceConfig(deviceId, ipAddress) {
    console.log(`--- Configuring Device ID: ${deviceId}, IP: ${ipAddress} ---`);
    let frame = new Array(55).fill(0);
    
    frame[0] = FRAME_HEADER;
    frame[1] = REQ_SET_DEVICE_IP;
    frame[2] = Current_DeviceID; // Source device ID, 0x00 for broadcast
    frame[3] = deviceId.charCodeAt(0); // Assuming single letter IDs like 'A'
    
    const ipParts = ipAddress.split('.').map(Number);
    for (let i = 0; i < 4; i++) {
        frame[4 + i] = ipParts[i];
    }
    
    frame[53] = calculateChecksum(frame.slice(0, 53));
    frame[54] = FRAME_FOOTER;
    
    await sendUdpCommand(frame);
    console.log("Set Device ID/IP command sent.");

    // Update the local config file
    try {
        const config = ini.parse(fs.readFileSync(INI_FILE_PATH, 'utf-8'));
        const targetBlock = `BLOCK_${deviceId}`;
        if (!config[targetBlock]) {
            config[targetBlock] = {};
        }
        config[targetBlock]['block_id'] = deviceId;
        config[targetBlock]['ip_address'] = ipAddress;
        fs.writeFileSync(INI_FILE_PATH, ini.stringify(config));
        console.log(`ini_ip.ini updated for ${targetBlock}.`);
        return { success: true, message: `Device ${deviceId} configured.` };
    } catch (e) {
        console.error("Error updating ini file:", e);
        return { success: false, error: "Failed to update config file." };
    }
}

async function setSlaveConfig(deviceId, slaveId, floorCount) {
    console.log(`--- Configuring Slave ID: ${slaveId} for Device: ${deviceId} with ${floorCount} floors ---`);
    let frame = new Array(55).fill(0);

    frame[0] = FRAME_HEADER;
    frame[1] = REQ_SET_SLAVE_ID;
    frame[2] = deviceId.charCodeAt(0);
    frame[3] = parseInt(slaveId, 10);
    frame[4] = parseInt(floorCount, 10);
    
    frame[53] = calculateChecksum(frame.slice(0, 53));
    frame[54] = FRAME_FOOTER;

    let targetIp = BROADCAST_ADDRESS; // Default to broadcast
    try {
        const config = ini.parse(fs.readFileSync(INI_FILE_PATH, 'utf-8'));
        const targetBlockKey = `BLOCK_${deviceId}`;
        if (config[targetBlockKey] && config[targetBlockKey].ip_address) {
            targetIp = config[targetBlockKey].ip_address;
        } else {
             console.warn(`IP for Device ${deviceId} not found in ini file, using broadcast.`);
        }
    } catch (e) {
        console.error("Could not read ini file to find IP, using broadcast.", e);
    }
    
    await sendUdpCommand(frame, targetIp);
    console.log(`Set Slave ID command sent to ${targetIp}.`);
    
     try {
        const config = ini.parse(fs.readFileSync(INI_FILE_PATH, 'utf-8'));
        const targetBlockKey = `BLOCK_${deviceId}`;
        if (config[targetBlockKey]) {
            const elevatorKey = `elevator_${slaveId}`;
            config[targetBlockKey][elevatorKey] = slaveId;
            config[targetBlockKey][`${elevatorKey}_floor_count`] = floorCount;
            fs.writeFileSync(INI_FILE_PATH, ini.stringify(config));
            console.log(`ini_ip.ini updated for slave ${slaveId} in ${targetBlockKey}.`);
            return { success: true, message: `Slave ${slaveId} configured.` };
        } else {
             throw new Error(`Device block [${targetBlockKey}] not found in config.`);
        }
    } catch (e) {
        console.error("Error updating ini file:", e);
        return { success: false, error: "Failed to update config file." };
    }
}


// --- HTTP Server to receive commands from Next.js backend ---
const commandServer = http.createServer(async (req, res) => {
    if (req.url === '/api/command' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const { action, payload } = JSON.parse(body);
                let result;
                console.log(`Received command: ${action}`, payload);

                if (action === 'set_device') {
                    const { deviceId, ipAddress } = payload;
                    result = await setDeviceConfig(deviceId, ipAddress);
                } else if (action === 'set_slave') {
                    const { deviceId, slaveId, floorCount } = payload;
                    result = await setSlaveConfig(deviceId, slaveId, floorCount);
                } else {
                    result = { success: false, error: 'Invalid action' };
                }

                if (result.success) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: result.error }));
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Internal server error';
                console.error("Error processing command request:", errorMessage);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: errorMessage }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const COMMAND_PORT = 9003; // A separate port for the command server
commandServer.listen(COMMAND_PORT, () => {
    console.log(`Command server listening for UI commands on http://localhost:${COMMAND_PORT}`);
});
