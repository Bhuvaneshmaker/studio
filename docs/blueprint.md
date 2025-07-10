# **App Name**: ElevateView

## Core Features:

- Real-time Data Ingestion: Real-time Data Fetch: Establish connection with Raspberry Pi to receive elevator status via ethernet in frame format string.
- Data Parsing: Data Parsing: Parse frame format string data from the Raspberry Pi to extract relevant elevator status information such as current floor, direction, and errors.
- Elevator Status Display: Elevator Status Display: Display parsed elevator status information on a ReactJS-based UI.
- Error/Alert Notifications: Error/Alert Notifications: Implement an error-reporting/alert-display mechanism based on parsed status information. It indicates emergency cases when elevators trigger sensor thresholds.

## Style Guidelines:

- Primary color: Deep Blue (#1A237E) to convey reliability and technical precision.
- Background color: Very Light Gray (#F5F5F5) to provide a clean, modern backdrop.
- Accent color: Vivid Cyan (#00BCD4) to highlight critical alerts and interactive elements.
- Font pairing: 'Inter' sans-serif for both headline and body text to create a modern and accessible look.
- Use minimalist, line-based icons to represent elevator functions and status.
- Prioritize clear, information-dense layout for quick status overviews.
- Implement smooth transitions and subtle animations to reflect real-time data updates.