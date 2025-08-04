
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
const API_HOST = 'localhost';
const API_PORT = 9002; // Default Next.js dev port
const API_PATH_PARSER = '/api/parser';
const API_PATH_ELEVATORS = '/api/elevators';
const INI_FILE_PATH = path.join(__dirname, 'ini_ip.ini');
const POLLING_INTERVAL_MS = 2000; // Poll hardware every 2 seconds.
const DISCOVERY_MESSAGE = 'ELEVATEVIEW_DISCOVERY_REQUEST';

// Frame Constants
const FRAME_HEADER = 0x80;
const FRAME_ACK_HEADER = 0x81;
const FRAME_FOOTER = 0xFF;

// Request Types
const REQ_SET_DEVICE_IP = 0x01;
const REQ_GET_DEVICE_IP = 0x02;
const REQ_SET_SLAVE_ID = 0x03;
const REQ_GET_SLAVE_ID_DATA = 0x04; // This is used to poll for data
const REQ_DATA_FRAME = 0x05;

// --- Helper Functions ---
function calculateChecksum(bytes) {
    // The checksum is a simple sum of all bytes from index 0 up to (but not including) the checksum byte itself.
    const dataForChecksum = bytes.slice(0, 53);
    const sum = dataForChecksum.reduce((acc, byte) => acc + byte, 0);
    return sum & 0xFF; // Return only the last 8 bits.
}

function ensureIniFileExists() {
  if (!fs.existsSync(INI_FILE_PATH)) {
    try {
      fs.writeFileSync(INI_FILE_PATH, '; ElevateView Hardware Configuration\n', 'utf-8');
      console.log(`Created empty config file at: ${INI_FILE_PATH}`);
    } catch (error) {
       console.error("FATAL: Could not create ini_ip.ini file.", error);
       process.exit(1); // Exit if config is not writable
    }
  }
}

function sendUdpCommand(frame, targetIp, targetPort = HARDWARE_PORT) {
     return new Promise((resolve, reject) => {
        const socket = dgram.createSocket('udp4');
        const buffer = Buffer.from(frame);

        socket.on('error', (err) => {
            socket.close();
            reject(err);
        });

        socket.send(buffer, 0, buffer.length, targetPort, targetIp, (err) => {
            if (err) {
                socket.close();
                return reject(err);
            }
            // console.log(`UDP command packet sent to ${targetIp}:${targetPort}`);
            socket.close();
            resolve();
        });
    });
}

