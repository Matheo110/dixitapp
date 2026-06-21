export default function Navbar({ right }) {
  return (
    <nav style={{ backgroundColor: '#1B2B5E' }} className="sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span
          className="font-display font-bold text-white tracking-widest uppercase text-lg select-none"
        >
          DIXITAPP
        </span>
        {right && <div className="flex items-center gap-4">{right}</div>}
      </div>
    </nav>
  )
}
