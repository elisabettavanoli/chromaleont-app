#include <Adafruit_NeoPixel.h>
#include <math.h>

// =============================================================
// PIN CONFIGURATION (Seeed XIAO RP2040)
// =============================================================

const int PRESSURE_PIN = A0;   // D0: Force-sensitive resistor (FSR)
const int LIGHT_PIN    = A1;   // D1: Light-dependent resistor (LDR)
const int REED_PIN     = D2;   // D2: Magnetic reed switch
const int STRIP_PIN    = D10;  // D10: NeoPixel data input

// Bluetooth RN-42 / serial Bluetooth connection:
// Module TXD -> XIAO D7 (RX)
// Module RXD -> XIAO D6 (TX)
const unsigned long BLUETOOTH_BAUD = 115200;

const int NUM_LEDS         = 30;
const int STRIP_BRIGHTNESS = 50;

Adafruit_NeoPixel strip(
  NUM_LEDS,
  STRIP_PIN,
  NEO_GRB + NEO_KHZ800
);

// =============================================================
// COLOR DEFINITIONS
// =============================================================

const uint32_t COLOR_OFF     = 0;
const uint32_t COLOR_COLD    = strip.Color(130, 215, 255);
const uint32_t COLOR_HUNGRY  = strip.Color(248, 0, 0);
const uint32_t COLOR_PLAYFUL = strip.Color(50, 240, 20);

// =============================================================
// SENSOR CALIBRATION THRESHOLDS
// =============================================================

// LDR (A1):
// Dark: values strictly greater than 20.
// Light: values less than or equal to 20.
const int LIGHT_DARK_THRESHOLD = 20;

// FSR (A0):
// Pressed: values less than or equal to 150.
// Released: values greater than or equal to 180.
const int STROKE_PRESS_THRESHOLD   = 150;
const int STROKE_RELEASE_THRESHOLD = 180;

const bool REED_ACTIVE_LOW = true;

// =============================================================
// TIMING PARAMETERS (milliseconds)
// =============================================================

const unsigned long NEED_TIMEOUT_MS       = 10000;
const unsigned long COLD_HOLD_REQUIRED_MS = 3000;
const unsigned long BLINK_INTERVAL        = 200;
const unsigned long FADE_STEP_MS          = 15;
const unsigned long LOG_TELEMETRY_MS      = 400;

const int STROKES_REQUIRED_COUNT = 6;
const unsigned long STROKE_MIN_PRESS_MS = 180;

// =============================================================
// STATE MACHINE
// =============================================================

enum SystemPhase {
  IDLE_NEUTRAL,
  NEED_ACTIVE,
  NEED_ALERT,
  RESOLVING_FADE
};

enum NeedType {
  NEED_NONE,
  NEED_COLD,
  NEED_HUNGRY,
  NEED_PLAYFUL
};

SystemPhase currentPhase = IDLE_NEUTRAL;
NeedType currentNeed = NEED_NONE;

unsigned long stateStartTime = 0;
unsigned long lastBlinkTime  = 0;
unsigned long lastLogTime    = 0;

bool blinkState = true;

// =============================================================
// COLD NEED MANAGEMENT
// =============================================================

unsigned long coldHoldAccumulated = 0;
unsigned long lastColdContactTime = 0;
unsigned long lastColdLoop = 0;

// =============================================================
// PLAYFUL NEED: STROKE DETECTION
// =============================================================

enum GreenStrokePhase {
  G_IDLE,
  G_PRESSED,
  G_WAIT_LIFT
};

GreenStrokePhase greenFSM = G_IDLE;

int strokeCount = 0;
unsigned long strokePhaseStartTime = 0;

// =============================================================
// RGB FADE MANAGEMENT
// =============================================================

uint8_t curR = 0;
uint8_t curG = 0;
uint8_t curB = 0;

uint8_t targetR = 0;
uint8_t targetG = 0;
uint8_t targetB = 0;

unsigned long lastFadeTime = 0;

// =============================================================
// BLUETOOTH COMMANDS
// =============================================================
// P -> PONG: connection test
// 0 -> NULL: reset the robot to the idle state
// 1 -> COLD: activate the cold need
// 2 -> HUNGRY: activate the hunger need
// 3 -> PLAYFUL: activate the play need

