import { useState } from "react"
import RoomCard from "../components/common/RoomCard"
import { rooms } from "../data/rooms"

const RoomsPage = () => {
  const [filter, setFilter] = useState("All")

  const filteredRooms =
    filter === "All"
      ? rooms
      : rooms.filter((room) => room.type === filter)

  return (
    <div className="bg-gray-100 min-h-screen p-6">

      <h1 className="text-5xl font-bold text-center mb-10">
        Our Rooms
      </h1>

      <div className="flex justify-center gap-4 mb-10">

        <button
          onClick={() => setFilter("All")}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          All
        </button>

        <button
          onClick={() => setFilter("AC")}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          AC
        </button>

        <button
          onClick={() => setFilter("Non AC")}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          Non AC
        </button>

      </div>

      <div className="grid md:grid-cols-3 gap-8">

        {filteredRooms.map((room) => (
          <RoomCard
            key={room.id}
            id={room.id}
            image={room.image}
            title={room.title}
            price={room.price}
            type={room.type}
          />
        ))}

      </div>

    </div>
  )
}

export default RoomsPage