function postToApi(data, apiPath) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: apiPath,
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
                try {
                    if (res.statusCode >= 400) {
                       const parsedError = JSON.parse(responseBody);
                       console.error(`API Error (${res.statusCode}) on ${apiPath}: ${parsedError.error || responseBody}`);
                       return reject(new Error(parsedError.error || `API returned status ${res.statusCode}`));
                    }
                    resolve(JSON.parse(responseBody));
                } catch (e) {
                    console.error(`Failed to parse API JSON response from ${apiPath}: ${responseBody}`);
                    reject(e);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with API request to ${apiPath}: ${e.message}`);
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}


// --- Main Logic: Data Listener ---

let dataFrameBatch = [];
let batchTimeout = null;

const dataListener = dgram.createSocket('udp4');

dataListener.on('error', (err) => {
    console.log(`UDP listener error:\n${err.stack}`);
    dataListener.close();
});

dataListener.on('message', async (msg, rinfo) => {
    // Check for auto-discovery message first.
    // Compare the message buffer directly with the discovery string.
    if (Buffer.from(DISCOVERY_MESSAGE).equals(msg)) {
        console.log(`Discovery: Received discovery request from new device at ${rinfo.address}`);
        await handleNewDeviceDiscovery(rinfo.address);
        return;
    }
    
    // Regular data frame processing
    const receivedBytes = Array.from(msg);
    if (receivedBytes[0] === FRAME_HEADER && receivedBytes[1] === REQ_DATA_FRAME) {
        dataFrameBatch.push(msg.toString('hex')); // Send hex string to parser
        if (!batchTimeout) {
            batchTimeout = setTimeout(() => {
                // console.log(`Processing batch of ${dataFrameBatch.length} frames.`);
                postToApi(dataFrameBatch, API_PATH_PARSER)
                    .catch(err => console.error("Error posting frame batch to API:", err.message));
                dataFrameBatch = [];
                batchTimeout = null;
            }, 100); // Batch frames over a 100ms window
        }
    } else if (receivedBytes[0] === FRAME_ACK_HEADER) {
        // This is an ACK, can be handled if needed for command confirmation
        // console.log(`Received ACK from ${rinfo.address}:`, msg.toString('hex'));
    }
});


dataListener.on('listening', () => {
    const address = dataListener.address();
    console.log(`UDP data listener started. Listening on ${address.address}:${address.port}`);
    console.log('---------------------------------------------------------');
});


// --- Hardware Polling ---

async function pollHardware() {
    try {
        const config = ini.parse(fs.readFileSync(INI_FILE_PATH, 'utf-8'));
        const blocks = Object.keys(config);
        
        for (const blockKey of blocks) {
            const block = config[blockKey];
            if (block.ip_address && block.block_id) {
                // Frame to request data from all slaves on the block
                let frame = new Array(55).fill(0);
                frame[0] = FRAME_HEADER;
                frame[1] = REQ_GET_SLAVE_ID_DATA;
                frame[2] = block.block_id.charCodeAt(0); // Device ID of the block we are polling
                frame[53] = calculateChecksum(frame);
                frame[54] = FRAME_FOOTER;

                await sendUdpCommand(frame, block.ip_address, HARDWARE_PORT)
                    .catch(err => {
                        if (err.code === 'ENETUNREACH' || err.code === 'EHOSTUNREACH') {
                            // This is a common, non-critical error if hardware is offline. Log quietly.
                            console.warn(`Hardware Poll Warning: Block '${block.block_id}' (${block.ip_address}) is unreachable.`);
                        } else {
                            // Log other errors more verbosely.
                            console.error(`Hardware Poll: Failed to send poll command to ${block.ip_address}.`, err);
                        }
                    });
            }
        }
    } catch (error) {
        console.error("Hardware Poll: Error reading INI file or polling devices.", error.message);
    }
}


// --- Command Functions & Auto-Discovery ---

async function handleNewDeviceDiscovery(deviceIp) {
    try {
        const config = ini.parse(fs.readFileSync(INI_FILE_PATH, 'utf-8'));
        
        // Check if this IP is already configured
        const isKnownIp = Object.values(config).some(block => block.ip_address === deviceIp);
        if (isKnownIp) {
            console.log(`Discovery: Device at ${deviceIp} is already configured. Ignoring.`);
            return;
        }

        // Determine the next available block ID
        const existingIds = Object.values(config).map(b => (b.block_id || '').charCodeAt(0)).filter(c => c > 0);
        let nextCharCode = 'A'.charCodeAt(0);
        while(existingIds.includes(nextCharCode)) {
            nextCharCode++;
        }
        const newDeviceId = String.fromCharCode(nextCharCode);

        console.log(`Discovery: Assigning new Block ID '${newDeviceId}' to device at ${deviceIp}`);

        // 1. Configure the hardware device itself
        const result = await setDeviceConfig(newDeviceId, deviceIp);
        if (!result.success) {
            throw new Error(result.error || `Failed to send configuration to new device.`);
        }

        // 2. Add the new (empty) block to the application state via API
        const newBlockPayload = {
            deviceId: newDeviceId,
            deviceName: `Block ${newDeviceId}`, // Default name
            ipAddress: deviceIp,
            slaves: [], // No slaves initially, they must be added manually
        };
        await postToApi(newBlockPayload, API_PATH_ELEVATORS);

        console.log(`Discovery: Successfully added and configured new Block ${newDeviceId} at ${deviceIp}.`);

    } catch (error) {
        console.error("Auto-Discovery Error:", error.message);
    }
}

async function setDeviceConfig(deviceId, ipAddress) {
    console.log(`--- Configuring Device ID: ${deviceId}, IP: ${ipAddress} ---`);
    let frame = new Array(55).fill(0);
    
    frame[0] = FRAME_HEADER;
    frame[1] = REQ_SET_DEVICE_IP;
    frame[2] = 0x00; // Source device ID is 0 for initial configuration
    frame[3] = deviceId.charCodeAt(0);
    
    const ipParts = ipAddress.split('.').map(Number);
    for (let i = 0; i < 4; i++) {
        frame[4 + i] = ipParts[i];
    }
    
    frame[53] = calculateChecksum(frame);
    frame[54] = FRAME_FOOTER;
    
    try {
        await sendUdpCommand(frame, ipAddress); // Send directly to the device's IP
        console.log("Set Device ID/IP command sent.");

        // Update the local config file
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
        console.error("Error during setDeviceConfig:", e.message);
        return { success: false, error: `Failed to configure device or update config file: ${e.message}` };
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
    
    frame[53] = calculateChecksum(frame);
    frame[54] = FRAME_FOOTER;

    let targetIp = '';
    try {
        const config = ini.parse(fs.readFileSync(INI_FILE_PATH, 'utf-8'));
        const targetBlockKey = `BLOCK_${deviceId}`;
        if (config[targetBlockKey] && config[targetBlockKey].ip_address) {
            targetIp = config[targetBlockKey].ip_address;
        } else {
             throw new Error(`IP for Device ${deviceId} not found in ini file.`);
        }
    } catch (e) {
        return { success: false, error: `Could not read ini file to find IP: ${e.message}` };
    }
    
    try {
        await sendUdpCommand(frame, targetIp);
        console.log(`Set Slave ID command sent to ${targetIp}.`);
        
        const config = ini.parse(fs.readFileSync(INI_FILE_PATH, 'utf-8'));
        const targetBlockKey = `BLOCK_${deviceId}`;
        if (config[targetBlockKey]) {
            // Find the key for this slave or create a new one
            let elevatorKey = Object.keys(config[targetBlockKey]).find(k => config[targetBlockKey][k] === slaveId && k.startsWith('elevator_'));
            if (!elevatorKey) {
                const existingElevatorKeys = Object.keys(config[targetBlockKey]).filter(k => k.startsWith('elevator_') && !k.endsWith('_floor_count'));
                const nextElevatorNum = existingElevatorKeys.length + 1;
                elevatorKey = `elevator_${nextElevatorNum}`;
            }

            config[targetBlockKey][elevatorKey] = slaveId;
            config[targetBlockKey][`${elevatorKey}_floor_count`] = floorCount;
            fs.writeFileSync(INI_FILE_PATH, ini.stringify(config));
            console.log(`ini_ip.ini updated for slave ${slaveId} in ${targetBlockKey}.`);
            return { success: true, message: `Slave ${slaveId} configured.` };
        } else {
             throw new Error(`Device block [${targetBlockKey}] not found in config.`);
        }
    } catch (e) {
        console.error("Error during setSlaveConfig:", e.message);
        return { success: false, error: `Failed to configure slave or update config file: ${e.message}` };
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
commandServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`FATAL: Port ${COMMAND_PORT} is already in use. Please close the other process or change the COMMAND_PORT.`);
        process.exit(1);
    } else {
        console.error('Command server error:', err);
    }
});

commandServer.listen(COMMAND_PORT, () => {
    console.log(`Command server listening for UI commands on http://localhost:${COMMAND_PORT}`);
});


// --- Startup ---
ensureIniFileExists();
dataListener.bind(LISTENER_PORT);
// Start polling immediately and then on an interval
pollHardware();
setInterval(pollHardware, POLLING_INTERVAL_MS);
