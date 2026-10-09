#include <Adafruit_NeoPixel.h>

// --- PIN CONFIGURATION (Seeed XIAO RP2040) ---
const int PRESSURE_PIN = A0;   // D0: FSR su A0 con Pull-Up interno
const int LIGHT_PIN    = A1;   // D1: LDR Luce (coperta per freddo)
const int REED_PIN     = D2;   // D2: Magnete bocca (foglia per fame)
const int STRIP_PIN    = D10;  // D10: DIN Neopixel

const int NUM_LEDS         = 30;
const int STRIP_BRIGHTNESS = 50;

Adafruit_NeoPixel strip(NUM_LEDS, STRIP_PIN, NEO_GRB + NEO_KHZ800);

// --- COLOR DEFINITIONS ---
const uint32_t COLOR_OFF     = 0;
const uint32_t COLOR_COLD    = strip.Color(130, 215, 255);   // Azzurro Ghiaccio
const uint32_t COLOR_HUNGRY  = strip.Color(248, 0, 0);       // Corallo / Fame
const uint32_t COLOR_PLAYFUL = strip.Color(50, 240, 20);      // Verde chiaro pulito

// --- SOGLIE CALIBRATE SUI TUOI LOG ---
// Con pull-up interno: riposo ~980-1020 | tocco deciso scende sotto 800
const int STROKE_PRESS_THRESHOLD   = 800;  // Pressione netta carezza
const int STROKE_RELEASE_THRESHOLD = 930;  // Rilascio confermato verso il riposo
const int LIGHT_DARK_THRESHOLD     = 960;  // Coperta/buio sotto 960
const bool REED_ACTIVE_LOW         = true;

// --- PARAMETRI TEMPORALI (ms) ---
const unsigned long NEED_TIMEOUT_MS         = 10000; // Scatta l'allarme dopo 10s se ignorato
const unsigned long COLD_HOLD_REQUIRED_MS   = 3000;  // 3s continui di coperta
const unsigned long BLINK_INTERVAL          = 200;   // Velocità flash allarme
const unsigned long FADE_STEP_MS            = 15;
const unsigned long LOG_TELEMETRY_MS        = 400;

const int STROKES_REQUIRED_COUNT = 6; // 6 carezze complete

// --- MACCHINA A STATI FSM ---
enum SystemPhase { IDLE_NEUTRAL, NEED_ACTIVE, NEED_ALERT, RESOLVING_FADE };
enum NeedType    { NEED_NONE, NEED_COLD, NEED_HUNGRY, NEED_PLAYFUL };

SystemPhase currentPhase = IDLE_NEUTRAL;
NeedType    currentNeed  = NEED_NONE;

unsigned long stateStartTime = 0;
unsigned long lastBlinkTime  = 0;
unsigned long lastLogTime    = 0;
bool blinkState = true;

// Gestione Freddo
unsigned long coldHoldAccumulated = 0;
unsigned long lastColdContactTime = 0;

// Gestione Carezze Verde (Pull-up: Idle -> Pressione Bassa -> Rilascio Alto)
enum GreenStrokePhase { G_IDLE, G_PRESSED, G_WAIT_LIFT };
GreenStrokePhase greenFSM = G_IDLE;
int strokeCount = 0;
unsigned long strokePhaseStartTime = 0;

// Dissolvenza RGB
uint8_t curR = 0, curG = 0, curB = 0;
uint8_t targetR = 0, targetG = 0, targetB = 0;
unsigned long lastFadeTime = 0;

const char* getPhaseName(SystemPhase phase) {
  switch (phase) {
    case IDLE_NEUTRAL:   return "IDLE (SPENTO)";
    case NEED_ACTIVE:    return "NEED_ACTIVE";
    case NEED_ALERT:     return "NEED_ALERT (LAMPEGGIANTE)";
    case RESOLVING_FADE: return "RESOLVING_FADE";
    default:             return "UNKNOWN";
  }
}

const char* getNeedName(NeedType need) {
  switch (need) {
    case NEED_COLD:    return "COLD [Azzurro - Coperta per 3s]";
    case NEED_HUNGRY:  return "HUNGRY [Corallo - Foglia magnetica]";
    case NEED_PLAYFUL: return "PLAYFUL [Verde - 6 Carezze sul dorso]";
    default:           return "NONE";
  }
}

uint32_t getColorForNeed(NeedType need) {
  switch (need) {
    case NEED_COLD:    return COLOR_COLD;
    case NEED_HUNGRY:  return COLOR_HUNGRY;
    case NEED_PLAYFUL: return COLOR_PLAYFUL;
    default:           return COLOR_OFF;
  }
}

