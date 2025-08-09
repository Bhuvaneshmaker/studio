
// This is a Node.js script to listen for UDP packets from the hardware
// and forward them to the Next.js application's API endpoint.
// It also exposes functions to be called by the Next.js app to configure hardware.

const dgram = require('dgram');
const http = require('http');
const fs = require('fs');
const ini = require('ini');
const path = require('path');

// --- Configuration ---
const HARDWARE_PORT = 1234; // The single port for all UDP communication.
const API_HOST = 'localhost';
const API_PORT = 9002; // Default Next.js dev port
const API_PATH_PARSER = '/api/parser';
const API_PATH_ELEVATORS = '/api/elevators';
const INI_FILE_PATH = path.join(__dirname, 'ini_ip.ini');
const POLLING_INTERVAL_MS = 2000; // Poll hardware every 2 seconds.
const DISCOVERY_BROADCAST_IP = '255.255.255.255';
const DISCOVERY_MESSAGE = 'ELEVATEMS_DISCOVERY_REQUEST';

// Frame Constants
const FRAME_HEADER = 0x80;
const FRAME_FOOTER = 0xFF;

// Request Types
const REQ_SET_DEVICE_IP = 0x01;
const REQ_GET_SLAVE_ID_DATA = 0x04;
const REQ_DATA_FRAME = 0x05;
const REQ_SET_SLAVE_ID = 0x03;


// --- Helper Functions ---

/**
 * Ensures the INI configuration file exists, creating an empty one if not.
 */
function ensureIniFileExists() {
  if (!fs.existsSync(INI_FILE_PATH)) {
    try {
      fs.writeFileSync(INI_FILE_PATH, '; ElevateMS Hardware Configuration\n', 'utf-8');
      console.log(`Created empty config file at: ${INI_FILE_PATH}`);
    } catch (error) {
       console.error("FATAL: Could not create ini_ip.ini file.", error);
       process.exit(1);
    }
  }
}

/**
 * Sends a UDP command frame to a target IP and port.
 * @param {Buffer} buffer - The buffer to send.
 * @param {string} targetIp - The destination IP address.
 * @param {number} targetPort - The destination port.
 */
function sendUdpCommand(buffer, targetIp, targetPort = HARDWARE_PORT) {
    return new Promise((resolve, reject) => {
        const socket = dgram.createSocket('udp4');
        const isBroadcast = targetIp === DISCOVERY_BROADCAST_IP;

        socket.on('error', (err) => {
            console.error(`Socket error for ${targetIp}:${targetPort}:`, err);
            socket.close();
            reject(err);
        });

        const send = () => {
            socket.send(buffer, 0, buffer.length, targetPort, targetIp, (err) => {
                socket.close();
                if (err) return reject(err);
                resolve();
            });
        };
        
        if (isBroadcast) {
             socket.bind(() => {
                socket.setBroadcast(true);
                send();
            });
        } else {
            send();
        }
    });
}


/**
 * Posts data to the Next.js application's internal API.
 * @param {object} data - The JSON payload to send.
 * @param {string} apiPath - The API endpoint path.
 */
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
const dataListener = dgram.createSocket('udp4');

dataListener.on('error', (err) => {
    console.log(`UDP listener error:\n${err.stack}`);
    dataListener.close();
});

dataListener.on('message', async (msg, rinfo) => {
    console.log(`Received UDP message from ${rinfo.address}:${rinfo.port}`);
    // Check for auto-discovery message first.
    if (Buffer.from(DISCOVERY_MESSAGE).equals(msg)) {
        console.log(`Discovery: Received discovery request from new device at ${rinfo.address}`);
        await handleNewDeviceDiscovery(rinfo.address);
        return;
    }
    
    // Regular data frame processing
    const receivedBytes = Array.from(msg);
    if (receivedBytes[0] === FRAME_HEADER && receivedBytes[1] === REQ_DATA_FRAME) {
        // Forward valid data frames to the application's parser API
        postToApi(receivedBytes, API_PATH_PARSER)
            .catch(err => console.error("Error posting frame to API:", err.message));
    } else {
        // console.log(`Received unhandled frame type 0x${receivedBytes[1].toString(16)} from ${rinfo.address}`);
    }
});


