import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContextV2"
import api from "../services/apiV2"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import Badge from "../components/ui/Badge"
import LoadingSpinner from "../components/ui/LoadingSpinner"

type ActiveTabType = 'account' | 'rooms'

const SettingsPage = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN"

  const [activeTab, setActiveTab] = useState<ActiveTabType>("account")
  
  // Account preferences state
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    notifications: true,
    emailUpdates: true,
  })
  const [saved, setSaved] = useState(false)

  // Rooms management state
  const [rooms, setRooms] = useState<any[]>([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [roomSearch, setRoomSearch] = useState("")
  const [roomFilter, setRoomFilter] = useState("all")
  
  // Room Editor & Creator Modal state
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null)
  
  // Room Form state
  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    title: "",
    description: "",
    price: 6000,
    dailyPrice: 500,
    monthlyPrice: 6000,
    capacity: 2,
    roomType: "NON_AC",
    floor: 1,
    isAvailable: true,
    amenities: "Bed, Fan, Wardrobe"
  })

  const [roomActionLoading, setRoomActionLoading] = useState(false)
  const [roomError, setRoomError] = useState("")
  const [roomSuccess, setRoomSuccess] = useState("")

  useEffect(() => {
    if (activeTab === 'rooms' && isAdmin) {
      fetchRooms()
    }
  }, [activeTab])

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true)
      const response = await api.get("/rooms")
      setRooms(response.data || [])
    } catch (error) {
      console.error("Error fetching rooms in settings:", error)
    } finally {
      setRoomsLoading(false)
    }
  }

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleAccountSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // Room Form Handlers
  const openCreateRoomModal = () => {
    setModalMode('create')
    setSelectedRoom(null)
    setRoomForm({
      roomNumber: "",
      title: "",
      description: "",
      price: 6000,
      dailyPrice: 500,
      monthlyPrice: 6000,
      capacity: 2,
      roomType: "NON_AC",
      floor: 1,
      isAvailable: true,
      amenities: "Bed, Fan, Wardrobe"
    })
    setRoomError("")
    setRoomSuccess("")
    setShowRoomModal(true)
  }

  const openEditRoomModal = (room: any) => {
    setModalMode('edit')
    setSelectedRoom(room)
    setRoomForm({
      roomNumber: room.roomNumber || "",
      title: room.title || "",
      description: room.description || "",
      price: room.price || room.monthlyPrice || 6000,
      dailyPrice: room.dailyPrice || 500,
      monthlyPrice: room.monthlyPrice || 6000,
      capacity: room.capacity || 2,
      roomType: room.roomType || "NON_AC",
      floor: room.floor || 1,
      isAvailable: room.isAvailable !== undefined ? room.isAvailable : true,
      amenities: room.amenities || "Bed, Fan, Wardrobe"
    })
    setRoomError("")
    setRoomSuccess("")
    setShowRoomModal(true)
  }

  const handleRoomFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomForm.roomNumber || !roomForm.title || !roomForm.price) {
      setRoomError("Room Number, Title, and Base Price are required.")
      return
    }

    try {
      setRoomActionLoading(true)
      setRoomError("")
      setRoomSuccess("")

      const payload = {
        ...roomForm,
        price: parseFloat(String(roomForm.price)),
        dailyPrice: parseFloat(String(roomForm.dailyPrice)) || parseFloat(String(roomForm.price)) / 12,
        monthlyPrice: parseFloat(String(roomForm.monthlyPrice)) || parseFloat(String(roomForm.price)),
        capacity: parseInt(String(roomForm.capacity)),
        floor: parseInt(String(roomForm.floor))
      }

      if (modalMode === 'create') {
        await api.post("/rooms", payload)
        setRoomSuccess(`Room ${roomForm.roomNumber} created successfully! 🎉`)
      } else {
        await api.put(`/rooms/${selectedRoom.id}`, payload)
        setRoomSuccess(`Room ${roomForm.roomNumber} updated successfully! 🛠️`)
      }

      await fetchRooms()
      setTimeout(() => {
        setShowRoomModal(false)
      }, 1500)
    } catch (err: any) {
      console.error("Room action failed:", err)
      setRoomError(err.response?.data?.message || "Failed to execute room operations.")
    } finally {
      setRoomActionLoading(false)
    }
  }

  const handleDeleteRoom = async (room: any) => {
    if (!window.confirm(`Are you absolutely sure you want to delete Room ${room.roomNumber}? This cannot be undone.`)) return
    try {
      setRoomsLoading(true)
      await api.delete(`/rooms/${room.id}`)
      setRoomSuccess(`Room ${room.roomNumber} deleted successfully.`)
      await fetchRooms()
      setTimeout(() => setRoomSuccess(""), 3000)
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to delete Room ${room.roomNumber}. It may have active stays attached.`)
    } finally {
      setRoomsLoading(false)
    }
  }

  const toggleRoomMaintenance = async (room: any) => {
    if (room.isAvailable && room.currentOccupancy > 0) {
      if (!window.confirm(`Room ${room.roomNumber} currently has active staying renters! Put it in maintenance anyway?`)) return
    }

    try {
      setRoomsLoading(true)
      await api.put(`/rooms/${room.id}`, { isAvailable: !room.isAvailable })
      setRoomSuccess(`Room ${room.roomNumber} status toggled successfully.`)
      await fetchRooms()
      setTimeout(() => setRoomSuccess(""), 3000)
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update room availability.")
    } finally {
      setRoomsLoading(false)
    }
  }

  // Filter & Search pipeline for rooms
  const filteredRooms = rooms.filter(room => {
    // 1. Text Search
    if (roomSearch) {
      const searchLower = roomSearch.toLowerCase()
      const roomNum = room.roomNumber || ""
      const title = room.title || ""
      const matchNum = roomNum.toLowerCase().includes(searchLower)
      const matchTitle = title.toLowerCase().includes(searchLower)
      if (!matchNum && !matchTitle) return false
    }

    // 2. Class/Availability filters
    if (roomFilter === "ac" && room.roomType !== "AC") return false
    if (roomFilter === "non-ac" && room.roomType !== "NON_AC") return false
    if (roomFilter === "available" && (!room.isAvailable || room.currentOccupancy > 0)) return false
    if (roomFilter === "maintenance" && room.isAvailable) return false
    if (roomFilter === "full" && room.currentOccupancy < room.capacity) return false

    return true
  })

  return (
    <div className="min-h-screen bg-slate-50/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Block */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              Global Settings Panel
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Customize your account profile, manage notifications, and control global hostel room inventories
            </p>
          </div>
        </div>

        {/* Dynamic Tab Switcher */}
        {isAdmin && (
          <div className="flex gap-2 border-b border-slate-150 pb-px">
            <button
              onClick={() => setActiveTab("account")}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                activeTab === "account"
                  ? "border-blue-600 text-blue-600 font-extrabold"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              👤 Profile Preferences
            </button>
            <button
              onClick={() => setActiveTab("rooms")}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                activeTab === "rooms"
                  ? "border-blue-600 text-blue-600 font-extrabold"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              🏢 Hostel Room Directory
            </button>
          </div>
        )}

        {/* TAB 1: ACCOUNT PREFERENCES */}
        {activeTab === "account" && (
          <div className="max-w-2xl space-y-6">
            {/* Profile Settings */}
            <Card className="p-6 border border-slate-150 bg-white">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-6">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleAccountChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleAccountChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleAccountChange}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs font-bold text-slate-700"
                  />
                </div>
              </div>
            </Card>

            {/* Notification Settings */}
            <Card className="p-6 border border-slate-150 bg-white">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-6">Notifications</h2>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="notifications"
                    checked={formData.notifications}
                    onChange={handleAccountChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Push Notifications</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-normal">Receive real-time system alerts regarding bookings, rent renewals, and verification updates</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="emailUpdates"
                    checked={formData.emailUpdates}
                    onChange={handleAccountChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Email Updates</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-normal">Receive detailed HTML invoices, statement drafts, and ledger logs direct to email inbox</p>
                  </div>
                </label>
              </div>
            </Card>

            {/* Account Details */}
            <Card className="p-6 border border-slate-150 bg-white">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-6">Account</h2>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Account Type</p>
                  <p className="text-xs font-extrabold text-slate-800 uppercase mt-0.5">{user?.role} ADMINISTRATOR</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Member Since</p>
                  <p className="text-xs font-extrabold text-slate-800 mt-0.5">May 2026</p>
                </div>
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex gap-4 items-center">
              <Button onClick={handleAccountSave} className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold text-xs px-5 py-2.5 shadow-sm active:scale-98">
                Save Preferences
              </Button>
              {saved && (
                <div className="flex items-center gap-2 text-emerald-600 animate-pulse">
                  <span>✅</span>
                  <span className="text-xs font-extrabold uppercase tracking-wider">Preferences saved</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: HOSTEL ROOMS MANAGEMENT (ADMIN ONLY) */}
        {activeTab === "rooms" && isAdmin && (
          <div className="space-y-6">
            
            {/* Search & Actions Bar */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* Search Box */}
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none text-xs">🔍</span>
                  <input
                    type="text"
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                    placeholder="Search by Room Number, title description..."
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50/70 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"
                  />
                </div>

                {/* Add New Room Button */}
                <button
                  onClick={openCreateRoomModal}
                  className="w-full md:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 active:scale-95 shadow-sm transition-all"
                >
                  + Add New Room
                </button>
              </div>

              <hr className="border-slate-100" />

              {/* Quick Filter Tabs */}
              <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
                {[
                  { id: "all", label: `All Rooms (${rooms.length})` },
                  { id: "ac", label: `AC Class (${rooms.filter(r => r.roomType === "AC").length})` },
                  { id: "non-ac", label: `Non-AC (${rooms.filter(r => r.roomType === "NON_AC").length})` },
                  { id: "available", label: `Available (${rooms.filter(r => r.isAvailable && r.currentOccupancy === 0).length})` },
                  { id: "full", label: `Full (${rooms.filter(r => r.currentOccupancy >= r.capacity).length})` },
                  { id: "maintenance", label: `Under Maintenance (${rooms.filter(r => !r.isAvailable).length})` }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setRoomFilter(f.id)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap active:scale-95 ${
                      roomFilter === f.id
                        ? "bg-slate-900 text-white border-slate-950 shadow-sm"
                        : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200/60"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification/Success notices */}
            {roomSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-pulse">
                <span>✅</span> {roomSuccess}
              </div>
            )}

            {/* Rooms Table */}
            {roomsLoading ? (
              <div className="flex justify-center py-20 bg-white border border-slate-100 rounded-3xl">
                <LoadingSpinner size="lg" text="Syncing global rooms directory..." />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-20 text-center bg-white border border-slate-100 rounded-3xl flex flex-col items-center justify-center space-y-2 shadow-sm">
                <span className="text-3xl">🏢</span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching rooms in directory</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[8px] font-bold uppercase tracking-widest border-b border-slate-800">
                        <th className="py-4 px-4 font-extrabold">Room Number</th>
                        <th className="py-4 px-4 font-extrabold">Descriptor / Title</th>
                        <th className="py-4 px-4 font-extrabold">Room Class</th>
                        <th className="py-4 px-4 font-extrabold">Max Capacity</th>
                        <th className="py-4 px-4 font-extrabold">Monthly Price</th>
                        <th className="py-4 px-4 font-extrabold">Current Live Status</th>
                        <th className="py-4 px-4 text-right font-extrabold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {filteredRooms.map((room) => {
                        const isMaint = !room.isAvailable
                        const isFull = room.currentOccupancy >= room.capacity
                        const isOccupied = room.currentOccupancy > 0

                        let statusLabel = "AVAILABLE"
                        let statusColor = "bg-emerald-50 text-emerald-700 border border-emerald-100"

                        if (isMaint) {
                          statusLabel = "MAINTENANCE"
                          statusColor = "bg-rose-50 text-rose-700 border border-rose-100"
                        } else if (isFull) {
                          statusLabel = "FULL"
                          statusColor = "bg-orange-50 text-orange-700 border border-orange-100"
                        } else if (isOccupied) {
                          statusLabel = "BOOKED"
                          statusColor = "bg-blue-50 text-blue-700 border border-blue-100"
                        }

                        return (
                          <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Room Number */}
                            <td className="py-4 px-4 font-bold text-slate-900">
                              <span className="text-sm font-black text-blue-600 bg-blue-50/60 px-2.5 py-1 rounded-lg">
                                {room.roomNumber}
                              </span>
                            </td>

                            {/* Title */}
                            <td className="py-4 px-4 font-semibold text-slate-800">
                              {room.title}
                              <span className="block text-[8px] font-semibold text-slate-400 mt-0.5">Floor {room.floor || 1}</span>
                            </td>

                            {/* Class */}
                            <td className="py-4 px-4 font-bold">
                              <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider border ${
                                room.roomType === "AC" 
                                  ? "bg-sky-50 text-sky-700 border-sky-100" 
                                  : "bg-slate-50 text-slate-600 border-slate-100"
                              }`}>
                                {room.roomType === "NON_AC" ? "Non-AC" : "AC"}
                              </span>
                            </td>

                            {/* Capacity */}
                            <td className="py-4 px-4 font-bold text-slate-650">
                              {room.currentOccupancy} / {room.capacity} beds occupied
                            </td>

                            {/* Price */}
                            <td className="py-4 px-4 font-extrabold text-slate-900">
                              ₹{(room.price || room.monthlyPrice || 0).toLocaleString()}
                              <span className="block text-[8px] font-semibold text-slate-400 mt-0.5">₹{(room.dailyPrice || 500).toLocaleString()}/day</span>
                            </td>

                            {/* Live Status */}
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-extrabold uppercase tracking-wider ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-right">
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => openEditRoomModal(room)}
                                  className="bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 px-2.5 py-1 rounded-xl text-[8px] font-extrabold uppercase tracking-wider transition-all shadow-sm active:scale-95"
                                >
                                  Edit Room
                                </button>
                                <button
                                  onClick={() => toggleRoomMaintenance(room)}
                                  className="bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 px-2.5 py-1 rounded-xl text-[8px] font-extrabold uppercase tracking-wider transition-all shadow-sm active:scale-95"
                                >
                                  {room.isAvailable ? "Maint" : "Available"}
                                </button>
                                <button
                                  onClick={() => handleDeleteRoom(room)}
                                  className="bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 px-2.5 py-1 rounded-xl text-[8px] font-extrabold uppercase tracking-wider transition-all shadow-sm active:scale-95"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bottom summary */}
            <div className="bg-white border border-slate-150 rounded-3xl p-4 shadow-sm text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing {filteredRooms.length} of {rooms.length} Rooms in inventory
            </div>

          </div>
        )}

      </div>

      {/* ─── ROOMS DIALOG CREATOR & EDITOR MODAL ─── */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop Blur */}
          <div 
            onClick={() => setShowRoomModal(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Container */}
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative z-10 transform transition-all animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                <span>🏢</span> {modalMode === 'edit' ? `Edit Room Details` : `Create New Room`}
              </h3>
              <button
                onClick={() => setShowRoomModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Notifications */}
            {roomError && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-bold text-rose-700 mb-4">
                <span>⚠️</span> {roomError}
              </div>
            )}
            {roomSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-bold text-emerald-800 mb-4 animate-pulse">
                <span>✅</span> {roomSuccess}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRoomFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Room Number */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm(p => ({ ...p, roomNumber: e.target.value }))}
                    placeholder="Ex: 105"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700"
                  />
                </div>

                {/* Room Title */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Room Title *</label>
                  <input
                    type="text"
                    required
                    value={roomForm.title}
                    onChange={(e) => setRoomForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Ex: AC Premium Suite"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700"
                  />
                </div>

                {/* Base Monthly Rent */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monthly Rent Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={roomForm.price}
                    onChange={(e) => setRoomForm(p => ({ ...p, price: parseFloat(e.target.value) || 0, monthlyPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700"
                  />
                </div>

                {/* Base Daily Price */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Daily Rent Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={roomForm.dailyPrice}
                    onChange={(e) => setRoomForm(p => ({ ...p, dailyPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700"
                  />
                </div>

                {/* Class */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Room Class *</label>
                  <select
                    value={roomForm.roomType}
                    onChange={(e) => setRoomForm(p => ({ ...p, roomType: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700"
                  >
                    <option value="NON_AC">Non AC Room</option>
                    <option value="AC">AC Room</option>
                  </select>
                </div>

                {/* Max Beds Capacity */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Max Capacity (Beds) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm(p => ({ ...p, capacity: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700"
                  />
                </div>

                {/* Floor */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Floor *</label>
                  <select
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm(p => ({ ...p, floor: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700"
                  >
                    <option value="1">1st Floor</option>
                    <option value="2">2nd Floor</option>
                    <option value="3">3rd Floor</option>
                    <option value="4">4th Floor</option>
                  </select>
                </div>

                {/* Initial Status */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Availability status</label>
                  <select
                    value={String(roomForm.isAvailable)}
                    onChange={(e) => setRoomForm(p => ({ ...p, isAvailable: e.target.value === "true" }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700"
                  >
                    <option value="true">Active & Available</option>
                    <option value="false">Closed / Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Room Description</label>
                <textarea
                  value={roomForm.description}
                  onChange={(e) => setRoomForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Ex: Cozy AC room with study table, wardrobe, and balcony..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 placeholder:text-slate-300 h-16 resize-none"
                />
              </div>

              {/* Amenities */}
              <div className="space-y-1">
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Room Amenities</label>
                <input
                  type="text"
                  value={roomForm.amenities}
                  onChange={(e) => setRoomForm(p => ({ ...p, amenities: e.target.value }))}
                  placeholder="Ex: Bed, Fan, Wardrobe, Balcony"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 placeholder:text-slate-350"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="flex-1 bg-slate-50 text-slate-500 border border-slate-200 text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roomActionLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider py-2.5 rounded-xl shadow-sm shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  {roomActionLoading ? "Processing..." : (modalMode === 'create' ? "Create Room" : "Save Changes")}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