void applySolidColor(uint32_t color) {
  for (int i = 0; i < NUM_LEDS; i++) strip.setPixelColor(i, color);
  strip.show();
}

void triggerNeed(NeedType need) {
  currentNeed = need;
  currentPhase = NEED_ACTIVE;
  stateStartTime = millis();

  strokeCount = 0;
  greenFSM = G_IDLE;
  coldHoldAccumulated = 0;
  lastColdContactTime = 0;
  blinkState = true;
  lastBlinkTime = millis();

  uint32_t color = getColorForNeed(currentNeed);
  curR = (uint8_t)(color >> 16);
  curG = (uint8_t)(color >> 8);
  curB = (uint8_t)color;

  applySolidColor(color);

  Serial.println("\n=======================================================");
  Serial.print("[TRIGGER] ATTIVATO BISOGNO: ");
  Serial.println(getNeedName(currentNeed));
  Serial.println("=======================================================");
}

void resolveNeed(const char* reason) {
  Serial.print("\n[CARE CONFIRMED] >>> ");
  Serial.println(reason);
  Serial.println("[FADE] Cura ricevuta con successo! Dissolvenza verso OFF...");

  uint32_t activeColor = getColorForNeed(currentNeed);
  curR = (uint8_t)(activeColor >> 16);
  curG = (uint8_t)(activeColor >> 8);
  curB = (uint8_t)activeColor;

  targetR = 0;
  targetG = 0;
  targetB = 0;

  currentPhase = RESOLVING_FADE;
}

void updateColorFade() {
  if (millis() - lastFadeTime < FADE_STEP_MS) return;
  lastFadeTime = millis();

  bool changed = false;
  if (curR < targetR) { curR++; changed = true; } else if (curR > targetR) { curR--; changed = true; }
  if (curG < targetG) { curG++; changed = true; } else if (curG > targetG) { curG--; changed = true; }
  if (curB < targetB) { curB++; changed = true; } else if (curB > targetB) { curB--; changed = true; }

  if (changed) {
    applySolidColor(strip.Color(curR, curG, curB));
  } else {
    currentPhase = IDLE_NEUTRAL;
    currentNeed = NEED_NONE;
    applySolidColor(0);
    Serial.println("\n[FSM] >>> Dissolvenza completata: robot in IDLE (SPENTO).");
    Serial.println("[FSM] In attesa di comandi seriali (1, 3, 4).\n");
  }
}

void setup() {
  pinMode(REED_PIN, INPUT_PULLUP);
  pinMode(PRESSURE_PIN, INPUT_PULLUP);
  analogReadResolution(10);

  strip.begin();
  strip.setBrightness(STRIP_BRIGHTNESS);
  applySolidColor(COLOR_OFF);

  Serial.begin(9600);
  while (!Serial && millis() < 3000);

  Serial.println("\n--- CHROMALEONT: FIX DEFINITIVO ALLARME VERDE ---");
  Serial.println("Comandi Monitor Seriale:");
  Serial.println("  1 = COLD (Azzurro -> coperta per 3s)");
  Serial.println("  3 = HUNGRY (Corallo -> foglia magnetica)");
  Serial.println("  4 = PLAYFUL (Verde -> 6 carezze)");
  Serial.println("  0 = Reset immediato a spento\n");
}

