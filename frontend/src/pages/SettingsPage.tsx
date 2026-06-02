import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContextV2"
import api from "../services/apiV2"
import {
  User,
  Mail,
  Phone,
  Bell,
  Building,
  Search,
  Plus,
  Trash2,
  Edit3,
  AlertCircle,
  CheckCircle2,
  Lock,
  Wrench
} from "lucide-react"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import LoadingSpinner from "../components/ui/LoadingSpinner"

type ActiveTabType = 'account' | 'rooms'

const SettingsPage = () => {
  const { user, updateUser } = useAuth()
  const isAdmin = user?.role === "ADMIN"

  const [activeTab, setActiveTab] = useState<ActiveTabType>("account")

  // Account preferences state
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    notifications: true,
    emailUpdates: true,
  })

  // Set values when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }))
    }
  }, [user])

  // Functional profile update states
  const [savingAccount, setSavingAccount] = useState(false)
  const [accountError, setAccountError] = useState("")
  const [accountSuccess, setAccountSuccess] = useState("")

  // Profile avatar photo update state
  const [profileAvatar, setProfileAvatar] = useState("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80")

  useEffect(() => {
    if (user) {
      if (user.avatar) {
        setProfileAvatar(user.avatar)
      } else {
        setProfileAvatar("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80")
      }
    }
  }, [user])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      setAccountError("Profile photo must be less than 2MB in size.")
      return
    }

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64Data = reader.result as string
      setProfileAvatar(base64Data)
      if (user?.id) {
        try {
          // Immediately save to the backend database
          const response = await api.put("/v2/auth/profile", {
            name: user.name,
            phone: user.phone,
            avatar: base64Data,
          })
          if (response.data?.user) {
            updateUser(response.data.user)
            localStorage.setItem("customAvatar_" + user.id, base64Data)
          }
          setAccountSuccess("Profile photo updated successfully! 📷")
          setTimeout(() => setAccountSuccess(""), 3000)
        } catch (err: any) {
          console.error("Photo upload failed:", err)
          setAccountError("Failed to save profile photo to server.")
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = async () => {
    if (user?.id) {
      try {
        const response = await api.put("/v2/auth/profile", {
          name: user.name,
          phone: user.phone,
          avatar: null,
        })
        if (response.data?.user) {
          updateUser(response.data.user)
          localStorage.removeItem("customAvatar_" + user.id)
        }
        setProfileAvatar("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80")
        setAccountSuccess("Profile photo removed successfully.")
        setTimeout(() => setAccountSuccess(""), 3000)
      } catch (err: any) {
        console.error("Photo remove failed:", err)
        setAccountError("Failed to remove profile photo from server.")
      }
    }
  }

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

  // Functional Profile Update Save Handler
  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      setAccountError("Full Name is required.")
      return
    }

    try {
      setSavingAccount(true)
      setAccountError("")
      setAccountSuccess("")

      // PUT call to `/v2/auth/profile`
      const response = await api.put("/v2/auth/profile", {
        name: formData.name,
        phone: formData.phone,
      })

      if (response.data?.user) {
        // Sync context & localStorage immediately
        updateUser(response.data.user)
      }

      setAccountSuccess("Your account details have been successfully saved! 🎉")
      setTimeout(() => setAccountSuccess(""), 4000)
    } catch (err: any) {
      console.error("Profile update failed:", err)
      setAccountError(err.response?.data?.message || "Failed to update profile details.")
    } finally {
      setSavingAccount(false)
    }
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
      floor: room.floor !== undefined ? room.floor : 1,
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
    if (roomSearch) {
      const searchLower = roomSearch.toLowerCase()
      const roomNum = room.roomNumber || ""
      const title = room.title || ""
      const matchNum = roomNum.toLowerCase().includes(searchLower)
      const matchTitle = title.toLowerCase().includes(searchLower)
      if (!matchNum && !matchTitle) return false
    }

    if (roomFilter === "ac" && room.roomType !== "AC") return false
    if (roomFilter === "non-ac" && room.roomType !== "NON_AC") return false
    if (roomFilter === "available" && (!room.isAvailable || room.currentOccupancy > 0)) return false
    if (roomFilter === "maintenance" && room.isAvailable) return false
    if (roomFilter === "full" && room.currentOccupancy < room.capacity) return false

    return true
  })

  return (
    <div className="min-h-screen bg-slate-50/40 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">

      {/* Background Accent Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/5 to-indigo-600/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">


        {/* Dynamic Tab Switcher */}
        {isAdmin && (
          <div className="flex gap-2 border-b border-slate-200 pb-px">
            <button
              onClick={() => setActiveTab("account")}
              className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer ${activeTab === "account"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
            >
              <User size={14} />
              Profile Preferences
            </button>
            <button
              onClick={() => setActiveTab("rooms")}
              className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer ${activeTab === "rooms"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
            >
              <Building size={14} />
              Hostel Room Directory
            </button>
          </div>
        )}

        {/* TAB 1: ACCOUNT PREFERENCES */}
        {activeTab === "account" && (
          <div className="max-w-3xl space-y-6">

            {/* Notifications panel */}
            {accountSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-pulse shadow-sm">
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                <span>{accountSuccess}</span>
              </div>
            )}
            {accountError && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-semibold text-rose-800 flex items-center gap-2 shadow-sm">
                <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
                <span>{accountError}</span>
              </div>
            )}

            <form onSubmit={handleAccountSave} className="space-y-6">
              {/* Profile Settings */}
              <Card className="p-6 border border-slate-150 bg-white rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2.5 mb-6 border-b border-slate-50 pb-4">
                  <User size={18} className="text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Personal Details</h2>
                </div>

                {/* Profile Photo Uploader Section */}
                <div className="flex flex-col sm:flex-row items-center gap-5 mb-8 pb-6 border-b border-slate-100">
                  <div className="relative group flex-shrink-0">
                    <img
                      src={profileAvatar}
                      alt="Profile Avatar"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                      className="w-20 h-20 rounded-full object-cover border border-slate-200 shadow-sm"
                    />
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold shadow-sm absolute inset-0 -z-10">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-center sm:text-left">
                    <h3 className="text-sm font-bold text-slate-800">Profile Photo</h3>
                    <p className="text-[10px] text-slate-400 font-medium">PNG, JPG or JPEG. Max 2MB.</p>
                    <div className="flex items-center gap-2.5 mt-2 justify-center sm:justify-start">
                      <label className="bg-blue-600 hover:bg-blue-705 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer shadow-sm shadow-blue-100 transition-all select-none active:scale-98">
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                      {(user?.avatar || localStorage.getItem("customAvatar_" + user?.id)) && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200/60 transition-all cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-500 tracking-wide">Full Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                        <User size={15} />
                      </span>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleAccountChange}
                        placeholder="Ex: John Doe"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-xs font-medium text-slate-800 transition-all bg-slate-50/20 hover:bg-white"
                      />
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-500 tracking-wide">Phone Number</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                        <Phone size={15} />
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleAccountChange}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-xs font-medium text-slate-800 transition-all bg-slate-50/20 hover:bg-white"
                      />
                    </div>
                  </div>

                  {/* Email Input - STRICTLY LOCKED / DISABLED */}
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-semibold text-slate-500 tracking-wide">Email Address</label>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Lock size={10} />
                        Read-Only Field
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                        <Mail size={15} />
                      </span>
                      <input
                        type="email"
                        name="email"
                        disabled
                        value={formData.email}
                        className="w-full pl-10 pr-10 py-2.5 border border-slate-200/50 rounded-2xl outline-none text-xs font-medium text-slate-400 bg-slate-50/80 cursor-not-allowed select-none"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-350 pointer-events-none">
                        <Lock size={14} />
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400/90 font-medium leading-relaxed mt-1">
                      Email address acts as your primary account identifier and cannot be modified. Contact management if a change is required.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Notification Settings */}
              <Card className="p-6 border border-slate-150 bg-white rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2.5 mb-6 border-b border-slate-50 pb-4">
                  <Bell size={18} className="text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Notification Channels</h2>
                </div>

                <div className="space-y-5">
                  <label className="flex items-start gap-3.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="notifications"
                      checked={formData.notifications}
                      onChange={handleAccountChange}
                      className="w-4.5 h-4.5 text-blue-600 rounded-lg focus:ring-4 focus:ring-blue-500/10 mt-0.5 border-slate-300"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">System Push Notifications</p>
                      <p className="text-[10px] text-slate-450 font-medium mt-0.5 leading-relaxed">Receive live dashboard alerts, payment logs, and stay timeline cycles</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="emailUpdates"
                      checked={formData.emailUpdates}
                      onChange={handleAccountChange}
                      className="w-4.5 h-4.5 text-blue-600 rounded-lg focus:ring-4 focus:ring-blue-500/10 mt-0.5 border-slate-300"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Transactional Email Alerts</p>
                      <p className="text-[10px] text-slate-450 font-medium mt-0.5 leading-relaxed">Receive automated monthly statements, payment invoice receipts, and contract notifications</p>
                    </div>
                  </label>
                </div>
              </Card>



              {/* Save Button */}
              <div className="flex gap-4 items-center pt-2">
                <Button
                  type="submit"
                  disabled={savingAccount}
                  className="bg-blue-600 text-white hover:bg-blue-700 rounded-2xl font-semibold text-xs px-6 py-3 shadow-md shadow-blue-100 active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {savingAccount ? "Saving Changes..." : "Save Preferences"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: HOSTEL ROOMS MANAGEMENT (ADMIN ONLY) */}
        {activeTab === "rooms" && isAdmin && (
          <div className="space-y-6">

            {/* Search & Actions Bar */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm shadow-slate-200/20 space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

                {/* Search Box */}
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                    placeholder="Search room list..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200/60 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium text-slate-700 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Add New Room Button */}
                <button
                  onClick={openCreateRoomModal}
                  className="w-full md:w-auto bg-blue-600 text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-100 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  Add New Room
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
                    className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap active:scale-95 cursor-pointer ${roomFilter === f.id
                      ? "bg-slate-900 text-white border-slate-950 shadow-sm"
                      : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200/65"
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification/Success notices */}
            {roomSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-pulse shadow-sm">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>{roomSuccess}</span>
              </div>
            )}

            {/* Rooms Table */}
            {roomsLoading ? (
              <div className="flex justify-center py-20 bg-white border border-slate-100 rounded-3xl">
                <LoadingSpinner size="lg" text="Syncing hostel room directory..." />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-20 text-center bg-white border border-slate-100 rounded-3xl flex flex-col items-center justify-center space-y-2.5 shadow-sm">
                <Building size={32} className="text-slate-350" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching rooms in directory</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 text-white text-[9px] font-bold uppercase tracking-widest border-b border-slate-800">
                        <th className="py-4 px-5 font-extrabold">Room Number</th>
                        <th className="py-4 px-5 font-extrabold">Descriptor / Title</th>
                        <th className="py-4 px-5 font-extrabold">Room Class</th>
                        <th className="py-4 px-5 font-extrabold">Max Capacity</th>
                        <th className="py-4 px-5 font-extrabold">Monthly Price</th>
                        <th className="py-4 px-5 font-extrabold">Live Status</th>
                        <th className="py-4 px-5 text-right font-extrabold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {filteredRooms.map((room) => {
                        const isMaint = !room.isAvailable
                        const isFull = room.currentOccupancy >= room.capacity
                        const isOccupied = room.currentOccupancy > 0

                        let statusLabel = "AVAILABLE"
                        let statusColor = "bg-emerald-50 text-emerald-700 border border-emerald-100/60"

                        if (isMaint) {
                          statusLabel = "MAINTENANCE"
                          statusColor = "bg-rose-50 text-rose-700 border border-rose-100/60"
                        } else if (isFull) {
                          statusLabel = "FULL"
                          statusColor = "bg-orange-50 text-orange-700 border border-orange-100/60"
                        } else if (isOccupied) {
                          statusLabel = "BOOKED"
                          statusColor = "bg-blue-50 text-blue-700 border border-blue-100/60"
                        }

                        return (
                          <tr key={room.id} className="hover:bg-slate-50/40 transition-colors">
                            {/* Room Number */}
                            <td className="py-4 px-5 font-bold text-slate-900">
                              <span className="text-sm font-black text-blue-600 bg-blue-50/60 px-3 py-1.5 rounded-xl">
                                {room.roomNumber}
                              </span>
                            </td>

                            {/* Title */}
                            <td className="py-4 px-5 font-semibold text-slate-800">
                              {room.title}
                              <span className="block text-[9px] font-semibold text-slate-400 mt-1">{room.floor === 0 ? "Ground Floor" : `Floor ${room.floor || 1}`}</span>
                            </td>

                            {/* Class */}
                            <td className="py-4 px-5 font-bold">
                              <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider border ${room.roomType === "AC"
                                ? "bg-sky-50 text-sky-700 border-sky-100"
                                : "bg-slate-50 text-slate-650 border-slate-100"
                                }`}>
                                {room.roomType === "NON_AC" ? "Non-AC" : "AC"}
                              </span>
                            </td>

                            {/* Capacity */}
                            <td className="py-4 px-5 font-bold text-slate-600">
                              {room.currentOccupancy} / {room.capacity} beds occupied
                            </td>

                            {/* Price */}
                            <td className="py-4 px-5 font-extrabold text-slate-900">
                              ₹{(room.price || room.monthlyPrice || 0).toLocaleString()}
                              <span className="block text-[8px] font-semibold text-slate-400 mt-1">₹{(room.dailyPrice || 500).toLocaleString()}/day</span>
                            </td>

                            {/* Live Status */}
                            <td className="py-4 px-5">
                              <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-extrabold uppercase tracking-wider ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-5 text-right">
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => openEditRoomModal(room)}
                                  className="bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
                                >
                                  <Edit3 size={11} className="inline mr-1" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => toggleRoomMaintenance(room)}
                                  className="bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
                                >
                                  <Wrench size={11} className="inline mr-1" />
                                  {room.isAvailable ? "Maint" : "Open"}
                                </button>
                                <button
                                  onClick={() => handleDeleteRoom(room)}
                                  className="bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
                                >
                                  <Trash2 size={11} className="inline mr-1" />
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
            <div className="bg-white border border-slate-150 rounded-3xl p-4 shadow-sm text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {filteredRooms.length} of {rooms.length} Rooms in directory
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
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Container */}
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative z-10 transform transition-all animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2 leading-none">
                <Building size={16} className="text-blue-600" />
                {modalMode === 'edit' ? `Edit Room Details` : `Create New Room`}
              </h3>
              <button
                onClick={() => setShowRoomModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-105 text-slate-400 transition-colors flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Notifications */}
            {roomError && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-bold text-rose-700 mb-4 flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-500" />
                <span>{roomError}</span>
              </div>
            )}
            {roomSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-bold text-emerald-800 mb-4 flex items-center gap-2 animate-pulse">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>{roomSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRoomFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">

                {/* Room Number */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm(p => ({ ...p, roomNumber: e.target.value }))}
                    placeholder="Ex: 105"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700"
                  />
                </div>

                {/* Room Title */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Room Title *</label>
                  <input
                    type="text"
                    required
                    value={roomForm.title}
                    onChange={(e) => setRoomForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Ex: AC Premium Suite"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700"
                  />
                </div>

                {/* Base Monthly Rent */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monthly Rent Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={roomForm.price}
                    onChange={(e) => setRoomForm(p => ({ ...p, price: parseFloat(e.target.value) || 0, monthlyPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700"
                  />
                </div>

                {/* Base Daily Price */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Daily Rent Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={roomForm.dailyPrice}
                    onChange={(e) => setRoomForm(p => ({ ...p, dailyPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700"
                  />
                </div>

                {/* Class */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Room Class *</label>
                  <select
                    value={roomForm.roomType}
                    onChange={(e) => setRoomForm(p => ({ ...p, roomType: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700"
                  >
                    <option value="NON_AC">Non AC Room</option>
                    <option value="AC">AC Room</option>
                  </select>
                </div>

                {/* Max Beds Capacity */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Max Capacity (Beds) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm(p => ({ ...p, capacity: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700"
                  />
                </div>

                {/* Floor */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Floor *</label>
                  <select
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm(p => ({ ...p, floor: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700"
                  >
                    <option value="0">Ground Floor</option>
                    <option value="1">1st Floor</option>
                    <option value="2">2nd Floor</option>
                    <option value="3">3rd Floor</option>
                    <option value="4">4th Floor</option>
                  </select>
                </div>

                {/* Initial Status */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Availability status</label>
                  <select
                    value={String(roomForm.isAvailable)}
                    onChange={(e) => setRoomForm(p => ({ ...p, isAvailable: e.target.value === "true" }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700"
                  >
                    <option value="true">Active & Available</option>
                    <option value="false">Closed / Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Room Description</label>
                <textarea
                  value={roomForm.description}
                  onChange={(e) => setRoomForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Ex: Cozy AC room with study table, wardrobe, and balcony..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium text-slate-700 placeholder:text-slate-350 h-16 resize-none"
                />
              </div>

              {/* Amenities */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Room Amenities</label>
                <input
                  type="text"
                  value={roomForm.amenities}
                  onChange={(e) => setRoomForm(p => ({ ...p, amenities: e.target.value }))}
                  placeholder="Ex: Bed, Fan, Wardrobe, Balcony"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700 placeholder:text-slate-350"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="flex-1 bg-slate-50 text-slate-500 border border-slate-200 text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl hover:bg-slate-150 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roomActionLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl shadow-md shadow-blue-100 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
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
