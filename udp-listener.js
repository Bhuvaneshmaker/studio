// This is a Node.js script to listen for UDP packets from the Teensy hardware
// and forward them to the Next.js application's API endpoint.

// To run this script:
// 1. Open a new terminal in your project's root directory.
// 2. Run `node udp-listener.js`

const dgram = require('dgram');
const http = require('http');

// --- Configuration ---
const UDP_PORT = 41234; // The port this listener will bind to. Your Teensy should send data here.
const API_HOST = 'localhost'; // The host of your Next.js application.
const API_PORT = 9002; // The port your Next.js application is running on.
const API_PATH = '/api/parser'; // The API endpoint we created to handle parsed data.

// Create a UDP socket
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.log(`UDP listener error:\n${err.stack}`);
  server.close();
});

// This function is called whenever a new UDP packet is received.
server.on('message', (msg, rinfo) => {
  console.log(`Received UDP packet from ${rinfo.address}:${rinfo.port}`);
  
  // The message from the Teensy is a buffer of hex values.
  // We convert it to a single hexadecimal string, which our API expects.
  const frameString = msg.toString('hex');
  console.log(`Raw Frame: ${frameString}`);

  // Prepare to send this data to our Next.js backend
  const postData = JSON.stringify([frameString]); // The API expects a JSON array of strings

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

  // Make the HTTP POST request to our app's API
  const req = http.request(options, (res) => {
    console.log(`API response status: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      console.log(`API response body: ${chunk}`);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with API request: ${e.message}`);
  });

  // Write data to request body and end the request
  req.write(postData);
  req.end();
});

server.on('listening', () => {
  const address = server.address();
  console.log(`UDP listener started. Listening on ${address.address}:${address.port}`);
  console.log('---------------------------------------------------------');
  console.log('This script will now wait for data from your hardware.');
  console.log('---------------------------------------------------------');
});

// Bind the UDP server to the specified port
server.bind(UDP_PORT);
