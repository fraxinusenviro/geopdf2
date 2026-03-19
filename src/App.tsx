import React, { useEffect } from 'react'
import { TopBar } from '@/components/TopBar'
import { BottomBar } from '@/components/BottomBar'
import { RightToolbar } from '@/components/RightToolbar'
import { LeftDrawer } from '@/components/LeftDrawer'
import { MapViewer } from '@/components/MapViewer'
import { ImportMapSheet } from '@/components/ImportMapSheet'
import { WaypointEditorSheet } from '@/components/WaypointEditorSheet'
import { useUiStore } from '@/store/uiStore'
import { useMapStore } from '@/store/mapStore'
import { useWaypointStore } from '@/store/waypointStore'
import { useTrackStore } from '@/store/trackStore'

export const App: React.FC = () => {
  const activeSheet = useUiStore((s) => s.activeSheet)

  const loadMapsFromDb = useMapStore((s) => s.loadMapsFromDb)
  const loadWaypoints = useWaypointStore((s) => s.loadWaypoints)
  const loadOverlays = useWaypointStore((s) => s.loadOverlays)
  const loadTracks = useTrackStore((s) => s.loadTracks)

  // Bootstrap data from IndexedDB on first load
  useEffect(() => {
    loadMapsFromDb()
    loadWaypoints()
    loadOverlays()
    loadTracks()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 overflow-hidden">
      <TopBar />

      <div className="flex flex-1 overflow-hidden relative min-h-0">
        <LeftDrawer />

        <div className="flex-1 relative overflow-hidden min-w-0">
          <MapViewer />
          <RightToolbar />
        </div>
      </div>

      <BottomBar />

      {activeSheet === 'import-map' && <ImportMapSheet />}
      {activeSheet === 'waypoint-editor' && <WaypointEditorSheet />}
    </div>
  )
}
