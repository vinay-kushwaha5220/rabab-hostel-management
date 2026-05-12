const SearchSection = () => {
  return (
    <section className="bg-white shadow-lg rounded-xl max-w-6xl mx-auto p-6 -mt-16 relative z-10">
      
      <div className="grid md:grid-cols-4 gap-4">

        <input
          type="text"
          placeholder="Search rooms"
          className="border p-3 rounded-lg"
        />

        <select className="border p-3 rounded-lg">
          <option>AC</option>
          <option>Non AC</option>
        </select>

        <select className="border p-3 rounded-lg">
          <option>Daily</option>
          <option>Monthly</option>
        </select>

        <button className="bg-blue-600 text-white rounded-lg">
          Search
        </button>

      </div>

    </section>
  )
}

export default SearchSection