dataListener.on('listening', () => {
    const address = dataListener.address();
    console.log(`UDP data listener started. Listening on ${address.address}:${address.port}`);
    console.log('---------------------------------------------------------');
});


// --- Hardware Polling ---

/**
 * Periodically sends a request to all configured hardware blocks to get their status.
 */
async function pollHardware() {
    try {
        const config = ini.parse(fs.readFileSync(INI_FILE_PATH, 'utf-8'));
        
        for (const blockKey of Object.keys(config)) {
            const block = config[blockKey];
            if (block.ip_address && block.block_id) {
                // Frame to request data from all slaves on the block
                const frame = [
                    FRAME_HEADER,
                    REQ_GET_SLAVE_ID_DATA,
                    parseInt(block.block_id, 10), // Device ID as number
                    0, // Checksum placeholder
                    FRAME_FOOTER
                ];
                
                const checksum = (frame[0] + frame[1] + frame[2]) & 0xFF;
                frame[3] = checksum;
                const buffer = Buffer.from(frame);

                await sendUdpCommand(buffer, block.ip_address, HARDWARE_PORT)
                    .catch(err => {
                        if (err.code === 'ENETUNREACH' || err.code === 'EHOSTUNREACH') {
                            console.warn(`Hardware Poll Warning: Block '${block.block_id}' (${block.ip_address}) is unreachable.`);
                        } else {
                            console.error(`Hardware Poll Error: Failed to send poll command to ${block.ip_address}.`, err);
                        }
                    });
            }
        }
    } catch (error) {
        console.error("Hardware Poll: Error reading INI file or polling devices.", error.message);
    }
}


// --- Command Functions & Auto-Discovery ---

/**
 * Handles the auto-discovery and configuration of a new hardware device.
 * @param {string} deviceIp - The IP address of the newly discovered device.
 */
async function handleNewDeviceDiscovery(deviceIp) {
    try {
        const config = ini.parse(fs.readFileSync(INI_FILE_PATH, 'utf-8'));
        
        const isKnownIp = Object.values(config).some(block => block.ip_address === deviceIp);
        if (isKnownIp) {
            console.log(`Discovery: Device at ${deviceIp} is already configured. Ignoring.`);
            return;
        }

        const existingIds = Object.values(config).map(b => parseInt(b.block_id, 10) || 0).filter(id => id > 0);
        let nextId = 101;
        while(existingIds.includes(nextId)) {
            nextId++;
        }
        const newDeviceId = nextId.toString();
        const newDeviceName = `Block ${newDeviceId}`;

        console.log(`Discovery: Assigning new Block ID '${newDeviceId}' to device at ${deviceIp}`);

        // 1. Send configuration to the new hardware device
        const result = await setDeviceConfig(newDeviceId, newDeviceName, deviceIp);
        if (!result.success) {
            throw new Error(result.error || `Failed to send configuration to new device.`);
        }

        // 2. Add the new (empty) block to the application state via API
        const newBlockPayload = {
            deviceId: newDeviceId,
            deviceName: newDeviceName,
            ipAddress: deviceIp,
            slaves: [], // No slaves initially
        };
        await postToApi(newBlockPayload, API_PATH_ELEVATORS);

        console.log(`Discovery: Successfully added and configured new Block ${newDeviceId} at ${deviceIp}.`);

    } catch (error) {
        console.error("Auto-Discovery Error:", error.message);
    }
}

/**
 * Configures a device's ID and IP, then updates the local INI file.
 * @param {string} deviceId - The new Device ID to assign (e.g., '101', '102').
 * @param {string} deviceName - The friendly name for the device.
 * @param {string} ipAddress - The IP address of the device.
 */
