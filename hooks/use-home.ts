'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'

export function useHome() {
  const [homes, setHomes] = useState<Tables<'homes'>[]>([])
  const [currentHome, setCurrentHome] = useState<Tables<'homes'> | null>(null)
  const [rooms, setRooms] = useState<Tables<'rooms'>[]>([])
  const [members, setMembers] = useState<Tables<'home_members'>[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchHomes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: memberOfData } = await supabase
      .from('home_members')
      .select('home_id')
      .eq('user_id', user.id)

    const memberOf = (memberOfData || []) as Pick<Tables<'home_members'>, 'home_id'>[]

    if (memberOf.length > 0) {
      const homeIds = memberOf.map(m => m.home_id)
      const { data: homesData } = await supabase
        .from('homes')
        .select('*')
        .in('id', homeIds)
        .order('created_at', { ascending: true })

      const homesList = (homesData || []) as Tables<'homes'>[]
      if (homesList.length > 0) {
        setHomes(homesList)
        if (!currentHome && homesList.length > 0) {
          setCurrentHome(homesList[0])
        }
      }
    }
    setLoading(false)
  }, [supabase, currentHome])

  const fetchRooms = useCallback(async () => {
    if (!currentHome) return

    const { data: roomsData } = await supabase
      .from('rooms')
      .select('*')
      .eq('home_id', currentHome.id)
      .order('sort_order', { ascending: true })

    const roomsList = (roomsData || []) as Tables<'rooms'>[]
    setRooms(roomsList)
  }, [supabase, currentHome])

  const fetchMembers = useCallback(async () => {
    if (!currentHome) return

    const { data: membersData } = await supabase
      .from('home_members')
      .select('*')
      .eq('home_id', currentHome.id)

    const membersList = (membersData || []) as Tables<'home_members'>[]
    setMembers(membersList)
  }, [supabase, currentHome])

  useEffect(() => {
    fetchHomes()
  }, [fetchHomes])

  useEffect(() => {
    if (currentHome) {
      fetchRooms()
      fetchMembers()
    }
  }, [currentHome, fetchRooms, fetchMembers])

  const createHome = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: homeData, error } = await (supabase
      .from('homes') as any)
      .insert({ name, owner_id: user.id })
      .select()
      .single()

    if (error) throw error
    const home = homeData as Tables<'homes'>

    // Add owner as member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('home_members') as any)
      .insert({
        home_id: home.id,
        user_id: user.id,
        role: 'owner',
        joined_at: new Date().toISOString(),
      })

    // Create user stats for this home
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('user_stats') as any)
      .insert({
        user_id: user.id,
        home_id: home.id,
      })

    // Create user preferences for this home
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('user_preferences') as any)
      .insert({
        user_id: user.id,
        home_id: home.id,
      })

    setHomes(prev => [...prev, home])
    setCurrentHome(home)
    return home
  }

  const createRoom = async (name: string, type: string, icon?: string, sensitivityTags?: string[]) => {
    if (!currentHome) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: roomData, error } = await (supabase
      .from('rooms') as any)
      .insert({
        home_id: currentHome.id,
        name,
        type,
        icon,
        sensitivity_tags: sensitivityTags || [],
        sort_order: rooms.length,
      })
      .select()
      .single()

    if (error) throw error
    const room = roomData as Tables<'rooms'>

    setRooms(prev => [...prev, room])
    return room
  }

  const updateRoom = async (roomId: string, updates: Partial<Tables<'rooms'>>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: roomData, error } = await (supabase
      .from('rooms') as any)
      .update(updates)
      .eq('id', roomId)
      .select()
      .single()

    if (error) throw error
    const room = roomData as Tables<'rooms'>

    setRooms(prev => prev.map(r => r.id === roomId ? room : r))
    return room
  }

  const deleteRoom = async (roomId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('rooms') as any)
      .delete()
      .eq('id', roomId)

    if (error) throw error

    setRooms(prev => prev.filter(r => r.id !== roomId))
  }

  return {
    homes,
    currentHome,
    setCurrentHome,
    rooms,
    members,
    loading,
    createHome,
    createRoom,
    updateRoom,
    deleteRoom,
    refetchRooms: fetchRooms,
    refetchMembers: fetchMembers,
  }
}
