import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { supabase } from '../services/supabaseClient'

const FleetSimulationContext = createContext()

export function FleetSimulationProvider({ children, dataset = 'bearing' }) {
  const [allMachines, setAllMachines] = useState([])
  const [allCrews, setAllCrews] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [allMonthlyReports, setAllMonthlyReports] = useState([])
  const [allAgentStatus, setAllAgentStatus] = useState([])
  
  const [selectedMachineId, setSelectedMachineId] = useState(null)

  // Fetch initial state for ALL datasets
  useEffect(() => {
    const fetchInitial = async () => {
      const [{ data: m }, { data: c }, { data: e }, { data: r }, { data: a }] = await Promise.all([
        supabase.from('machines').select('*').order('id'),
        supabase.from('crews').select('*').order('id'),
        supabase.from('events').select('*').order('sim_timestamp', { ascending: false }).limit(200),
        supabase.from('monthly_reports').select('*').order('month_number', { ascending: false }).limit(100),
        supabase.from('agent_status').select('*')
      ])
      
      if (m) setAllMachines(m)
      if (c) setAllCrews(c)
      if (e) setAllEvents(e)
      if (r) setAllMonthlyReports(r)
      if (a) setAllAgentStatus(a)
    }
    fetchInitial()
  }, [])

  // Realtime subscriptions for ALL datasets
  useEffect(() => {
    const channel = supabase.channel(`fleet_sim_all`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, payload => {
        setAllMachines(prev => {
          const idx = prev.findIndex(m => m.id === payload.new.id && m.dataset_type === payload.new.dataset_type)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = payload.new
            return next
          }
          return [...prev, payload.new]
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, payload => {
        setAllEvents(prev => [payload.new, ...prev].slice(0, 100))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crews' }, payload => {
        setAllCrews(prev => {
          const idx = prev.findIndex(c => c.id === payload.new.id)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = payload.new
            return next
          }
          return [...prev, payload.new].sort((a,b) => a.id.localeCompare(b.id))
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_status' }, payload => {
        setAllAgentStatus(prev => {
          const idx = prev.findIndex(a => a.agent_name === payload.new.agent_name && a.dataset_type === payload.new.dataset_type)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = payload.new
            return next
          }
          return [...prev, payload.new]
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_reports' }, payload => {
        setAllMonthlyReports(prev => [payload.new, ...prev].slice(0, 20))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Derived state based on current dataset
  const machines = useMemo(() => allMachines.filter(m => m.dataset_type === dataset), [allMachines, dataset])
  const crews = useMemo(() => allCrews.filter(c => c.dataset_type === dataset), [allCrews, dataset])
  const events = useMemo(() => allEvents.filter(e => e.dataset_type === dataset).slice(0, 50), [allEvents, dataset])
  const monthlyReports = useMemo(() => allMonthlyReports.filter(r => r.dataset_type === dataset).slice(0, 5), [allMonthlyReports, dataset])
  const agentStatus = useMemo(() => allAgentStatus.filter(a => a.dataset_type === dataset), [allAgentStatus, dataset])

  // Automatically select a valid machine when switching datasets
  useEffect(() => {
    if (machines.length > 0) {
      if (!selectedMachineId || !machines.find(m => m.id === selectedMachineId)) {
        setSelectedMachineId(machines[0].id)
      }
    }
  }, [dataset, machines, selectedMachineId])

  const contextValue = useMemo(
    () => ({ machines, crews, events, monthlyReports, agentStatus, selectedMachineId, setSelectedMachineId }),
    [machines, crews, events, monthlyReports, agentStatus, selectedMachineId]
  )

  return (
    <FleetSimulationContext.Provider value={contextValue}>
      {children}
    </FleetSimulationContext.Provider>
  )
}

export function useFleetSimulation() {
  return useContext(FleetSimulationContext)
}
