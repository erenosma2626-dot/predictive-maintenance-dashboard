# Industrial Rolling Element Bearing Technical & Troubleshooting Manual
**Document Reference:** STD-ENG-BRG-2026-V4  
**Scope:** Plant Machinery Rolling Bearing Diagnostics, Vibration Spectral Analysis, Lubrication Engineering, and Standard Operating Procedures (SOP).

---

## 1. Rolling Element Bearing Kinematics & Defect Frequencies

The fundamental fault frequencies of rolling element bearings are determined by their internal geometry and rotational speed ($f_r = \text{RPM} / 60$):

1. **BPFO (Ball Pass Frequency Outer Race):**
   $$\text{BPFO} = \frac{n}{2} \cdot f_r \cdot \left(1 - \frac{d}{D} \cos \alpha \right)$$
   - *Physical Mechanism:* Occurs each time a rolling element passes over a defect on the stationary or rotating outer ring raceway.
   - *Spectral Signature:* Sharp distinct peaks at $\text{BPFO}, 2\times\text{BPFO}, 3\times\text{BPFO}$. Sidebands are typically small unless the outer race is rotating or load is strongly non-uniform.

2. **BPFI (Ball Pass Frequency Inner Race):**
   $$\text{BPFI} = \frac{n}{2} \cdot f_r \cdot \left(1 + \frac{d}{D} \cos \alpha \right)$$
   - *Physical Mechanism:* Rolling element passes over an inner ring raceway defect. Because the defect rotates in and out of the primary load zone, the amplitude is modulated by running speed ($1\times f_r$).
   - *Spectral Signature:* Prominent peaks at $\text{BPFI}$ surrounded by $1\times\text{RPM}$ sidebands.

3. **BSF (Ball Spin Frequency):**
   $$\text{BSF} = \frac{D}{2d} \cdot f_r \cdot \left(1 - \left(\frac{d}{D} \cos \alpha\right)^2 \right)$$
   - *Physical Mechanism:* Occurs when a single rolling element defect strikes the inner and outer raceways alternately (producing impact frequency at $2\times\text{BSF}$).
   - *Spectral Signature:* Peaks at $2\times\text{BSF}$ with FTF (cage frequency) sidebands.

4. **FTF (Fundamental Train / Cage Frequency):**
   $$\text{FTF} = \frac{1}{2} \cdot f_r \cdot \left(1 - \frac{d}{D} \cos \alpha \right)$$
   - *Physical Mechanism:* Rotation of the retainer / cage assembly, typically $0.38\times$ to $0.44\times f_r$.

---

## 2. Bearing Vibration Severity Standards (ISO 10816-3 & ISO 20816-3)

| Vibration Velocity RMS (10 Hz - 1 kHz) | Class I (Small Machines <15kW) | Class II (Medium Machines 15-75kW) | Class III (Large Rigid Base >75kW) | Class IV (Large Soft Base >75kW) | Status & Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **0.28 - 0.71 mm/s** | Zone A | Zone A | Zone A | Zone A | Newly commissioned / Good |
| **0.71 - 1.80 mm/s** | Zone A | Zone A | Zone A | Zone A | Acceptable for unrestricted continuous operation |
| **1.80 - 4.50 mm/s** | Zone B / C | Zone B | Zone B | Zone B | Acceptable with regular condition monitoring |
| **4.50 - 7.10 mm/s** | Zone C | Zone C | Zone C | Zone C | Restricted operation; schedule inspection |
| **> 7.10 mm/s** | Zone D | Zone D | Zone D | Zone D | **CRITICAL: Immediate shutdown & corrective maintenance** |

### Kurtosis & Crest Factor Diagnostic Thresholds
- **Kurtosis < 3.0:** Gaussian / Normal healthy background noise.
- **Kurtosis 3.0 - 4.5:** Incipient micro-defect or slight mechanical looseness / mild contamination.
- **Kurtosis 4.5 - 7.5:** Active localized spall or severe lubrication breakdown (Stage 2/3 bearing failure).
- **Kurtosis > 7.5:** Critical shock impact events (broken cage, roller spalls, severe fluting erosion).

---

## 3. Comprehensive Bearing Failure Modes & Root Cause Analysis

### 3.1 FLT-BRG-BPFI-01: Inner Race Micro-Spalling & Fatigue
- **Root Cause:** Dynamic overload, excessive interference fit, poor shaft straightness, or operation exceeding $L_{10h}$ fatigue life.
- **Physical Symptom:** Clicking/ticking noise in sync with rotation; rapid rise in demodulated acceleration.
- **Corrective Procedure:**
  1. Lock out equipment (LOTO).
  2. Pull bearing using 3-jaw puller or hydraulic dismounting collar.
  3. Verify shaft diameter at seating area using 3-point micrometer. Ensure tolerance adheres to ISO k5/m5.
  4. Induction heat replacement to $110^\circ\text{C}$ (never exceed $125^\circ\text{C}$).
  5. Press bearing firmly against shaft backing shoulder until seated.

### 3.2 FLT-BRG-BPFI-02: Electrical Fluting Erosion (VFD Shaft Voltage)
- **Root Cause:** Common-mode voltage and PWM carrier frequency spikes from VFD causing discharge currents through lubricant film.
- **Physical Symptom:** Characteristic washboard / fluting grooves across inner race; high-pitched electrical whining.
- **Corrective Procedure:**
  1. Test shaft-to-earth peak-to-peak voltage with carbon brush oscilloscope probe (voltage should be $<2.0\text{V}$).
  2. Install insulated bearing (e.g. SKF INSOCOAT with $1000\text{V DC}$ breakdown rating) or hybrid ceramic bearing on NDE.
  3. Mount Aegis PRO or Helwig carbon fiber shaft grounding ring on DE shaft.