bool isRobotCommand(char c) {
  return (
    c == '0' ||
    c == '1' ||
    c == '2' ||
    c == '3'
  );
}

// =============================================================
// STATE AND NEED NAMES
// =============================================================

const char* getPhaseName(SystemPhase phase) {
  switch (phase) {
    case IDLE_NEUTRAL:
      return "IDLE (NULL)";

    case NEED_ACTIVE:
      return "NEED_ACTIVE";

    case NEED_ALERT:
      return "NEED_ALERT (LAMPEGGIANTE)";

    case RESOLVING_FADE:
      return "RESOLVING_FADE";

    default:
      return "UNKNOWN";
  }
}

const char* getNeedName(NeedType need) {
  switch (need) {
    case NEED_COLD:
      return "COLD [Azzurro - Coperta per 3s]";

    case NEED_HUNGRY:
      return "HUNGRY [Rosso - Foglia magnetica]";

    case NEED_PLAYFUL:
      return "PLAYFUL [Verde - 6 Carezze sul dorso]";

    default:
      return "NULL (NESSUN BISOGNO)";
  }
}

uint32_t getColorForNeed(NeedType need) {
  switch (need) {
    case NEED_COLD:
      return COLOR_COLD;

    case NEED_HUNGRY:
      return COLOR_HUNGRY;

    case NEED_PLAYFUL:
      return COLOR_PLAYFUL;

    default:
      return COLOR_OFF;
  }
}

// =============================================================
// SENSOR INTERPRETATION
// =============================================================

bool isDarkValue(int lightValue) {
  return lightValue > LIGHT_DARK_THRESHOLD;
}

bool isPressureDetected(int pressureValue) {
  return pressureValue <= STROKE_PRESS_THRESHOLD;
}

bool isPressureReleased(int pressureValue) {
  return pressureValue >= STROKE_RELEASE_THRESHOLD;
}

// =============================================================
// LED MANAGEMENT
// =============================================================

void applySolidColor(uint32_t color) {
  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, color);
  }

  strip.show();
}

// =============================================================
// ACTIVATE A NEED
// =============================================================

void triggerNeed(NeedType need) {
  currentNeed = need;
  currentPhase = NEED_ACTIVE;

  stateStartTime = millis();

  strokeCount = 0;
  greenFSM = G_IDLE;
  strokePhaseStartTime = 0;

  coldHoldAccumulated = 0;
  lastColdContactTime = 0;
  lastColdLoop = millis();

  blinkState = true;
  lastBlinkTime = millis();

  uint32_t color = getColorForNeed(currentNeed);

  curR = (uint8_t)(color >> 16);
  curG = (uint8_t)(color >> 8);
  curB = (uint8_t)color;

  applySolidColor(color);

  Serial.println();
  Serial.println("=======================================================");
  Serial.print("[TRIGGER] ATTIVATO BISOGNO: ");
  Serial.println(getNeedName(currentNeed));
  Serial.println("=======================================================");
}

// =============================================================
// RESET THE ROBOT: COMMAND 0 (NULL)
// =============================================================

void resetRobot() {
  currentPhase = IDLE_NEUTRAL;
  currentNeed = NEED_NONE;

  strokeCount = 0;
  greenFSM = G_IDLE;
  strokePhaseStartTime = 0;

  coldHoldAccumulated = 0;
  lastColdContactTime = 0;
  lastColdLoop = millis();

  curR = 0;
  curG = 0;
  curB = 0;

  targetR = 0;
  targetG = 0;
  targetB = 0;

  blinkState = true;

  applySolidColor(COLOR_OFF);

  Serial.println("\n[MANUAL] NULL: robot riportato allo stato IDLE.");
}

// =============================================================
// PROCESS A ROBOT COMMAND
// =============================================================

void processCommand(char c) {
  switch (c) {
    case '0':
      resetRobot();
      break;

    case '1':
      triggerNeed(NEED_COLD);
      break;

    case '2':
      triggerNeed(NEED_HUNGRY);
      break;

    case '3':
      triggerNeed(NEED_PLAYFUL);
      break;
  }
}

// =============================================================
// HANDLE BLUETOOTH INPUT
// =============================================================