void loop() {
  unsigned long now = millis();

  // Ricezione comandi Seriale
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '1') triggerNeed(NEED_COLD);
    else if (c == '3') triggerNeed(NEED_HUNGRY);
    else if (c == '4') triggerNeed(NEED_PLAYFUL);
    else if (c == '0') {
      currentPhase = IDLE_NEUTRAL;
      currentNeed = NEED_NONE;
      applySolidColor(COLOR_OFF);
      Serial.println("\n[MANUAL] Forzato spegnimento (IDLE).");
    }
  }

  int lightVal = analogRead(LIGHT_PIN);
  int pressureVal = analogRead(PRESSURE_PIN);
  bool reedClosed = (digitalRead(REED_PIN) == LOW);
  bool reedTriggered = REED_ACTIVE_LOW ? reedClosed : !reedClosed;

  // -------------------------------------------------------------
  // 1. TIMEOUT VERSO ALLARME (10s DI INAZIONE)
  // -------------------------------------------------------------
  if (currentPhase == NEED_ACTIVE && (now - stateStartTime > NEED_TIMEOUT_MS)) {
    currentPhase = NEED_ALERT;
    lastBlinkTime = now;
    blinkState = true; // Inizia acceso (non spento!) per evitare il black-out
    Serial.println("\n[TIMEOUT SCADUTO] >>> Allarme lampeggiante avviato!");
  }

  // -------------------------------------------------------------
  // 2. RISOLUZIONE DEI BISOGNI (ATTIVA SEMPRE, ANCHE IN ALLARME)
  // -------------------------------------------------------------
  bool careCompleted = false;
  const char* reason = "";

  if (currentPhase == NEED_ACTIVE || currentPhase == NEED_ALERT) {

    // --- FREDDO (AZZURRO): Coperta per 3s continui ---
    if (currentNeed == NEED_COLD) {
      bool blanketPresent = (lightVal < LIGHT_DARK_THRESHOLD);

      if (blanketPresent) {
        static unsigned long lastColdLoop = 0;
        if (lastColdContactTime > 0) {
          coldHoldAccumulated += (now - lastColdLoop);
        }
        lastColdContactTime = now;

        // Feedback respiro azzurro
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
      } else {
        if (now - lastColdContactTime > 450) {
          coldHoldAccumulated = 0;
        }
      }
      static unsigned long lastColdLoop = now;
      lastColdLoop = now;
    }

    // --- GIOCO (VERDE): 6 passate fluide con rilascio ---
    else if (currentNeed == NEED_PLAYFUL) {
      switch (greenFSM) {
        case G_IDLE:
          if (pressureVal <= STROKE_PRESS_THRESHOLD) {
            greenFSM = G_PRESSED;
            strokePhaseStartTime = now;
            applySolidColor(COLOR_PLAYFUL); // Se lampeggiava, ferma il flash e diventa verde fisso
            Serial.println("\n[ACTION DETECTED] Pressione carezza: verde fisso!");
          }
          break;

        case G_PRESSED:
          // Se la pressione risale subito prima di 150ms, torna a idle
          if (now - strokePhaseStartTime >= 180) {
            greenFSM = G_WAIT_LIFT;
            Serial.println("[STROKE] Passata completata! Rilascia la mano per confermare.");
          }
          break;

        case G_WAIT_LIFT:
          // Convalida quando la mano risale sopra 930
          if (pressureVal >= STROKE_RELEASE_THRESHOLD) {
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

    // --- FAME (CORALLO): Foglia magnetica sul muso ---
    else if (currentNeed == NEED_HUNGRY) {
      if (reedTriggered) {
        careCompleted = true;
        reason = "Magnete rilevato sulla bocca (Nutrito)";
      }
    }

    if (careCompleted) {
      resolveNeed(reason);
    }
  }

  // -------------------------------------------------------------
  // 3. LAMPEGGIATORE DI ALLARME (ROBUSTO PER TUTTI I COLORI)
  // -------------------------------------------------------------
  if (currentPhase == NEED_ALERT) {
    // Si ferma a luce fissa solo durante la reale passata con mano sopra (G_PRESSED)
    bool isHandPressing = (currentNeed == NEED_PLAYFUL && greenFSM == G_PRESSED);
    bool isCovered      = (currentNeed == NEED_COLD && lightVal < LIGHT_DARK_THRESHOLD);

    if (!isHandPressing && !isCovered) {
      if (now - lastBlinkTime >= BLINK_INTERVAL) {
        lastBlinkTime = now;
        blinkState = !blinkState;
        applySolidColor(blinkState ? getColorForNeed(currentNeed) : COLOR_OFF);
      }
    }
  }
  else if (currentPhase == RESOLVING_FADE) {
    updateColorFade();
  }

  // -------------------------------------------------------------
  // 4. TELEMETRIA SERIALE OGNI 400 MS
  // -------------------------------------------------------------
  if (now - lastLogTime >= LOG_TELEMETRY_MS) {
    lastLogTime = now;

    Serial.print("[STATUS] ");
    Serial.print(getPhaseName(currentPhase));

    if (currentNeed == NEED_PLAYFUL) {
      Serial.print(" | CAREZZE VERDE: ");
      Serial.print(strokeCount);
      Serial.print("/6");
      if (greenFSM == G_WAIT_LIFT) Serial.print(" [ATTESA RILASCIO]");
      else if (greenFSM == G_PRESSED) Serial.print(" [CONTATTO]");
    } else if (currentNeed == NEED_COLD && lightVal < LIGHT_DARK_THRESHOLD) {
      int prog = min(100, (int)((coldHoldAccumulated * 100) / COLD_HOLD_REQUIRED_MS));
      Serial.print(" | COPERTA: ");
      Serial.print(prog);
      Serial.print("%");
    }

    Serial.print(" || LUCE: ");
    Serial.print(lightVal);
    Serial.print(lightVal < LIGHT_DARK_THRESHOLD ? " [BUIO]" : " [LUCE]");
    Serial.print(" | PRESSIONE (A0): ");
    Serial.print(pressureVal);
    Serial.print(" | REED: ");
    Serial.println(reedTriggered ? "CHIUSO" : "APERTO");
  }

  delay(15);
}