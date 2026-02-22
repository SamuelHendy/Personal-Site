import { Outlet, NavLink } from 'react-router-dom'
import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function AdminLayout() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-lg px-4">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <Menu className="h-5 w-5" />
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink></li>
              <li><NavLink to="/albums" className={({ isActive }) => isActive ? 'active' : ''}>Albums</NavLink></li>
              <li><NavLink to="/watches" className={({ isActive }) => isActive ? 'active' : ''}>Watches</NavLink></li>
              <li><NavLink to="/fishtank" className={({ isActive }) => isActive ? 'active' : ''}>Fishtank</NavLink></li>
            </ul>
          </div>
          <NavLink to="/" className="btn btn-ghost text-xl font-bold">Admin Panel</NavLink>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-1">
            <li><NavLink to="/" end className={({ isActive }) => isActive ? 'active font-semibold' : ''}>Dashboard</NavLink></li>
            <li><NavLink to="/albums" className={({ isActive }) => isActive ? 'active font-semibold' : ''}>Albums</NavLink></li>
            <li><NavLink to="/watches" className={({ isActive }) => isActive ? 'active font-semibold' : ''}>Watches</NavLink></li>
            <li><NavLink to="/fishtank" className={({ isActive }) => isActive ? 'active font-semibold' : ''}>Fishtank</NavLink></li>
          </ul>
        </div>
        <div className="navbar-end">
          <button className="btn btn-ghost btn-circle" onClick={logout} title="Sign out">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
      <main className="container mx-auto p-6 max-w-7xl">
        <Outlet />
      </main>
    </div>
  )
}
