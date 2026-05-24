import { Search } from 'lucide-react'
import NotificationDropdown from '../../pages/shared/NotificationDropDownPage'
import MessageDropdown      from '../../pages/shared/MessageDropDownPage'
import ProfileDropdown      from '../../pages/shared/ProfileDropDownPage'

export default function StudentNavbar() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .sn-bar * { box-sizing: border-box; }
        .sn-bar {
          height: 64px;
          background: white;
          border-bottom: 1px solid #F0F0F4;
          display: flex;
          align-items: center;
          padding: 0 28px;
          gap: 16px;
          font-family: 'DM Sans', sans-serif;
        }
        .sn-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F8F9FB;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          padding: 8px 14px;
          flex: 1;
          max-width: 420px;
          transition: border-color .15s;
        }
        .sn-search:focus-within {
          border-color: #7C3AED;
          background: white;
        }
        .sn-search input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 13.5px;
          color: #374151;
          width: 100%;
          font-family: 'DM Sans', sans-serif;
        }
        .sn-search input::placeholder { color: #9CA3AF; }
      `}</style>

      <header className="sn-bar">
        {/* Search */}
        <div className="sn-search">
          <Search size={15} color="#9CA3AF" />
          <input placeholder="Search subjects, tutors, sessions..." />
        </div>

        <div style={{ flex: 1 }} />

        {/* Right: dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NotificationDropdown />
          <MessageDropdown />
          <ProfileDropdown />
        </div>
      </header>
    </>
  )
}