void handleBluetooth() {
  while (Serial1.available() > 0) {
    uint8_t receivedByte = (uint8_t)Serial1.read();
    char c = (char)receivedByte;

    Serial.print("[BT RX] Decimal: ");
    Serial.print(receivedByte);

    Serial.print(" | Hex: 0x");

    if (receivedByte < 0x10) {
      Serial.print('0');
    }

    Serial.print(receivedByte, HEX);
    Serial.print(" | Character: ");

    if (receivedByte >= 32 && receivedByte <= 126) {
      Serial.println(c);
    } else {
      Serial.println("(non-printable)");
    }

    if (c == '\r' || c == '\n') {
      Serial.println("[BT] Line ending ignored.");
      continue;
    }

    if (c == 'P') {
  const char* response = "PONG\n";

  Serial.print("[BT TX] Sending: ");
  for (size_t i = 0; response[i] != '\0'; i++) {
    Serial.print("0x");
    if ((uint8_t)response[i] < 0x10) {
      Serial.print('0');
    }
    Serial.print((uint8_t)response[i], HEX);
    Serial.print(' ');
  }
  Serial.println();

  Serial1.print(response);
  continue;
}

    if (isRobotCommand(c)) {
      processCommand(c);

      Serial1.print("ACK:");
      Serial1.println(c);

      Serial.print("[BT] Command executed: ");
      Serial.println(c);
    } else {
      Serial1.println("ERR:UNKNOWN_COMMAND");

      Serial.print("[BT] Unknown command: ");
      Serial.println((int)receivedByte);
    }
  }
}

// =============================================================
// HANDLE USB SERIAL INPUT
// =============================================================

void handleUSBSerial() {
  while (Serial.available() > 0) {
    char c = (char)Serial.read();

    if (c == '\r' || c == '\n') {
      continue;
    }

    if (c == 'P') {
      Serial.println("PONG");
    }
    else if (isRobotCommand(c)) {
      processCommand(c);
    }
  }
}

// =============================================================
// RESOLVE A NEED
// =============================================================

void resolveNeed(const char* reason) {
  Serial.print("\n[CARE CONFIRMED] >>> ");
  Serial.println(reason);

  Serial.println(
    "[FADE] Cura ricevuta con successo! Dissolvenza verso OFF..."
  );

  uint32_t activeColor = getColorForNeed(currentNeed);

  curR = (uint8_t)(activeColor >> 16);
  curG = (uint8_t)(activeColor >> 8);
  curB = (uint8_t)activeColor;

  targetR = 0;
  targetG = 0;
  targetB = 0;

  currentPhase = RESOLVING_FADE;
}

// =============================================================
// UPDATE THE RGB FADE
// =============================================================

void updateColorFade() {
  if (millis() - lastFadeTime < FADE_STEP_MS) {
    return;
  }

  lastFadeTime = millis();
  bool changed = false;

  if (curR < targetR) {
    curR++;
    changed = true;
  }
  else if (curR > targetR) {
    curR--;
    changed = true;
  }

  if (curG < targetG) {
    curG++;
    changed = true;
  }
  else if (curG > targetG) {
    curG--;
    changed = true;
  }

  if (curB < targetB) {
    curB++;
    changed = true;
  }
  else if (curB > targetB) {
    curB--;
    changed = true;
  }

  if (changed) {
    applySolidColor(strip.Color(curR, curG, curB));
  }
  else {
    currentPhase = IDLE_NEUTRAL;
    currentNeed = NEED_NONE;

    applySolidColor(COLOR_OFF);

    Serial.println(
      "\n[FSM] >>> Dissolvenza completata: robot in IDLE (NULL)."
    );

    Serial.println(
      "[FSM] In attesa di comandi seriali (0, 1, 2, 3).\n"
    );
  }
}

// =============================================================
// SETUP
// =============================================================