async function setDeviceConfig(deviceId, deviceName, ipAddress) {
    console.log(`--- Configuring Device ID: ${deviceId}, Name: ${deviceName}, IP: ${ipAddress} ---`);
    const ipParts = ipAddress.split('.').map(Number);
    const frame = new Array(55).fill(0);
    
    frame[0] = FRAME_HEADER;
    frame[1] = REQ_SET_DEVICE_IP;
    frame[2] = 0x00; // From Device ID 0 for initial configuration
    frame[3] = parseInt(deviceId, 10);
    frame[4] = ipParts[0];
    frame[5] = ipParts[1];
    frame[6] = ipParts[2];
    frame[7] = ipParts[3];
    
    // Checksum is sum of bytes 0-52
    const checksum = frame.slice(0, 53).reduce((acc, byte) => acc + byte, 0) & 0xFF;
    frame[53] = checksum;
    frame[54] = FRAME_FOOTER;
    const buffer = Buffer.from(frame);
    
    try {
        // Broadcast the set command so the unconfigured device can receive it
        await sendUdpCommand(buffer, DISCOVERY_BROADCAST_IP);
        console.log("Set Device ID/IP command broadcasted.");

        // Update the local config file
        const config = ini.parse(fs.readFileSync(INI_FILE_PATH, 'utf-8'));
        const targetBlock = `BLOCK_${deviceId}`;
        config[targetBlock] = {
            block_id: deviceId,
            block_name: deviceName,
            ip_address: ipAddress
        };
        fs.writeFileSync(INI_FILE_PATH, ini.stringify(config));
        console.log(`ini_ip.ini updated for ${targetBlock}.`);
        return { success: true, message: `Device ${deviceId} configured.` };
    } catch (e) {
        console.error("Error during setDeviceConfig:", e.message);
        return { success: false, error: `Failed to configure device or update config file: ${e.message}` };
    }
}

/**
 * Configures a slave (elevator) on a specific device, then updates the local INI file.
 * @param {string} deviceId - The device ID of the parent block.
 * @param {string} slaveId - The new slave ID to assign.
 * @param {number} floorCount - The number of floors for this slave.
 */
async function setSlaveConfig(deviceId, slaveId, floorCount) {
    console.log(`--- Configuring Slave ID: ${slaveId} for Device: ${deviceId} with ${floorCount} floors ---`);
    const frame = new Array(7).fill(0);

    frame[0] = FRAME_HEADER;
    frame[1] = REQ_SET_SLAVE_ID;
    frame[2] = parseInt(deviceId, 10);
    frame[3] = parseInt(slaveId, 10);
    frame[4] = parseInt(floorCount, 10);
    
    const checksum = (frame[0] + frame[1] + frame[2] + frame[3] + frame[4]) & 0xFF;
    frame[5] = checksum;
    frame[6] = FRAME_FOOTER;
    const buffer = Buffer.from(frame);

    try {
        const config = ini.parse(fs.readFileSync(INI_FILE_PATH, 'utf-8'));
        const targetBlockKey = Object.keys(config).find(key => config[key].block_id === deviceId);
        if (!targetBlockKey || !config[targetBlockKey].ip_address) {
            throw new Error(`IP for Device ${deviceId} not found in ini file.`);
        }
        
        await sendUdpCommand(buffer, config[targetBlockKey].ip_address);
        console.log(`Set Slave ID command sent to ${config[targetBlockKey].ip_address}.`);
        
        const existingElevatorKeys = Object.keys(config[targetBlockKey]).filter(k => k.startsWith('elevator_') && !k.endsWith('_floor_count'));
        const newElevatorNum = existingElevatorKeys.length + 1;
        const elevatorKey = `elevator_${newElevatorNum}`;

        config[targetBlockKey][elevatorKey] = slaveId;
        config[targetBlockKey][`${elevatorKey}_floor_count`] = floorCount;
        fs.writeFileSync(INI_FILE_PATH, ini.stringify(config));
        console.log(`ini_ip.ini updated for slave ${slaveId} in ${targetBlockKey}.`);
        return { success: true, message: `Slave ${slaveId} configured.` };
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
                    const { deviceId, deviceName, ipAddress } = payload;
                    result = await setDeviceConfig(deviceId, deviceName, ipAddress);
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
// Bind the listener and enable broadcast receiving.
dataListener.bind(HARDWARE_PORT, '0.0.0.0', () => {
    dataListener.setBroadcast(true);
});
// Start polling immediately and then on an interval
pollHardware();
setInterval(pollHardware, POLLING_INTERVAL_MS);
