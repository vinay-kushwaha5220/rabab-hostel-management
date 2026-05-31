import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Pencil, Wrench, Trash2, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react"
import api from "../../services/apiV2"
import type { RoomType } from "../../types/room"
import Card from "../../components/ui/Card"
import Badge from "../../components/ui/Badge"
import LoadingSpinner from "../../components/ui/LoadingSpinner"

const RoomsManagement = () => {
  const navigate = useNavigate()

  // State
  const [rooms, setRooms] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [roomSearch, setRoomSearch] = useState("")
  const [roomFilter, setRoomFilter] = useState("all")
  const [floorFilter, setFloorFilter] = useState("all")

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Dropdown State
  const [activeDropdownId, setActiveDropdownId] = useState<number | string | null>(null)

  // Modal states
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null)

  // Form State
  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    title: "",
    description: "",
    price: 6000,
    dailyPrice: 500,
    monthlyPrice: 6000,
    capacity: 2,
    roomType: "NON_AC",
    bookingType: "MONTHLY",
    floor: 1,
    isAvailable: true,
    amenities: "Bed, Fan, Wardrobe"
  })

  // Action feedback states
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  useEffect(() => {
    fetchRooms()
  }, [])

  // Reset pagination to first page when search filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [roomSearch, roomFilter, floorFilter])

  // Close dropdown on outside click
  useEffect(() => {
    const closeAllDropdowns = () => setActiveDropdownId(null)
    window.addEventListener('click', closeAllDropdowns)
    return () => window.removeEventListener('click', closeAllDropdowns)
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await api.get("/rooms")
      setRooms(response.data || [])
    } catch (error) {
      console.error("Error fetching rooms in management panel:", error)
    } finally {
      setLoading(false)
    }
  }

  // Statistics memo
  const stats = useMemo(() => {
    const total = rooms.length
    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0)
    const occupiedBeds = rooms.reduce((sum, r) => sum + r.currentOccupancy, 0)
    const maintenance = rooms.filter(r => !r.isAvailable).length
    const availableBeds = rooms.filter(r => r.isAvailable).reduce((sum, r) => sum + (r.capacity - r.currentOccupancy), 0)
    const occupancyRate = totalCapacity > 0 ? Math.round((occupiedBeds / totalCapacity) * 100) : 0

    return {
      total,
      totalCapacity,
      occupiedBeds,
      maintenance,
      availableBeds,
      occupancyRate
    }
  }, [rooms])

  // Modals Trigger Handlers
  const openCreateModal = () => {
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
      bookingType: "MONTHLY",
      floor: 1,
      isAvailable: true,
      amenities: "Bed, Fan, Wardrobe"
    })
    setErrorMsg("")
    setSuccessMsg("")
    setShowRoomModal(true)
  }

  const openEditModal = (room: RoomType) => {
    setModalMode('edit')
    setSelectedRoom(room)

    // Join amenities array back into a comma-separated list for easy editing
    const amenitiesText = Array.isArray(room.amenities)
      ? room.amenities.join(", ")
      : String(room.amenities || "Bed, Fan, Wardrobe")

    setRoomForm({
      roomNumber: room.roomNumber || "",
      title: room.title || "",
      description: room.description || "",
      price: room.price || room.monthlyPrice || 6000,
      dailyPrice: room.dailyPrice || 500,
      monthlyPrice: room.monthlyPrice || room.price || 6000,
      capacity: room.capacity || 2,
      roomType: room.roomType || "NON_AC",
      bookingType: room.bookingType || "MONTHLY",
      floor: room.floor !== undefined ? room.floor : 1,
      isAvailable: room.isAvailable !== undefined ? room.isAvailable : true,
      amenities: amenitiesText
    })
    setErrorMsg("")
    setSuccessMsg("")
    setShowRoomModal(true)
  }

  const handleRoomFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomForm.roomNumber || !roomForm.title || !roomForm.price) {
      setErrorMsg("Room Number, Descriptor/Title, and Monthly Rent Price are required.")
      return
    }

    try {
      setActionLoading(true)
      setErrorMsg("")
      setSuccessMsg("")

      // Parse amenities from string back to an array of strings
      const amenitiesArr = roomForm.amenities
        .split(",")
        .map(a => a.trim())
        .filter(a => a.length > 0)

      const payload = {
        ...roomForm,
        price: parseFloat(String(roomForm.price)),
        dailyPrice: parseFloat(String(roomForm.dailyPrice)) || parseFloat(String(roomForm.price)) / 12,
        monthlyPrice: parseFloat(String(roomForm.price)),
        capacity: parseInt(String(roomForm.capacity)),
        floor: parseInt(String(roomForm.floor)),
        amenities: amenitiesArr,
        images: selectedRoom ? selectedRoom.images : []
      }

      if (modalMode === 'create') {
        await api.post("/rooms", payload)
        setSuccessMsg(`Room ${roomForm.roomNumber} has been successfully created! 🌟`)
      } else {
        if (!selectedRoom) return
        await api.put(`/rooms/${selectedRoom.id}`, payload)
        setSuccessMsg(`Room ${roomForm.roomNumber} has been successfully updated! 🛠️`)
      }

      await fetchRooms()
      setTimeout(() => {
        setShowRoomModal(false)
      }, 1500)
    } catch (err: any) {
      console.error("Room execution failed:", err)
      setErrorMsg(err.response?.data?.message || "Failed to execute global room operation.")
    } finally {
      setActionLoading(false)
    }
  }

  const toggleRoomMaintenance = async (room: RoomType) => {
    if (room.isAvailable && room.currentOccupancy > 0) {
      if (!window.confirm(`Warning: Room ${room.roomNumber} currently has active checkout stay cycles! Are you sure you want to toggle it to MAINTENANCE mode?`)) {
        return
      }
    }

    try {
      setLoading(true)
      await api.put(`/rooms/${room.id}`, { isAvailable: !room.isAvailable })
      setSuccessMsg(`Room ${room.roomNumber} availability toggled successfully!`)
      await fetchRooms()
      setTimeout(() => setSuccessMsg(""), 3000)
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update room availability mode.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoom = async (room: RoomType) => {
    if (!window.confirm(`CRITICAL WARNING: Are you absolutely sure you want to permanently delete Room ${room.roomNumber}? This operation cannot be reversed.`)) {
      return
    }

    try {
      setLoading(true)
      await api.delete(`/rooms/${room.id}`)
      setSuccessMsg(`Room ${room.roomNumber} deleted successfully.`)
      await fetchRooms()
      setTimeout(() => setSuccessMsg(""), 3000)
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to delete Room ${room.roomNumber}. Make sure the unit has zero active stays/renters attached.`)
    } finally {
      setLoading(false)
    }
  }

  // Filter pipeline
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      // 1. Search Query
      if (roomSearch) {
        const query = roomSearch.toLowerCase()
        const matchNum = (room.roomNumber || "").toLowerCase().includes(query)
        const matchTitle = (room.title || "").toLowerCase().includes(query)
        const matchDesc = (room.description || "").toLowerCase().includes(query)
        if (!matchNum && !matchTitle && !matchDesc) return false
      }

      // 2. Floor Filter
      if (floorFilter !== "all" && String(room.floor) !== floorFilter) {
        return false
      }

      // 3. Tab Filter
      if (roomFilter === "ac" && room.roomType !== "AC") return false
      if (roomFilter === "non-ac" && room.roomType !== "NON_AC") return false
      if (roomFilter === "available" && (!room.isAvailable || room.currentOccupancy > 0)) return false
      if (roomFilter === "booked" && (!room.isAvailable || room.currentOccupancy === 0 || room.currentOccupancy >= room.capacity)) return false
      if (roomFilter === "full" && (!room.isAvailable || room.currentOccupancy < room.capacity)) return false
      if (roomFilter === "maintenance" && room.isAvailable) return false

      return true
    })
  }, [rooms, roomSearch, roomFilter, floorFilter])

  // Calculate total pages
  const totalPages = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE)

  // Paginated rooms slice
  const paginatedRooms = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredRooms.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredRooms, currentPage])

  return (
    <div className="min-h-screen bg-slate-50/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Block */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-blue-600 hover:text-blue-700 mb-1 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
            >
              ← Back to admin dashboard
            </button>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-lg">🏨</span>
              Hostel Room Directory
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Create, edit, toggle maintenance statuses, and inspect all student/renter living quarters in real-time
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 active:scale-95 shadow-sm transition-all flex items-center gap-1.5 self-start md:self-auto"
          >
            + Create New Room
          </button>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Stat 1 */}
          <Card className="p-5 border border-slate-100/80 bg-white hover:scale-[1.01] transition-all duration-300">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Inventory</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-slate-800">{stats.total}</span>
              <span className="text-xs font-bold text-slate-400">Units</span>
            </div>
            <div className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {stats.totalCapacity} Total beds built
            </div>
          </Card>

          {/* Stat 2 */}
          <Card className="p-5 border border-slate-100/80 bg-white hover:scale-[1.01] transition-all duration-300">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Occupancy Ratio</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-indigo-600">{stats.occupancyRate}%</span>
              <span className="text-xs font-bold text-indigo-400">Filled</span>
            </div>
            <div className="mt-3 text-[10px] font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              {stats.occupiedBeds} occupied beds
            </div>
          </Card>

          {/* Stat 3 */}
          <Card className="p-5 border border-slate-100/80 bg-white hover:scale-[1.01] transition-all duration-300">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vacant & Active</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-emerald-600">{stats.availableBeds}</span>
              <span className="text-xs font-bold text-emerald-400">Beds</span>
            </div>
            <div className="mt-3 text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Immediate allocation ready
            </div>
          </Card>

          {/* Stat 4 */}
          <Card className="p-5 border border-slate-100/80 bg-white hover:scale-[1.01] transition-all duration-300">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Maintenance Mode</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-rose-600">{stats.maintenance}</span>
              <span className="text-xs font-bold text-rose-400">Units</span>
            </div>
            <div className="mt-3 text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Closed for restoration
            </div>
          </Card>
        </div>

        {/* Filters & Actions Bar */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none text-xs">🔍</span>
              <input
                type="text"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Search Room #, description amenities..."
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50/70 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"
              />
            </div>

            {/* Floor Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Filter Floor:</span>
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="w-full md:w-36 px-3 py-2 text-xs bg-slate-50/70 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"
              >
                <option value="all">All Floors</option>
                <option value="0">Ground Floor</option>
                <option value="1">1st Floor</option>
                <option value="2">2nd Floor</option>
                <option value="3">3rd Floor</option>
                <option value="4">4th Floor</option>
              </select>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Quick Filter Tabs */}
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
            {[
              { id: "all", label: `All Rooms (${rooms.length})` },
              { id: "ac", label: `AC Class (${rooms.filter(r => r.roomType === "AC").length})` },
              { id: "non-ac", label: `Non-AC (${rooms.filter(r => r.roomType === "NON_AC").length})` },
              { id: "available", label: `Available Unit (${rooms.filter(r => r.isAvailable && r.currentOccupancy === 0).length})` },
              { id: "booked", label: `Booked Beds (${rooms.filter(r => r.isAvailable && r.currentOccupancy > 0 && r.currentOccupancy < r.capacity).length})` },
              { id: "full", label: `Full Room (${rooms.filter(r => r.isAvailable && r.currentOccupancy >= r.capacity).length})` },
              { id: "maintenance", label: `Under Maintenance (${rooms.filter(r => !r.isAvailable).length})` }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setRoomFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap active:scale-95 ${roomFilter === f.id
                    ? "bg-slate-900 text-white border-slate-950 shadow-sm"
                    : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200/60"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Global Notifications Panel inside page */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-pulse">
            <span>✅</span> {successMsg}
          </div>
        )}

        {/* Directory Inventory List */}
        {loading ? (
          <div className="flex justify-center py-20 bg-white border border-slate-100 rounded-3xl">
            <LoadingSpinner size="lg" text="Synchronizing global room databases..." />
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
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200/80 z-10">
                  <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-5 font-bold">Room Number</th>
                    <th className="py-3.5 px-5 font-bold">Descriptor / Title</th>
                    <th className="py-3.5 px-5 font-bold">Room Class</th>
                    <th className="py-3.5 px-5 font-bold">Booking Scheme</th>
                    <th className="py-3.5 px-5 font-bold">Beds Capacity</th>
                    <th className="py-3.5 px-5 font-bold">Monthly Base Rate</th>
                    <th className="py-3.5 px-5 font-bold">Status</th>
                    <th className="py-3.5 px-5 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {paginatedRooms.map((room) => {
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
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          <span className="text-sm font-black text-blue-600 bg-blue-50/60 px-2.5 py-1 rounded-lg">
                            {room.roomNumber}
                          </span>
                        </td>

                        {/* Title */}
                        <td className="py-3.5 px-5 font-semibold text-slate-800">
                          {room.title}
                          <span className="block text-[8px] font-semibold text-slate-400 mt-0.5">{room.floor === 0 ? "Ground Floor" : `Floor ${room.floor || 1}`} • {room.currentRenterName ? `Active Tenant: ${room.currentRenterName}` : 'No active checked-in tenant'}</span>
                        </td>

                        {/* Class */}
                        <td className="py-3.5 px-5 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider border ${room.roomType === "AC"
                              ? "bg-sky-50 text-sky-700 border-sky-100"
                              : "bg-slate-50 text-slate-600 border-slate-100"
                            }`}>
                            {room.roomType === "NON_AC" ? "Non-AC" : "AC Room"}
                          </span>
                        </td>

                        {/* Booking Scheme */}
                        <td className="py-3.5 px-5 font-bold">
                          <Badge variant={room.bookingType === "MONTHLY" ? "success" : "info"} size="sm">
                            {room.bookingType || "MONTHLY"}
                          </Badge>
                        </td>

                        {/* Capacity */}
                        <td className="py-3.5 px-5 font-bold text-slate-650">
                          <span className="font-extrabold">{room.currentOccupancy}</span> / {room.capacity} beds occupied
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-5 font-extrabold text-slate-900">
                          ₹{(room.price || room.monthlyPrice || 0).toLocaleString()}
                          <span className="block text-[8px] font-semibold text-slate-400 mt-0.5">₹{(room.dailyPrice || 500).toLocaleString()}/day rate</span>
                        </td>

                        {/* Live Status */}
                        <td className="py-3.5 px-5">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-extrabold uppercase tracking-wider ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownId(activeDropdownId === room.id ? null : room.id);
                              }}
                              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-150 active:scale-95 border border-transparent hover:border-slate-200/50 shadow-none cursor-pointer"
                              aria-label="Action Menu"
                            >
                              <MoreVertical size={16} className="stroke-[2.5]" />
                            </button>

                            {activeDropdownId === room.id && (
                              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-100 rounded-xl shadow-xl z-30 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                {/* Edit Details */}
                                <button
                                  onClick={() => openEditModal(room)}
                                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-650 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <Pencil size={13} className="text-blue-500 stroke-[2.5]" />
                                  <span>Edit Details</span>
                                </button>

                                {/* Toggle Maintenance */}
                                <button
                                  onClick={() => toggleRoomMaintenance(room)}
                                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-650 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <Wrench size={13} className={`${room.isAvailable ? "text-amber-500" : "text-emerald-500"} stroke-[2.5]`} />
                                  <span>{room.isAvailable ? "Set Maintenance" : "Set Available"}</span>
                                </button>

                                <div className="border-t border-slate-100 my-1" />

                                {/* Delete Room */}
                                <button
                                  onClick={() => handleDeleteRoom(room)}
                                  className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 size={13} className="text-rose-500 stroke-[2.5]" />
                                  <span>Delete Room</span>
                                </button>
                              </div>
                            )}
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

        {/* Bottom pagination & summary */}
        <div className="bg-white border border-slate-150 rounded-3xl p-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Summary stats */}
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Showing <span className="text-slate-700 font-extrabold">{filteredRooms.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to{" "}
            <span className="text-slate-700 font-extrabold">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredRooms.length)}
            </span>{" "}
            of <span className="text-slate-700 font-extrabold">{filteredRooms.length}</span> units found
            {rooms.length !== filteredRooms.length && (
              <span className="normal-case font-medium text-slate-400"> (filtered from {rooms.length} total inventory)</span>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              {/* Prev Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200/70 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:text-slate-300 transition-all duration-150"
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} className="stroke-[2.5]" />
              </button>

              {/* Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-extrabold transition-all duration-150 ${
                    currentPage === page
                      ? "bg-slate-900 text-white shadow-sm scale-105"
                      : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/70"
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200/70 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:text-slate-300 transition-all duration-150"
                aria-label="Next Page"
              >
                <ChevronRight size={16} className="stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ─── ROOMS DIALOG CREATOR & EDITOR MODAL ─── */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          {/* Backdrop Blur */}
          <div
            onClick={() => setShowRoomModal(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Container with scrolling support */}
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative z-10 transform transition-all animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                <span>🏢</span> {modalMode === 'edit' ? `Modify Room Details` : `Register New Room`}
              </h3>
              <button
                onClick={() => setShowRoomModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-bold text-rose-700 mb-4">
                <span>⚠️</span> {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-bold text-emerald-800 mb-4 animate-pulse">
                <span>✅</span> {successMsg}
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
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Room Descriptor Title *</label>
                  <input
                    type="text"
                    required
                    value={roomForm.title}
                    onChange={(e) => setRoomForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Ex: AC Premium Suite"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700"
                  />
                </div>

                {/* Monthly Rent */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monthly Rent Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    value={roomForm.price}
                    onChange={(e) => setRoomForm(p => ({ ...p, price: parseFloat(e.target.value) || 0, monthlyPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700"
                  />
                </div>

                {/* Daily Rent */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Daily Rent Rate (₹) *</label>
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
                    <option value="AC">AC Premium Room</option>
                  </select>
                </div>

                {/* Booking Scheme */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Booking Scheme *</label>
                  <select
                    value={roomForm.bookingType}
                    onChange={(e) => setRoomForm(p => ({ ...p, bookingType: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700"
                  >
                    <option value="MONTHLY">Monthly Stay Plan</option>
                    <option value="DAILY">Daily Booking Plan</option>
                  </select>
                </div>

                {/* Max Beds Capacity */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Max Bed Capacity *</label>
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
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Floor Location *</label>
                  <select
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm(p => ({ ...p, floor: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700"
                  >
                    <option value="0">Ground Floor</option>
                    <option value="1">1st Floor</option>
                    <option value="2">2nd Floor</option>
                    <option value="3">3rd Floor</option>
                    <option value="4">4th Floor</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Room Description</label>
                <textarea
                  value={roomForm.description}
                  onChange={(e) => setRoomForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Ex: Cozy AC room with single beds, writing desks, storage wardrobes, and attached bath..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 placeholder:text-slate-300 h-16 resize-none"
                />
              </div>

              {/* Amenities */}
              <div className="space-y-1">
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amenities (Comma separated)</label>
                <input
                  type="text"
                  value={roomForm.amenities}
                  onChange={(e) => setRoomForm(p => ({ ...p, amenities: e.target.value }))}
                  placeholder="Ex: Bed, Fan, Wardrobe, Balcony, Wi-Fi"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700 placeholder:text-slate-350"
                />
              </div>

              {/* Initial Status */}
              <div className="space-y-1">
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Initial Status</label>
                <select
                  value={String(roomForm.isAvailable)}
                  onChange={(e) => setRoomForm(p => ({ ...p, isAvailable: e.target.value === "true" }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-700"
                >
                  <option value="true">Active & Bookable</option>
                  <option value="false">Closed / Under Maintenance</option>
                </select>
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
                  disabled={actionLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider py-2.5 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : (modalMode === 'create' ? "Register Room" : "Save Changes")}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  )
}

export default RoomsManagement