### 3.3 FLT-BRG-BPFO-01: Outer Race Stationary Spalling
- **Root Cause:** Static/dynamic radial load concentration in fixed load zone, moisture entry causing corrosion fatigue.
- **Physical Symptom:** Steady rhythmic grinding sound; sharp BPFO harmonic spikes.
- **Corrective Procedure:**
  1. Disassemble plummer block / end-shield housing.
  2. Measure housing bore roundness; check for ovality $>0.02\text{ mm}$.
  3. Replace outer ring with proper clearance fit (ISO H7/J7).
  4. Repack housing with 30-50% grease fill.

### 3.4 FLT-LUB-STARV-01: Lubrication Starvation & Dry Friction
- **Root Cause:** Missed lubrication interval, blocked grease pipe, soap hardening, or blown labyrinth seals.
- **Physical Symptom:** High-frequency screeching; rapid temperature rise ($>85^\circ\text{C}$).
- **Corrective Procedure:**
  1. Remove grease drain plug and grease nipple.
  2. Inspect lube channel for hardened soap buildup; clean with solvent probe.
  3. Inject 50% calculated grease charge using calibrated grease gun.
  4. Run unit for 30 minutes; verify temperature drops below $65^\circ\text{C}$.

### 3.5 FLT-LUB-OVER-02: Over-Lubrication & Grease Churning
- **Root Cause:** Excessive grease packed into cavity ($>60\%$ free volume), creating viscous churning friction.
- **Physical Symptom:** Temperature rising beyond $90^\circ\text{C}$ shortly after PM regreasing; grease weeping through seals.
- **Corrective Procedure:**
  1. Remove bottom drain plug immediately while motor is in operation.
  2. Allow excess grease to purge under internal pressure for 30-60 minutes.
  3. Re-install drain plug once housing temperature stabilizes.

### 3.6 FLT-MECH-MISALIGN-01: Shaft Misalignment
- **Root Cause:** Thermal growth differential, soft-foot, foundation shift, or coupling misalignment.
- **Physical Symptom:** $2\times\text{RPM}$ vibration dominating radial and axial channels; elevated bearing temperature.
- **Corrective Procedure:**
  1. Mount dual-head laser alignment tool across coupling.
  2. Check for soft foot ($<0.04\text{ mm}$ limit).
  3. Adjust motor elevation using pre-cut SS 304 shims.
  4. Re-torque base bolts and verify radial/axial alignment $<0.05\text{ mm}$.

---

## 4. Lubrication Engineering & Grease Quantity Calculation

### Grease Quantity Formula (Standard Bearing PM)
$$G_q = 0.005 \cdot D \cdot B$$
Where:
- $G_q$ = Grease quantity in grams
- $D$ = Bearing outer diameter in mm
- $B$ = Bearing total width in mm

### Regreasing Interval Derating Formula
$$t_f = t_{base} \cdot f_{temp} \cdot f_{contam} \cdot f_{vib}$$
Where:
- $f_{temp} = 0.5$ for every $15^\circ\text{C}$ above $70^\circ\text{C}$.
- $f_{contam} = 0.4$ for dusty/slurry plant environments.
- $f_{vib} = 0.6$ for heavy vibration / reciprocating loads.

---

## 5. Summary of Plant Fleet Assets & Standard Specifications

| Asset ID | Location / Machine | Bearing Position | Bearing Model | Grease Type | Regreasing (g / hrs) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M01** | Conveyor-1 | Drive End (DE) | SKF 6205-2RSH/C3 | Mobil Polyrex EM | 15 g / 2000 hrs |
| **M02** | Conveyor-1 | Non-Drive End (NDE) | SKF 6205-2Z | Mobil Polyrex EM | 12 g / 2500 hrs |
| **M03** | Slurry Pump | Drive End (DE) | FAG NU 214 ECP | Shell Gadus S2 V220 2 | 45 g / 1000 hrs |
| **M04** | Slurry Pump | NDE / Thrust Pair | SKF 7314 BECBM | Shell Gadus S2 V220 2 | 60 g / 1000 hrs |
| **M05** | ID Fan | Drive End (DE) | SKF 22218 EK | Klüberquiet BQ 72-72 | 75 g / 750 hrs |
| **M06** | ID Fan | Non-Drive End (NDE) | SKF 22218 EK | Klüberquiet BQ 72-72 | 75 g / 750 hrs |
| **M07** | Air Compressor | Drive End (DE) | NSK 6310 C3 | ISO VG 46 Oil | Circulating Bath |
| **M08** | Air Compressor | Non-Drive End (NDE) | NSK 7310 B | ISO VG 46 Oil | Circulating Bath |
| **M09** | Raw Mill Gearbox | Pinion DE | Timken 32314 Pair | ISO VG 320 Oil | Splash Bath |
| **M10** | Raw Mill Gearbox | Intermediate NDE | SKF 23220 CC/W33 | ISO VG 320 Oil | Splash Bath |
| **M11** | Cooling Water Pump | Drive End (DE) | SKF 6308-2Z/C3 | Mobilith SHC 100 | 20 g / 1800 hrs |
| **M12** | Cooling Water Pump | Non-Drive End (NDE) | SKF 6308-2Z/C3 | Mobilith SHC 100 | 20 g / 1800 hrs |
