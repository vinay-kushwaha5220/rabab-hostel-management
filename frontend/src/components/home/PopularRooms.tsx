import RoomCard from "../common/RoomCard"

const PopularRooms = () => {
  return (
    <section className="py-20 px-6 bg-gray-100">

      <h1 className="text-4xl font-bold text-center mb-10">
        Popular Rooms
      </h1>

      <div className="grid md:grid-cols-3 gap-8">

        <RoomCard
          image="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85"
          title="Deluxe AC Room"
          price="₹1500/day"
          type="AC Room"
        />

        <RoomCard
          image="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
          title="Standard Non-AC"
          price="₹800/day"
          type="Non AC"
        />

        <RoomCard
          image="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2"
          title="Monthly Stay"
          price="₹6000/month"
          type="Monthly"
        />

      </div>

    </section>
  )
}

export default PopularRooms