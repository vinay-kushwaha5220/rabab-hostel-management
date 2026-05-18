import { Link } from "react-router-dom"

type Props = {
  id: number
  image: string
  title: string
  price: string
  type: string
}

const RoomCard = ({
  id,
  image,
  title,
  price,
  type,
}: Props) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">

      <img
        src={image}
        alt={title}
        className="h-56 w-full object-cover"
      />

      <div className="p-5">

        <h2 className="text-2xl font-semibold">
          {title}
        </h2>

        <p className="text-gray-500 mt-2">
          {type}
        </p>

        <div className="flex items-center justify-between mt-4">

          <span className="text-blue-600 text-xl font-bold">
            {price}
          </span>

          <Link
            to={`/rooms/${id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            View
          </Link>

        </div>

      </div>
    </div>
  )
}

export default RoomCard