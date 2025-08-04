
# How to Run ElevateMS

ElevateMS consists of two main parts that must be run simultaneously in separate terminal windows:

1.  **The Next.js Web Application:** This is the user interface you interact with in your browser.
2.  **The UDP Hardware Listener:** This is a Node.js script that acts as the bridge, listening for real-time data from your hardware and handling configuration commands sent from the UI.

---

## Step-by-Step Instructions

### Terminal 1: Run the Web Application

1.  **Navigate to the project directory:**
    ```bash
    cd /path/to/your/project
    ```

2.  **Install dependencies (only needs to be done once):**
    ```bash
    npm install
    ```

3.  **Start the web server:**
    ```bash
    npm run dev
    ```

4.  **Access the application:**
    *   Open your web browser and go to **http://localhost:9002**.

---

### Terminal 2: Run the UDP Hardware Listener

1.  **Navigate to the project directory in a new terminal window:**
    ```bash
    cd /path/to/your/project
    ```

2.  **Start the listener script:**
    ```bash
    node udp-listener.js
    ```

3.  **Monitor the output:**
    *   This terminal will show logs for incoming data packets, hardware polling, and any configuration commands sent from the UI. Keep it running alongside the web application.

---

## System Architecture

Here is a diagram showing how the different parts of the system communicate:

```
+----------------+      (HTTP API)      +--------------------+      (UDP)      +-------------------+
|                | <------------------> |                    | <-------------> |                   |
|   Web Browser  |                      |  Next.js App / API |                 |  Hardware Devices |
| (localhost:9002) |                      |  (localhost:9002)  |                 | (Teensy Boards)   |
|                |                      |                    |                 |                   |
+----------------+                      +---------^----------+                 +----------^--------+
                                                  |                                       |
                                                  | (HTTP Commands)                       | (UDP Real-time Data)
                                                  |                                       |
                                                  v                                       v
                                        +--------------------+
                                        |                    |
                                        | udp-listener.js    |
                                        | (localhost:9003)   |
                                        | (Listening on 41234) |
                                        +--------------------+
```

-   The **Web Browser** talks to the **Next.js App**.
-   The **Next.js App** sends commands to the **udp-listener.js** script via an internal HTTP API.
-   The **udp-listener.js** script sends UDP commands to and receives real-time UDP data from the **Hardware Devices**.
