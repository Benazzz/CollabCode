import {
  ArrowUpRight,
  Code2,
  Compass,
  FolderGit2,
  GitFork as Github,
  LogOut,
  Menu,
  Plus,
  Settings2,
  Users,
  X,
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { paths } from '@/config/paths'
import type { Tables } from '@/types/database'

export function AppShell({
  profile,
  signedIn,
  signingOut,
  onSignOut,
}: {
  profile?: Tables<'profiles'> | null
  signedIn: boolean
  signingOut: boolean
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const page = location.pathname.startsWith('/people')
    ? 'People'
    : location.pathname.startsWith('/workspace')
      ? 'My workspace'
      : location.pathname.startsWith('/settings')
        ? 'Your profile'
        : location.pathname.startsWith('/auth')
          ? 'Welcome'
          : 'Discover'
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-symbol">
            <Code2 size={23} />
          </span>
          collab<span className="brand-light">code</span>
          <span className="brand-dot">.</span>
        </Link>
        <button
          className="icon-button mobile-close"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
        <div className="nav-caption">THE COMMON GROUND</div>
        <nav aria-label="Main navigation">
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `nav-item ${isActive || location.pathname === '/' ? 'active' : ''}`
            }
            onClick={() => setOpen(false)}
          >
            <Compass size={19} />
            Explore projects<span className="nav-mark">↗</span>
          </NavLink>
          <NavLink to="/people" className="nav-item" onClick={() => setOpen(false)}>
            <Users size={19} />
            Find your people
          </NavLink>
          <div className="nav-divider" />
          <div className="nav-caption">YOUR CORNER</div>
          <NavLink to="/workspace" className="nav-item" onClick={() => setOpen(false)}>
            <FolderGit2 size={19} />
            My workspace
          </NavLink>
          <NavLink to="/settings" className="nav-item" onClick={() => setOpen(false)}>
            <Settings2 size={19} />
            My profile
          </NavLink>
        </nav>
        <div className="sidebar-note">
          <span className="note-seal" aria-hidden="true">
            共
          </span>
          <p>
            A little curiosity.
            <br />A shared ambition.
            <br />
            <strong>Something worth building.</strong>
          </p>
          <Link to={paths.createProject} onClick={() => setOpen(false)}>
            Plant an idea <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          {signedIn ? (
            <>
              <Link to={paths.settings} className="viewer">
                <Avatar name={profile?.full_name} url={profile?.avatar_url} />
                <span>
                  <strong>{profile?.full_name || 'Your profile'}</strong>
                  <small>@{profile?.username || 'developer'}</small>
                </span>
              </Link>
              <button
                className="button secondary small sidebar-logout"
                onClick={onSignOut}
                disabled={signingOut}
              >
                <LogOut size={17} aria-hidden="true" />
                {signingOut ? 'Logging out…' : 'Log out'}
              </button>
            </>
          ) : (
            <Link to={paths.login} className="guest-signin">
              <Github size={19} />
              <span>
                Find your place.
                <strong>
                  Join the community <ArrowUpRight size={13} />
                </strong>
              </span>
            </Link>
          )}
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              The community <span>/</span> <strong>{page}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="community-note">
              <span className="status-dot" />
              Made for building together
            </span>
            <Link to={paths.createProject} className="button primary small">
              <Plus size={16} />
              New project
            </Link>
            {signedIn && (
              <button className="button secondary small" onClick={onSignOut} disabled={signingOut}>
                <LogOut size={16} aria-hidden="true" />
                {signingOut ? 'Logging out…' : 'Log out'}
              </button>
            )}
          </div>
        </header>
        <main id="main" tabIndex={-1} className="main-content">
          <Outlet />
        </main>
        <footer className="footer">
          <span>
            CollabCode <span className="footer-dot">•</span> Made of shared ideas.
          </span>
          <span>
            Benas Subačius & Gustas Čemerka <span aria-hidden="true">↗</span>
          </span>
        </footer>
      </div>
    </div>
  )
}
