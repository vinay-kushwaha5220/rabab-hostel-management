const Navbar = () => {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-blue-600">
        Rabab Stay
      </h1>

      <div className="flex gap-6 font-medium">
        <a href="/">Home</a>
        <a href="/rooms">Rooms</a>
        <a href="/contact">Contact</a>
        <a href="/login">Login</a>
      </div>
    </nav>
  )
}

export default Navbar