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
| Cold | Blue 🔵 | Cover or warm the robot | Light sensor |
| Sleepy | Purple 🟣 | Turn off the lights | Light sensor |
| Hungry | Red 🔴| Feed the robot with a physical leaf | Magnetic sensor and e-textile leaf |
| Playful | Green 🟢| Pet the horn and press the tail to make it move | Pressure sensor and inflatable tail |
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
-   **Embedded software:** C++ firmware using the Arduino framework, running on the Seeed Studio XIAO RP2040. It reads the FSR, LDR, and magnetic reed switch, manages robot states, and controls the LED strip using the Adafruit NeoPixel library. The firmware is located in [`Chromaleont_Firmware/`](./Chromaleont_Firmware/).
-   **Web application:** A parent-facing interface for controlling the robot's color and configuring daily routines.

Hardware--software integration is a planned next step. Bluetooth communication and execution of app-configured routines by the physical robot are not yet implemented.

------------------------------------------------------------------------

## 💻 Web Application

The Chromaleont web application allows parents to configure interactions
and create daily routines for their child. For example, a parent could
schedule Chromaleont to express hunger at 12:30 PM, prompting the child
to recognize the signal and feed the robot.

The current application runs with a simulated device connection.

### Live Control

-   Turn the simulated robot on or off.
-   Select one of four colors representing its states.
-   Preview the selected color and state.
-   View simulated connection and synchronization status.

### Daily Routines

-   Schedule a state/color at a chosen time.
-   Create, edit, and delete routines.
-   Enable or disable individual routines or the full schedule.
-   View routines on a daily timeline.

Routines are saved in the application, but their execution by the
physical robot is not yet implemented.

### Device Settings and Persistence

-   Simulate connecting to and disconnecting from the robot.
-   View prototype device information, including model, firmware, and
    battery status.
-   Persist settings and routines using browser `localStorage`.

Device information and connection status are simulated. Preferences and
routines are stored locally and are not synchronized across devices.

### Progressive Web App

The web application is a responsive React single-page application with
Progressive Web App (PWA) configuration, designed for mobile and desktop
screens.

------------------------------------------------------------------------

## 🛠️ Technology Stack

### Web Application

-   **React** --- UI components and application state
-   **TypeScript** --- Type-safe development
-   **Vite** --- Development server and production builds
-   **React Router** --- Client-side navigation
-   **Vitest** --- Automated testing
-   **React Testing Library** --- Component and interaction testing
-   **vite-plugin-pwa** --- PWA configuration
-   **CSS** --- Responsive styling and animations

### Embedded Software

-   **C++ / Arduino framework** --- Firmware
-   **Seeed Studio XIAO RP2040** --- Microcontroller
-   **Adafruit NeoPixel** --- Addressable LED control

------------------------------------------------------------------------

## 🚀 Getting Started

These instructions apply to the web application in this repository.

### Prerequisites

Install [Node.js](https://nodejs.org/) and npm.

### Installation

``` bash
git clone https://github.com/elisabettavanoli/chromaleont-app.git
cd chromaleont-app
npm install
```

### Run Locally

``` bash
npm run dev
```

Open the local URL shown in the terminal.

------------------------------------------------------------------------

## 📚 Project Resources

-   **Design process:** [Chromaleont Miro
    Board](https://miro.com/app/board/uXjVHrfB984=/?share_link_id=532543412802)
-   **Source code:** [Chromaleont on
    GitHub](https://github.com/elisabettavanoli/chromaleont-app)