void setup() {
  pinMode(REED_PIN, INPUT_PULLUP);

  // A0 is read as an analog input.
  // Do not configure the analog FSR pin as INPUT_PULLUP.
  pinMode(PRESSURE_PIN, INPUT);

  analogReadResolution(10);

  strip.begin();
  strip.setBrightness(STRIP_BRIGHTNESS);
  applySolidColor(COLOR_OFF);

  Serial.begin(9600);
  Serial1.begin(BLUETOOTH_BAUD);

  unsigned long usbWaitStart = millis();

  while (!Serial && millis() - usbWaitStart < 3000) {
    // Wait briefly for the USB serial connection.
  }

  Serial.println();
  Serial.println("=======================================================");
  Serial.println("CHROMALEONT - BLUETOOTH ENABLED");
  Serial.println("=======================================================");

  Serial.println("\nUSB SERIAL COMMANDS:");
  Serial.println("  0 = NULL / RESET / OFF");
  Serial.println("  1 = COLD");
  Serial.println("  2 = HUNGRY");
  Serial.println("  3 = PLAYFUL");
  Serial.println("  P = PONG TEST");

  Serial.println("\nBLUETOOTH COMMANDS:");
  Serial.println("  P -> PONG");
  Serial.println("  0 -> NULL / RESET / OFF");
  Serial.println("  1 -> COLD");
  Serial.println("  2 -> HUNGRY");
  Serial.println("  3 -> PLAYFUL");

  Serial.print("\nBluetooth UART initialized at ");
  Serial.print(BLUETOOTH_BAUD);
  Serial.println(" baud.");

  Serial.println("\nSensor thresholds:");
  Serial.println("  LDR: dark if value > 20");
  Serial.println("  FSR: pressed if value <= 150");
  Serial.println("  FSR: released if value >= 180");

  Serial.println("Waiting for commands...\n");
}

// =============================================================
// MAIN LOOP
// =============================================================

