'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Camera, Edit2, Trash2, GripVertical, Home, ChefHat, Bath, Bed, Monitor, UtensilsCrossed, Shirt, Car, Sun } from 'lucide-react'
import { Button, Card, Input, Modal, Badge, Checkbox } from '@/components/ui'
import { Loading } from '@/components/ui/loading'
import { PageHeader } from '@/components/layout/page-header'
import { useHome } from '@/hooks/use-home'
import { ROOM_TYPES, SENSITIVITY_TAGS } from '@/types'
import { cn } from '@/lib/utils'

const ROOM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  living: Home,
  kitchen: ChefHat,
  bathroom: Bath,
  bedroom: Bed,
  office: Monitor,
  dining: UtensilsCrossed,
  laundry: Shirt,
  garage: Car,
  balcony: Sun,
  custom: Home,
}

export default function RoomsPage() {
  const { rooms, loading, createRoom, updateRoom, deleteRoom } = useHome()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<string | null>(null)

  // Form state
  const [roomName, setRoomName] = useState('')
  const [roomType, setRoomType] = useState('custom')
  const [sensitivityTags, setSensitivityTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setRoomName('')
    setRoomType('custom')
    setSensitivityTags([])
    setEditingRoom(null)
  }

  const handleOpenAdd = () => {
    resetForm()
    setShowAddModal(true)
  }

  const handleOpenEdit = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId)
    if (!room) return

    setRoomName(room.name)
    setRoomType(room.type)
    setSensitivityTags(room.sensitivity_tags || [])
    setEditingRoom(roomId)
    setShowAddModal(true)
  }

  const handleSave = async () => {
    if (!roomName.trim()) return

    setSaving(true)

    try {
      if (editingRoom) {
        await updateRoom(editingRoom, {
          name: roomName.trim(),
          type: roomType,
          sensitivity_tags: sensitivityTags,
        })
      } else {
        await createRoom(roomName.trim(), roomType, ROOM_ICONS[roomType]?.name || 'Home', sensitivityTags)
      }

      setShowAddModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving room:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (roomId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta habitación?')) return

    try {
      await deleteRoom(roomId)
    } catch (error) {
      console.error('Error deleting room:', error)
    }
  }

  if (loading) {
    return <Loading fullScreen text="Cargando habitaciones..." />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <PageHeader
        title="Habitaciones"
        subtitle="Administra los espacios de tu hogar"
        action={
          <Button onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        }
      />

      {/* Rooms list */}
      <div className="space-y-2">
        {rooms.map((room) => {
          const Icon = ROOM_ICONS[room.type] || Home

          return (
            <Card key={room.id} variant="bordered" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-emerald-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{room.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {room.sensitivity_tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} size="sm" variant="default">
                        {SENSITIVITY_TAGS.find(t => t.id === tag)?.label || tag}
                      </Badge>
                    ))}
                    {room.sensitivity_tags && room.sensitivity_tags.length > 2 && (
                      <Badge size="sm" variant="default">
                        +{room.sensitivity_tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Link href={`/scan?room=${room.id}`}>
                    <Button variant="ghost" size="icon">
                      <Camera className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(room.id)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(room.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {rooms.length === 0 && (
        <Card variant="bordered" className="p-8 text-center">
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-1">Sin habitaciones</h3>
          <p className="text-sm text-gray-500 mb-4">
            Agrega las habitaciones de tu hogar para empezar
          </p>
          <Button onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar habitación
          </Button>
        </Card>
      )}

      {/* Add/Edit modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }}
        title={editingRoom ? 'Editar habitación' : 'Nueva habitación'}
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Ej: Living principal"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de habitación
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ROOM_TYPES.map((type) => {
                const Icon = ROOM_ICONS[type.type] || Home

                return (
                  <button
                    key={type.type}
                    onClick={() => {
                      setRoomType(type.type)
                      if (!roomName) setRoomName(type.name)
                    }}
                    className={cn(
                      'p-3 rounded-lg border text-center transition-colors',
                      roomType === type.type
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Icon className={cn(
                      'w-5 h-5 mx-auto mb-1',
                      roomType === type.type ? 'text-emerald-600' : 'text-gray-500'
                    )} />
                    <span className={cn(
                      'text-xs',
                      roomType === type.type ? 'text-emerald-700 font-medium' : 'text-gray-600'
                    )}>
                      {type.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Características especiales
            </label>
            <div className="space-y-2">
              {SENSITIVITY_TAGS.map((tag) => (
                <Checkbox
                  key={tag.id}
                  label={tag.label}
                  checked={sensitivityTags.includes(tag.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSensitivityTags([...sensitivityTags, tag.id])
                    } else {
                      setSensitivityTags(sensitivityTags.filter(t => t !== tag.id))
                    }
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowAddModal(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              loading={saving}
              disabled={!roomName.trim()}
            >
              {editingRoom ? 'Guardar' : 'Agregar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
