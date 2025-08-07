# How to Run ElevateMS

This guide provides the steps to run the ElevateMS application suite, which includes the main web interface and the hardware listener script.

**You must run these two components in two separate terminals.**

---

### Terminal 1: Run the Web Application

This terminal will run the Next.js user interface and its backend APIs.

1.  **Navigate to the project directory:**
    ```bash
    cd /path/to/your/project
    ```

2.  **Install dependencies (only need to do this once):**
    ```bash
    npm install
    ```

3.  **Start the web server:**
    ```bash
    npm run dev
    ```

4.  The application will now be running. You can access it in your browser at:
    **[http://localhost:9002](http://localhost:9002)**

---

### Terminal 2: Run the Hardware Listener

This script handles all direct communication with the elevator hardware. It must be running for the application to receive real-time data or configure devices.

1.  **Open a new terminal and navigate to the project directory:**
    ```bash
    cd /path/to/your/project
    ```

2.  **Start the listener script using Node.js:**
    ```bash
    node udp-listener.js
    ```

3.  You will see output confirming that the listener is running on port `1234` and the command server is running on port `9003`.

    ```
    Command server listening for UI commands on http://localhost:9003
    UDP data listener started. Listening on 0.0.0.0:1234
    ---------------------------------------------------------
    ```

**With both terminals running, the application is fully operational.**
