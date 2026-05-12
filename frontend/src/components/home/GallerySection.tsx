const GallerySection = () => {
  return (
    <section className="py-20 px-6 bg-gray-100">

      <h1 className="text-4xl font-bold text-center mb-10">
        Gallery
      </h1>

      <div className="grid md:grid-cols-3 gap-6">

        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945"
          className="rounded-xl h-72 object-cover w-full"
        />

        <img
          src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85"
          className="rounded-xl h-72 object-cover w-full"
        />

        <img
          src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
          className="rounded-xl h-72 object-cover w-full"
        />

      </div>

    </section>
  )
}

export default GallerySection