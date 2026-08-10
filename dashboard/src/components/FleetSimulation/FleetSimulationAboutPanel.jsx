import React, { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

export function FleetSimulationAboutPanel({ dataset = 'bearing' }) {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useLanguage()

  if (!isOpen) {
    return (
      <div 
        style={{
          position: 'absolute',
          bottom: '5px',
          left: '10px',
          zIndex: 1000
        }}
      >
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            background: 'rgba(15, 15, 18, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: '#888',
            fontFamily: 'monospace',
            fontSize: '11px',
            padding: '5px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={e => {
            e.currentTarget.style.color = '#ddd'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
          }}
          onMouseOut={e => {
            e.currentTarget.style.color = '#888'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <span>[i]</span> {t('fleet.about')}
        </button>
      </div>
    )
  }

  return (
    <div 
      style={{
        position: 'absolute',
        bottom: '30px',
        left: '10px',
        zIndex: 1000,
        width: '450px',
        maxHeight: '60vh',
        overflowY: 'auto',
        background: 'rgba(15, 15, 18, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '6px',
        padding: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#aaa',
        lineHeight: '1.5'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
        <span style={{ color: '#ddd', fontWeight: 'bold', letterSpacing: '1px' }}>FLEET SIMULATION EXPLAINER</span>
        <button 
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ color: '#ffaa00', marginBottom: '5px' }}>WHAT AM I LOOKING AT?</div>
        <div>
          {dataset === 'cmapss' ? (
            <>
              This is a live simulation of a small fleet of 12 turbofan engines, running
              continuously. Each engine ages independently - some degrade quickly, some
              slowly - based on statistical patterns learned from the NASA C-MAPSS
              (FD001) dataset, the same model validated in the Dataset Deep-Dive page.
              When an engine's risk crosses a threshold, an AI agent diagnoses the likely
              issue, a repair crew is dispatched, and the outcome (planned repair vs.
              unplanned failure) feeds into a running economic tally.<br/><br/>
              Nothing here is paused or replayed - the simulation runs continuously in the
              background, whether or not anyone is watching, the same way the Live tab's
              telemetry stream does.
            </>
          ) : (
            <>
              This is a live simulation of a small fleet of 12 bearings, running
              continuously. Each machine ages independently - some degrade quickly, some
              slowly - based on statistical patterns learned from 12 real bearings in the
              IMS/NASA bearing dataset (the same model validated in the Dataset Deep-Dive
              page). When a machine's risk crosses a threshold, an AI agent diagnoses the
              likely fault, a repair crew is dispatched, and the outcome (planned repair
              vs. unplanned failure) feeds into a running economic tally.<br/><br/>
              Nothing here is paused or replayed - the simulation runs continuously in the
              background, whether or not anyone is watching, the same way the Live tab's
              telemetry stream does.
            </>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ color: '#ffaa00', marginBottom: '5px' }}>HOW TIME WORKS HERE</div>
        <div>
          Time in this simulation is heavily compressed: roughly 5 real-world minutes
          represent one simulated month. The date shown at the top of the page (e.g.
          "Month 3, 2026") reflects this compressed simulated calendar, not real time.<br/><br/>
          {dataset === 'cmapss' ? (
            <>
              This lets a full maintenance cycle - an engine aging, showing early warning
              signs, getting flagged, diagnosed, and repaired - unfold in minutes instead
              of weeks, so the value of predictive maintenance is observable in a single
              sitting rather than requiring you to watch it for months.
            </>
          ) : (
            <>
              This lets a full maintenance cycle - a machine aging, showing early warning
              signs, getting flagged, diagnosed, and repaired - unfold in minutes instead
              of weeks, so the value of predictive maintenance is observable in a single
              sitting rather than requiring you to watch it for months.
            </>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ color: '#ffaa00', marginBottom: '5px' }}>HOW THE NUMBERS WORK</div>
        <div>
          Every planned repair and every unplanned failure affects a running economic
          total, shown in the Monthly Reports section. The logic follows a simple,
          consistent rule grounded in real industry patterns: planned maintenance
          (caught early, scheduled crew visit) is modeled as meaningfully cheaper and
          faster than unplanned failure (missed warning, emergency response, and a
          chance of additional cascading cost).<br/><br/>
          {dataset === 'cmapss' ? (
            <>
              This mirrors real published findings on predictive maintenance in aviation
              and heavy industry more broadly - a routine, scheduled component swap is
              consistently far cheaper than an unplanned in-service failure, which can
              involve emergency logistics, secondary damage, and lost operating time. The
              relative gap in this simulation (planned vs. unplanned cost) is built to
              reflect that same kind of order-of-magnitude difference, not a linear "10%
              more expensive" penalty.<br/><br/>
              <span style={{ color: '#ddd' }}>Important: the specific dollar figures shown are illustrative, not real
              repair quotes or real production-loss figures. They are proportionally
              realistic - sized to demonstrate the shape of the value predictive
              maintenance creates - rather than a literal financial forecast for any real
              fleet operator.</span>
            </>
          ) : (
            <>
              This mirrors real published findings on predictive maintenance - for
              example, industry reporting on bearing failures has shown a single missed
              early-warning signal turning a routine few-hundred-dollar repair into a
              production-loss incident costing over 1,000x more. The relative gap in this
              simulation (planned vs. unplanned cost) is built to reflect that same kind
              of order-of-magnitude difference, not a linear "10% more expensive" penalty.<br/><br/>
              <span style={{ color: '#ddd' }}>Important: the specific dollar figures shown are illustrative, not real
              repair quotes or real production-loss figures. They are proportionally
              realistic - sized to demonstrate the shape of the value predictive
              maintenance creates - rather than a literal financial forecast for any real
              facility.</span>
            </>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ color: '#ffaa00', marginBottom: '5px' }}>
          {dataset === 'cmapss' ? 'ABOUT "FAULT TYPE"' : 'ABOUT "FAULT TYPES"'}
        </div>
        <div>
          {dataset === 'cmapss' ? (
            <>
              Each engine, when flagged as at-risk, is shown with a simulated fault
              description to make the diagnosis view concrete and easy to follow. The
              underlying risk score itself is real - produced by a model trained and
              validated on the NASA C-MAPSS dataset (see Dataset Deep-Dive), where the
              single degradation mode tracked is High-Pressure Compressor (HPC)
              degradation. The specific sensor(s) cited as the primary driver of a given
              alert (e.g. a pressure or temperature reading) reflect the model's own
              top-contributing feature for that prediction, not a precise physical
              location within the engine - treat the fault description as a
              demonstration aid for the diagnosis experience, not as a fully
              location-verified finding.
            </>
          ) : (
            <>
              Each machine is labeled with a simulated fault type (inner race, outer
              race, or roller element defect) to make the 3D diagnosis view and agent
              explanations concrete and easy to follow. The underlying risk score
              itself is real - produced by a model trained and validated on real
              bearing sensor data (see Dataset Deep-Dive). The specific fault type
              label, however, is illustrative: it is not derived from a location-specific
              signal analysis (that was attempted on the real dataset and found
              unreliable - also documented in Dataset Deep-Dive). Treat the fault type as
              a demonstration aid for the diagnosis and 3D-highlighting experience, not
              as a model-verified finding.
            </>
          )}
        </div>
      </div>

      <div>
        <div style={{ color: '#ffaa00', marginBottom: '5px' }}>WHAT THE AGENTS DO</div>
        <ul style={{ paddingLeft: '15px', margin: 0 }}>
          <li style={{ marginBottom: '5px' }}><strong>Monitoring:</strong> continuously checks every {dataset === 'cmapss' ? 'engine\'s' : 'machine\'s'} risk level against a threshold - simple, fast, no AI model involved.</li>
          <li style={{ marginBottom: '5px' }}><strong>Diagnosis:</strong> when {dataset === 'cmapss' ? 'an engine' : 'a machine'} crosses the risk threshold, an AI agent reviews its current state and recent history to write a short, plain-language explanation for a technician, including whether this looks like a recurring issue.</li>
          <li style={{ marginBottom: '5px' }}><strong>Planning:</strong> assigns an available repair crew to the {dataset === 'cmapss' ? 'engine' : 'machine'}, or queues it if every crew is currently busy, prioritizing by estimated cost of delay.</li>
          <li style={{ marginBottom: '5px' }}><strong>Reporting:</strong> at the end of each simulated month, an AI agent reviews that month's events and compares them to the prior month to write a short executive summary.</li>
        </ul>
        <div style={{ marginTop: '10px' }}>
          The Diagnosis and Reporting agents use a real language model; Monitoring
          and the crew-assignment logic are plain rule-based code, not AI-driven -
          this keeps the fast, frequent decisions cheap and instant, while reserving
          AI for the parts that genuinely benefit from natural-language synthesis.
        </div>
      </div>
      <div>
        <div style={{ color: '#ffaa00', marginBottom: '5px', marginTop: '20px' }}>ABOUT ESCALATION & APPROVAL</div>
        <div style={{ marginTop: '10px' }}>
          If {dataset === 'cmapss' ? 'an engine' : 'a machine'} is flagged as at-risk multiple times recently, it's routed to
          a separate "escalation" diagnosis that explicitly flags it as a likely
          persistent issue rather than a one-off. Optionally, you can require human
          approval before any repair crew is dispatched (toggle above) - when
          enabled, the system pauses and waits for a decision instead of dispatching
          automatically.
        </div>
      </div>
    </div>
  )
}
