import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const isAgent = user?.role === 'agent';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Helpdesk</div>
      <div className="sidebar-role">{isAgent ? 'Support agent workspace' : 'Customer portal'}</div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/tickets" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          {isAgent ? 'All tickets' : 'My tickets'}
        </NavLink>
        {!isAgent && (
          <NavLink to="/tickets/new" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            New ticket
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          {user?.first_name || user?.username}
          <br />
          <span style={{ opacity: 0.7 }}>{user?.email}</span>
        </div>
        <button className="logout-btn" onClick={logout}>Log out</button>
      </div>
    </aside>
  );
}
