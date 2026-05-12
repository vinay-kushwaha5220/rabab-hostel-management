import { useParams } from "react-router-dom"
import { rooms } from "../data/rooms"

const RoomDetailsPage = () => {
  const { id } = useParams()

  const room = rooms.find(
    (room) => room.id === Number(id)
  )

  if (!room) {
    return <h1>Room not found</h1>
  }

  return (
    <div className="min-h-screen p-10 bg-gray-100">

      <div className="max-w-5xl mx-auto bg-white rounded-xl overflow-hidden shadow-lg">

        <img
          src={room.image}
          alt={room.title}
          className="w-full h-[500px] object-cover"
        />

        <div className="p-8">

          <h1 className="text-5xl font-bold">
            {room.title}
          </h1>

          <p className="mt-4 text-xl text-gray-600">
            {room.type}
          </p>

          <p className="mt-4 text-3xl text-blue-600 font-bold">
            {room.price}
          </p>

          <button className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg text-lg">
            Book Now
          </button>

        </div>

      </div>

    </div>
  )
}

export default RoomDetailsPage