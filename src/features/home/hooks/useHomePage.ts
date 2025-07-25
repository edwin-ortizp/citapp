import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useDates } from '@/hooks/useDates'
import { useConnections } from '@/hooks/useConnections'
import { useToast } from '@/hooks/useToast'

export function useHomePage() {
  const [selected, setSelected] = useState<string>('')
  const [likingDateId, setLikingDateId] = useState<string | null>(null)
  
  const { user } = useAuth()
  const { showToast } = useToast()
  const isLogged = !!user
  const { dates, loading: datesLoading, likeDate, dislikeDate, refreshDates } = useDates(isLogged, selected)
  const { connections, loading: connectionsLoading } = useConnections()

  const handleLikeDate = async (dateId: string) => {
    if (!selected) return { hasMatch: false, isNewMatch: false }
    
    try {
      setLikingDateId(dateId)
      
      // Si es "solo", usar el ID del usuario como compañero
      const companionId = selected === 'solo' ? user?.uid || 'solo' : selected
      const result = await likeDate(dateId, companionId)
      
      // Mostrar mensaje contextual según el tipo de plan
      if (selected === 'solo') {
        showToast('Plan guardado para ti', 'success')
      } else if (result.hasMatch) {
        showToast('¡Es un match! 🎉', 'success')
      } else {
        showToast('Plan guardado', 'success')
      }
      
      // Refrescar la lista de dates para evitar duplicados
      if (result.hasMatch) {
        setTimeout(() => refreshDates(), 1000) // Pequeño delay para que se procese el match
      }
      
      return result
    } catch (error) {
      console.error('Error al procesar el like:', error)
      // Solo mostrar error si es crítico
      throw error
    } finally {
      setLikingDateId(null)
    }
  }

  const handlePassDate = async (dateId: string) => {
    if (!selected) return
    
    try {
      // Pasar el contexto del compañero al dislike
      const companionId = selected === 'solo' ? user?.uid || 'solo' : selected
      await dislikeDate(dateId, companionId)
      // No mostrar toast para dislikes para evitar spam de notificaciones
      console.log('Plan marcado como no interesante para este compañero')
    } catch (error) {
      console.error('Error al marcar como no interesante:', error)
    }
  }

  return {
    // State
    selected,
    setSelected,
    likingDateId,
    
    // Data
    user,
    isLogged,
    dates,
    connections,
    
    // Loading states
    loading: datesLoading || connectionsLoading,
    
    // Actions
    handleLikeDate,
    handlePassDate,
  }
}