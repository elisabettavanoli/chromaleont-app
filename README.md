# 🦎 Chromaleont

**A robotic companion that teaches children to care through silent communication.**

Chromaleont is an interactive robotic companion developed as part of the **DH2400 Physical Interaction Design and Realization** course at KTH. It explores how non-verbal interaction can encourage children to recognize another's needs, respond with care, and develop empathy. Inspired by chameleons, Chromaleont communicates through color-coded light and physical interactions rather than words. Children observe its signals and respond with actions such as covering it, feeding it, or playing with it.

The project combines physical interaction design, embedded systems, and human-computer interaction.

🔗 **[Explore the Chromaleont design process on
Miro](https://miro.com/app/board/uXjVHrfB984=/?share_link_id=532543412802)**

> **Project status:** The repository includes the web application prototype and embedded firmware. The web app currently uses simulated device connection; communication between the app and the physical robot is not yet implemented.

------------------------------------------------------------------------

## 🎨 The Robot

### States and Interactions

Chromaleont uses color and physical interaction to express its needs. Each state is associated with a signal and an action that the child can perform to respond to the robot's needs.

| State | Color | Interaction | Sensor or mechanism |
|---|---|---|---|
| Hungry | Red 🔴| Feed the robot with a physical leaf | Magnetic sensor and e-textile leaf |
| Playful | Green 🟢| Pet the horn and press the tail to make it move | Pressure sensor and inflatable tail |
| Cold | Blue 🔵 | Cover or warm the robot | Light sensor |
| Sleepy | Purple 🟣 | Turn off the lights | Light sensor |
| Socialisation | Yellow 🟡 | Bring another Chromaleont close to the robot | Hall sensor and magnet |
| Charging | Orange 🟠 | Recharge the robot | USB-C connection |

The colors and interactions described below represent the intended behavior in the final design (some of them are still under implementation).

### Physical Design

-   **Horn and inflatable tail:** Pressing the horn activates the
    inflatable tail, creating a playful physical response.
-   **Magnetic feeding leaf:** A leaf containing a magnet activates a
    reed switch inside the robot's mouth to simulate feeding.
-   **Fabric cover:** Can be placed over the robot to simulate warming
    it by changing the light reaching the LDR.
-   **Internal power bank:** Supplies power to the robot's electronics.

### Hardware Components

| Component | Purpose |
|---|---|
| Seeed Studio XIAO RP2040 | Processes sensor inputs and controls the robot's outputs |
| Addressable RGB LED strip | Communicates the robot's states through color-coded light patterns |
| Force-sensitive resistor (FSR) | Detects pressure on the robot's horn, triggering the inflatable tail |
| Light-dependent resistor (LDR) | Detects changes in light levels when the robot is covered |
| Magnetic reed switch | Detects the magnetic feeding leaf near the robot's mouth |
| Hall effect sensor *(proposed)* | Could detect the proximity of another Chromaleont robot through a magnet, triggering a rainbow light effect to encourage social interaction |
| Capacitive touch sensors *(proposed)* | Could detect touch interactions on specific parts of the robot's body, enabling additional ways to interact with it |
| USB-C charging port *(proposed)* | Could provide a dedicated charging interface for the robot |

The current robot is powered by an internal USB power bank. The Hall effect sensor, capacitive touch sensors, and USB-C charging port are proposed additions, not part of the documented current implementation.

------------------------------------------------------------------------

## 🧩 System Architecture

Chromaleont consists of three complementary parts:

-   **Physical robot:** The tangible interface, with sensors, color-changing LEDs, and interactive elements.
-   **Embedded software:** C++ firmware using the Arduino framework, running on the Seeed Studio XIAO RP2040. It reads the FSR, LDR, and magnetic reed switch, manages robot states, and controls the LED strip using the Adafruit NeoPixel library. The firmware is located in [`firmware/arduino/Chromaleont_Firmware.ino`](./firmware/arduino/Chromaleont_Firmware.ino).
-   **Application:** A parent-facing interface for controlling the robot's color and configuring daily routines. The frontend is built with React and TypeScript. Capacitor provides the native Android application environment, while a Bluetooth Serial plugin handles Bluetooth Classic communication.

> **Current integration status:** Android-to-robot Bluetooth communication is implemented, while automatic execution of app-configured routines by the physical robot is not yet integrated.
------------------------------------------------------------------------

## 💻 Application

The Chromaleont application allows parents to personalize their child's experience with the robot, control its behavior, and plan daily interactions. For example, a parent can configure a routine in which Chromaleont expresses hunger at 12:30 PM, encouraging the child to recognize the signal and feed the robot.

### Live Control

The Live Control page allows parents to interact with Chromaleont in real time.

- Turn the robot on or off.
- Select and activate the available states: Cold, Hungry, and Playful.
- View the selected state and its associated color.
- Check whether the robot is connected and whether commands are being sent successfully.

### Daily Routines

The Daily Routines section allows parents to plan interactions throughout the day, helping integrate Chromaleont into the child's daily activities.

- Schedule a state or color for a specific time.
- Create, edit, and delete routines.
- Enable or disable individual routines or the entire schedule.
- View scheduled interactions on a daily timeline.

Routines are saved in the application. However, their automatic execution by the physical robot is not yet available.

### Device Settings

The Device Settings section allows parents to manage the connection between the application and Chromaleont.

- Find available paired devices.
- Connect to or disconnect from the robot.
- Check the connection status.
- Test whether the application can communicate with the robot.
- View diagnostic information to help identify connection problems.

The physical robot can currently be controlled through the Android application. Bluetooth-based control is not available through the standard web or PWA version.

------------------------------------------------------------------------

## 🛠️ Technology Stack

### Web Application

- **React** — UI components and application state
- **TypeScript** — Type-safe development
- **Vite** — Development server and production builds
- **React Router** — Client-side navigation
- **Vitest** — Automated testing
- **React Testing Library** — Component and interaction testing
- **vite-plugin-pwa** — PWA configuration
- **CSS** — Responsive styling and animations
- **Capacitor** — Native Android application integration
- **Bluetooth Serial plugin** — Communication with the physical robot from Android

### Embedded Software

- **C++ / Arduino framework** — Firmware development
- **Seeed Studio XIAO RP2040** — Microcontroller
- **Adafruit NeoPixel** — Addressable LED control

------------------------------------------------------------------------

## 🚀 Getting Started

These instructions explain how to set up and run the web application locally. For Bluetooth control of the physical robot, use the native Android application.

### Prerequisites

- [Node.js](https://nodejs.org/) and npm
- Android Studio and a compatible Android device (for Android development and Bluetooth testing)

### Installation

```bash
git clone https://github.com/elisabettavanoli/chromaleont-app.git
cd chromaleont-app
npm install
```

### Run Locally

Start the development server:

```bash
npm run dev
```

Open the local URL shown in the terminal to access the application in your browser.

### Build the Web Application

To generate the production build, run:

```bash
npm run build
```

### Run on Android

The repository includes a Capacitor Android project. After installing the dependencies, synchronize the web application with the Android project:

```bash
npx cap sync android
```

Then open the project in Android Studio:

```bash
npx cap open android
```

Build and run the application on a compatible Android device using Android Studio.

To test Bluetooth communication, ensure that the robot is powered on and paired with the Android device through the device's Bluetooth settings.

------------------------------------------------------------------------

## 📚 Project Resources

-   **Design process:** [Chromaleont Miro
    Board](https://miro.com/app/board/uXjVHrfB984=/?share_link_id=532543412802)
-   **Source code:** [Chromaleont on
    GitHub](https://github.com/elisabettavanoli/chromaleont-app)
