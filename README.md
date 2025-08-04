
# ElevateMS: Real-Time Elevator Management System

ElevateMS is a modern, web-based application designed for real-time monitoring and management of an entire elevator network. Built with Next.js, it provides a dynamic and responsive interface for tracking elevator status, managing system faults, and configuring hardware devices.

## Core Features

-   **Real-Time Dashboard:** A high-level overview of the entire elevator network, showing active units, maintenance status, and system alerts.
-   **Detailed Elevator View:** Drill down into the status of individual elevators, with real-time updates on floor position, direction, power status, and more.
-   **Hardware Block Management:** View and manage logical groupings of elevators (blocks), with at-a-glance status indicators for each block.
-   **Auto-Discovery:** Automatically detect, configure, and add new hardware controllers to the system as soon as they are connected to the network.
-   **Manual Configuration:** A user-friendly interface for manually adding and configuring new hardware blocks and their associated elevators (slaves).
-   **Data Frame Parser:** A diagnostic tool for manually parsing raw hexadecimal data frames from hardware, aiding in debugging and verification.
-   **Role-Based Access Control:** Simple user management system with 'Admin' and 'User' roles to control access to sensitive functions.

## Technical Stack

-   **Framework:** Next.js (with App Router)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **UI Components:** ShadCN UI
-   **Real-time Communication:** Node.js UDP Listener (`udp-listener.js`)
-   **Icons:** Lucide React

---

For instructions on how to run the application and the hardware listener, please see `HOW_TO_RUN.md`.

For a guide on testing the hardware communication using a tool like Packet Sender, please see `TESTING_GUIDE.md`.
