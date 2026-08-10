import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

export function useFleetData() {
  const [machines, setMachines] = useState([])
  const [crews, setCrews] = useState([])
  const [events, setEvents] = useState([])
  const [monthlyReports, setMonthlyReports] = useState([])
  const [agentStatus, setAgentStatus] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Initial Fetch
    const fetchInitialData = async () => {
      try {
        const [
          { data: machinesData },
          { data: crewsData },
          { data: eventsData },
          { data: monthlyReportsData },
          { data: agentStatusData }
        ] = await Promise.all([
          supabase.from('machines').select('*').order('id', { ascending: true }),
          supabase.from('crews').select('*').order('id', { ascending: true }),
          supabase.from('events').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('monthly_reports').select('*').order('month_number', { ascending: false }),
          supabase.from('agent_status').select('*')
        ])

        if (machinesData) setMachines(machinesData)
        if (crewsData) setCrews(crewsData)
        if (eventsData) setEvents(eventsData)
        if (monthlyReportsData) setMonthlyReports(monthlyReportsData)
        if (agentStatusData) setAgentStatus(agentStatusData)
      } catch (err) {
        console.error("Error fetching initial data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()

    // 2. Realtime Subscriptions
    const channel = supabase.channel('fleet-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, (payload) => {
        setMachines(prev => {
          const newRec = payload.new
          if (payload.eventType === 'DELETE') return prev.filter(m => m.id !== payload.old.id)
          const exists = prev.find(m => m.id === newRec.id)
          if (exists) return prev.map(m => (m.id === newRec.id ? newRec : m))
          return [...prev, newRec].sort((a, b) => a.id.localeCompare(b.id))
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crews' }, (payload) => {
        setCrews(prev => {
          const newRec = payload.new
          if (payload.eventType === 'DELETE') return prev.filter(c => c.id !== payload.old.id)
          const exists = prev.find(c => c.id === newRec.id)
          if (exists) return prev.map(c => (c.id === newRec.id ? newRec : c))
          return [...prev, newRec].sort((a, b) => a.id.localeCompare(b.id))
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
        setEvents(prev => {
          if (payload.eventType === 'INSERT') {
            return [payload.new, ...prev].slice(0, 100)
          }
          return prev
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_reports' }, (payload) => {
        setMonthlyReports(prev => {
          const newRec = payload.new
          if (payload.eventType === 'INSERT') {
             return [newRec, ...prev].sort((a, b) => b.month_number - a.month_number)
          }
          if (payload.eventType === 'UPDATE') {
             return prev.map(r => r.id === newRec.id ? newRec : r)
          }
          return prev
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_status' }, (payload) => {
        setAgentStatus(prev => {
          const newRec = payload.new
          if (payload.eventType === 'DELETE') return prev.filter(a => a.agent_name !== payload.old.agent_name)
          const exists = prev.find(a => a.agent_name === newRec.agent_name)
          if (exists) return prev.map(a => (a.agent_name === newRec.agent_name ? newRec : a))
          return [...prev, newRec]
        })
      })
      .subscribe((status, err) => {
        console.log('Supabase Realtime Status:', status, err)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully connected to fleet-updates channel!')
        }
      })

    // Log any incoming messages to channel
    channel.on('broadcast', { event: '*' }, (payload) => console.log('Broadcast:', payload))
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { machines, crews, events, monthlyReports, agentStatus, loading }
}
