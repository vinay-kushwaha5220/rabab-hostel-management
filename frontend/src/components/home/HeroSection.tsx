const HeroSection = () => {
  return (
    <section
      className="h-[90vh] bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1566073771259-6a8506099945')",
      }}
    >
      <div className="bg-black/60 p-10 rounded-xl text-center text-white">
        
        <h1 className="text-5xl md:text-7xl font-bold">
          Welcome to Rabab Stay
        </h1>

        <p className="mt-4 text-lg md:text-2xl">
          Affordable AC & Non-AC Rooms
        </p>

        <button className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-lg">
          Book Your Room
        </button>

      </div>
    </section>
  )
}

export default HeroSection