void loop() {
  unsigned long now = millis();

  // 1. Handle USB and Bluetooth communication.
  handleUSBSerial();
  handleBluetooth();

  // 2. Read sensors.
  int lightVal = analogRead(LIGHT_PIN);
  int pressureVal = analogRead(PRESSURE_PIN);

  bool isDark = isDarkValue(lightVal);
  bool isPressurePressed = isPressureDetected(pressureVal);
  bool isPressureLifted = isPressureReleased(pressureVal);

  bool reedClosed = (digitalRead(REED_PIN) == LOW);
  bool reedTriggered = REED_ACTIVE_LOW ? reedClosed : !reedClosed;

  // 3. Switch to alert state when the timeout expires.
  if (
    currentPhase == NEED_ACTIVE &&
    now - stateStartTime > NEED_TIMEOUT_MS
  ) {
    currentPhase = NEED_ALERT;
    lastBlinkTime = now;
    blinkState = true;

    Serial.println(
      "\n[TIMEOUT SCADUTO] >>> Allarme lampeggiante avviato!"
    );
  }

  // 4. Check whether the current need has been resolved.
  bool careCompleted = false;
  const char* reason = "";

  if (
    currentPhase == NEED_ACTIVE ||
    currentPhase == NEED_ALERT
  ) {
    // ---------------------------------------------------------
    // COLD: blanket detected for 3 seconds.
    // The existing 450 ms interruption tolerance is preserved.
    // ---------------------------------------------------------

    if (currentNeed == NEED_COLD) {
      bool blanketPresent = isDark;

      if (blanketPresent) {
        if (lastColdContactTime > 0) {
          coldHoldAccumulated += now - lastColdLoop;
        }

        lastColdContactTime = now;

        // Blue breathing feedback while the blanket is detected.
        float breathe = (sin(now / 150.0) + 1.0) * 0.15 + 0.7;

        uint8_t r = ((COLOR_COLD >> 16) & 0xFF) * breathe;
        uint8_t g = ((COLOR_COLD >> 8) & 0xFF) * breathe;
        uint8_t b = (COLOR_COLD & 0xFF) * breathe;

        applySolidColor(strip.Color(r, g, b));

        if (coldHoldAccumulated >= COLD_HOLD_REQUIRED_MS) {
          careCompleted = true;
          reason = "Riscaldato con la coperta per 3s continui!";
          coldHoldAccumulated = 0;
        }
      }
      else {
        // Reset accumulated time after a sufficiently long interruption.
        if (now - lastColdContactTime > 450) {
          coldHoldAccumulated = 0;
          lastColdContactTime = 0;
        }
      }

      lastColdLoop = now;
    }

    // ---------------------------------------------------------
    // PLAYFUL: six complete press-and-release cycles.
    // ---------------------------------------------------------

    else if (currentNeed == NEED_PLAYFUL) {
      switch (greenFSM) {
        case G_IDLE:
          if (isPressurePressed) {
            greenFSM = G_PRESSED;
            strokePhaseStartTime = now;

            applySolidColor(COLOR_PLAYFUL);

            Serial.println(
              "\n[ACTION DETECTED] Pressione carezza: verde fisso!"
            );
          }
          break;

        case G_PRESSED:
          // Require the pressure to be maintained for 180 ms.
          if (now - strokePhaseStartTime >= STROKE_MIN_PRESS_MS) {
            greenFSM = G_WAIT_LIFT;

            Serial.println(
              "[STROKE] Passata completata! Rilascia la mano per confermare."
            );
          }
          break;

        case G_WAIT_LIFT:
          if (isPressureLifted) {
            strokeCount++;
            greenFSM = G_IDLE;

            Serial.print("\n[STROKE] >>> PASSATA CONVALIDATA! Totale: ");
            Serial.print(strokeCount);
            Serial.print(" / ");
            Serial.println(STROKES_REQUIRED_COUNT);

            applySolidColor(COLOR_PLAYFUL);

            if (strokeCount >= STROKES_REQUIRED_COUNT) {
              careCompleted = true;
              reason = "Completate 6 carezze complete sul dorso!";
              strokeCount = 0;
            }
          }
          break;
      }
    }

    // ---------------------------------------------------------
    // HUNGRY: magnetic reed switch activated.
    // ---------------------------------------------------------

    else if (currentNeed == NEED_HUNGRY) {
      if (reedTriggered) {
        careCompleted = true;
        reason = "Magnete rilevato sulla bocca (Nutrito)";
      }
    }

    // Start the fade-out when the care has been completed.
    if (careCompleted) {
      resolveNeed(reason);
    }
  }

  // 5. Blink the active need after its timeout.
  if (currentPhase == NEED_ALERT) {
    bool isHandPressing = (
      currentNeed == NEED_PLAYFUL &&
      greenFSM == G_PRESSED
    );

    bool isCovered = (
      currentNeed == NEED_COLD &&
      isDark
    );

    if (!isHandPressing && !isCovered) {
      if (now - lastBlinkTime >= BLINK_INTERVAL) {
        lastBlinkTime = now;
        blinkState = !blinkState;

        applySolidColor(
          blinkState ? getColorForNeed(currentNeed) : COLOR_OFF
        );
      }
    }
  }
  else if (currentPhase == RESOLVING_FADE) {
    updateColorFade();
  }

  // 6. Sensor telemetry every 400 ms.
  if (now - lastLogTime >= LOG_TELEMETRY_MS) {
    lastLogTime = now;

    Serial.print("[STATUS] ");
    Serial.print(getPhaseName(currentPhase));

    if (currentNeed == NEED_PLAYFUL) {
      Serial.print(" | CAREZZE VERDE: ");
      Serial.print(strokeCount);
      Serial.print("/6");

      if (greenFSM == G_WAIT_LIFT) {
        Serial.print(" [ATTESA RILASCIO]");
      }
      else if (greenFSM == G_PRESSED) {
        Serial.print(" [CONTATTO]");
      }
    }
    else if (currentNeed == NEED_COLD && isDark) {
      int prog = min(
        100,
        (int)(
          (coldHoldAccumulated * 100) /
          COLD_HOLD_REQUIRED_MS
        )
      );

      Serial.print(" | COPERTA: ");
      Serial.print(prog);
      Serial.print("%");
    }

    Serial.print(" || LUCE: ");
    Serial.print(lightVal);
    Serial.print(isDark ? " [BUIO]" : " [LUCE]");

    Serial.print(" | PRESSIONE (A0): ");
    Serial.print(pressureVal);

    if (isPressurePressed) {
      Serial.print(" [PRESSIONE]");
    }
    else if (isPressureLifted) {
      Serial.print(" [RILASCIATO]");
    }
    else {
      Serial.print(" [ZONA INTERMEDIA]");
    }

    Serial.print(" | REED: ");
    Serial.println(reedTriggered ? "CHIUSO" : "APERTO");
  }

  delay(15);
}