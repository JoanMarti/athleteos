'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  type SourceId,
  type ConnectedSource,
  getAllConnectedSources,
  getConnectedSource,
  disconnectSource,
  startOAuth,
} from '@/lib/dataSources'

export function useDataSources() {
  const [connected, setConnected] = useState<ConnectedSource[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setConnected(getAllConnectedSources())
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    // Re-check every 30s (tokens may expire)
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  const connect = useCallback((id: SourceId) => {
    startOAuth(id)
  }, [])

  const disconnect = useCallback((id: SourceId) => {
    disconnectSource(id)
    refresh()
  }, [refresh])

  const isConnected = useCallback(
    (id: SourceId) => connected.some(s => s.id === id),
    [connected]
  )

  const getToken = useCallback(
    (id: SourceId) => getConnectedSource(id)?.accessToken ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [connected]
  )

  return { connected, loading, connect, disconnect, isConnected, getToken }
}
