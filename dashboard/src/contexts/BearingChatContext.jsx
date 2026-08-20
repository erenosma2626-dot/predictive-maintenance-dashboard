import React, { createContext, useContext, useState, useEffect } from 'react'
import { useLanguage } from './LanguageContext'

const BearingChatContext = createContext()

export function BearingChatProvider({ children }) {
  const { language } = useLanguage()

  const [chatMessages, setChatMessages] = useState(() => [
    {
      sender: 'bot',
      text: language === 'en'
        ? 'Bearing Anomaly & Maintenance Assistant active. You can ask technical questions regarding failure signatures, mounting temperature, grease charge amounts, or official SOP steps.'
        : 'Rulman Arıza & Bakım Asistanı devrede. Rulman arızaları, montaj sıcaklığı, gresleme miktarı, titreşim izleri veya resmi SOP adımları hakkında teknik sorularınızı iletebilirsiniz.'
    }
  ])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeRepairRecords, setActiveRepairRecords] = useState({})

  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'

  // Update initial message when language changes if only 1 message exists
  useEffect(() => {
    if (chatMessages.length === 1 && chatMessages[0].sender === 'bot') {
      setChatMessages([
        {
          sender: 'bot',
          text: language === 'en'
            ? 'Bearing Anomaly & Maintenance Assistant active. You can ask technical questions regarding failure signatures, mounting temperature, grease charge amounts, or official SOP steps.'
            : 'Rulman Arıza & Bakım Asistanı devrede. Rulman arızaları, montaj sıcaklığı, gresleme miktarı, titreşim izleri veya resmi SOP adımları hakkında teknik sorularınızı iletebilirsiniz.'
        }
      ])
    }
  }, [language])

  const sendChatMessage = async (queryText, machineId, faultType) => {
    if (!queryText || !queryText.trim()) return

    const newMsgs = [...chatMessages, { sender: 'user', text: queryText }]
    setChatMessages(newMsgs)
    setIsChatLoading(true)

    try {
      const res = await fetch(`${apiBase}/api/bearing/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: queryText,
          machine_id: machineId,
          fault_type: faultType
        })
      })
      if (res.ok) {
        const data = await res.json()
        setChatMessages([...newMsgs, { sender: 'bot', text: data.answer, sources: data.source_documents }])
      } else {
        const errJson = await res.json().catch(() => null)
        const errMsg = errJson?.detail || (language === 'en' ? 'An error occurred while generating response. Please try again.' : 'Yanıt alınırken bir hata oluştu. Lütfen tekrar deneyiniz.')
        setChatMessages([...newMsgs, { sender: 'bot', text: errMsg }])
      }
    } catch (err) {
      const networkMsg = language === 'en'
        ? 'Could not connect to assistant service. Ensure the server is online.'
        : 'Asistan servisine bağlanılamadı. Sunucunun çalıştığından emin olunuz.'
      setChatMessages([...newMsgs, { sender: 'bot', text: networkMsg }])
    } finally {
      setIsChatLoading(false)
    }
  }

  const recordRepairJob = (machineId, crewId, problem, solution) => {
    setActiveRepairRecords(prev => ({
      ...prev,
      [machineId]: {
        machine_id: machineId,
        crew_id: crewId,
        problem: problem || (language === 'en' ? 'Bearing Degradation / Anomaly' : 'Rulman Yıpranması / Anomali'),
        solution: solution || (language === 'en' ? 'Standard Maintenance & Renewal SOP' : 'Standart Bakım & Yenileme Prosedürü'),
        started_at: new Date().toLocaleTimeString(),
        total_ticks: 5,
        ticks_remaining: 5,
        status: 'repairing'
      }
    }))
  }

  return (
    <BearingChatContext.Provider
      value={{
        chatMessages,
        setChatMessages,
        isChatLoading,
        sendChatMessage,
        isFloatingChatOpen,
        setIsFloatingChatOpen,
        isModalOpen,
        setIsModalOpen,
        activeRepairRecords,
        setActiveRepairRecords,
        recordRepairJob
      }}
    >
      {children}
    </BearingChatContext.Provider>
  )
}

export function useBearingChat() {
  const context = useContext(BearingChatContext)
  if (!context) {
    throw new Error('useBearingChat must be used within a BearingChatProvider')
  }
  return context
}
