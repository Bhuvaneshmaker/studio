# Hardware Simulation & Testing Guide

This guide explains how to test the ElevateMS application by simulating data from the hardware. This is essential for development and testing when you don't have a physical device connected.

We will use **Packet Sender**, a free utility for sending and receiving network packets.

- **Download Packet Sender:** [https://packetsender.com/](https://packetsender.com/)

---

## 1. How to Simulate Real-Time Data

This simulates a hardware block sending its status to your application.

1.  **Start the ElevateMS application and the `udp-listener.js` script** as described in `HOW_TO_RUN.md`.
2.  Open Packet Sender.
3.  Configure the packet with the following details:
    - **Name:** `Block A Status Update`
    - **ASCII:** (Leave this blank)
    - **HEX:** `80 05 41 01 10 01 02 10 02 70 255` (See **Example Data Frames** below)
    - **Address:** `127.0.0.1` (This is crucial. It sends the packet to your local machine).
    - **Port:** `1234`
    - **Method:** `UDP`
4.  Click **Send**.

Immediately, you should see output in the `udp-listener.js` terminal saying `Received UDP message...`, and the elevators in the ElevateMS dashboard will update their status based on the data you sent.

**If you do not see the "Received UDP message" log in your terminal, it means a firewall is blocking the packet or you are not sending it to the correct address.**

### Example Data Frames

These are pre-calculated HEX strings you can copy and paste into Packet Sender. They represent the data for a block with `deviceId = 'A'` (which is `0x41` in hex).

**All Elevators Idle & OK:**
This frame shows 2 elevators (slave 1 and 2) on Block A. Both are idle at Floor 1.

```
80 05 41 01 10 01 02 10 02 70 255
```

**Elevator 1 Moving UP, Elevator 2 in ERROR:**
This frame shows elevator 1 moving up at floor 5, and elevator 2 in a fault state.

```
80 05 41 01 28 05 02 10 02 98 255
```

---

## 2. "Packet to Pixel": How the Data Flows

Understanding this flow is key to understanding the whole system.

1.  **Packet Sender (The Fake Hardware):** You send a UDP packet containing a hex string to `127.0.0.1:1234`.

2.  **`udp-listener.js` (The Receiver):** The Node.js script is listening on port `1234`. It receives your packet. It doesn't analyze the data itself; its job is to act as a secure bridge.

3.  **Listener -> API (Forwarding):** The listener script takes the raw HEX data and immediately makes an `HTTP POST` request to the Next.js application's internal API endpoint: `http://localhost:9002/api/parser`.

4.  **`/api/parser` (The Decoder):** The Next.js API route receives the raw data. It uses the logic in `src/lib/data-frame-parser.ts` to decode the byte array into meaningful information (e.g., `deviceId: 'A'`, `elevatorNum: 1`, `currentFloor: 5`, `direction: 'UP'`).

5.  **`elevator-service` (The State Manager):** The parser API sends the decoded information to the `elevator-service`, which is the single source of truth for the state of all elevators. It updates the state of the relevant elevator in its in-memory store.

6.  **UI Polls for Data:** The frontend pages (like the dashboard) are constantly polling the `/api/elevators` endpoint every few seconds.

7.  **API Responds with New State:** The `/api/elevators` endpoint reads the latest data from the `elevator-service` and sends the complete, updated list of elevators back to the UI.

8.  **React Re-renders (The Pixel):** The React components on the page receive the new data. They detect a change in state and automatically re-render, showing you the new floor number, status, and direction on your screen.

This entire process happens in a fraction of a second, creating the real-time effect.
