const FacilitiesSection = () => {
  return (
    <section className="py-20 px-6">

      <h1 className="text-4xl font-bold text-center mb-10">
        Facilities
      </h1>

      <div className="grid md:grid-cols-4 gap-6 text-center">

        <div className="shadow-lg p-6 rounded-xl">
          WiFi
        </div>

        <div className="shadow-lg p-6 rounded-xl">
          Parking
        </div>

        <div className="shadow-lg p-6 rounded-xl">
          CCTV Security
        </div>

        <div className="shadow-lg p-6 rounded-xl">
          Power Backup
        </div>

      </div>

    </section>
  )
}

export default FacilitiesSection