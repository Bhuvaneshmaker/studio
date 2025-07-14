
'use server';

import { NextResponse } from 'next/server';
import http from 'http';

const COMMAND_HOST = 'localhost';
const COMMAND_PORT = 9003; // The port the udp-listener's command server is running on.

async function sendCommandToListener(data: object): Promise<any> {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);

        const options = {
            hostname: COMMAND_HOST,
            port: COMMAND_PORT,
            path: '/api/configure-device',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
            },
        };

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                responseBody += chunk;
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseBody));
                } catch (e) {
                    reject(new Error(`Failed to parse response from listener: ${responseBody}`));
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with command request to listener: ${e.message}`);
            reject(new Error(`Could not connect to the hardware listener script. Is it running?`));
        });

        req.write(postData);
        req.end();
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, payload } = body;

        if (!action || !payload) {
            return NextResponse.json({ error: 'Missing action or payload.' }, { status: 400 });
        }
        
        const result = await sendCommandToListener({ action, payload });

        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json({ error: result.error || 'Command failed.' }, { status: 500 });
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        console.error("Error in /api/configure-device:", errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
