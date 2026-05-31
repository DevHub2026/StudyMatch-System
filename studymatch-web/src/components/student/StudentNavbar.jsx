import GlobalSearch       from '../shared/GlobalSearch'
import NotificationDropdown from '../../pages/shared/NotificationDropDownPage'
import MessageDropdown      from '../../pages/shared/MessageDropDownPage'
import ProfileDropdown      from '../../pages/shared/ProfileDropDownPage'

export default function StudentNavbar() {
  return (
    <header style={{
      height: 64, background: 'white', borderBottom: '1px solid #F0F0F4',
      display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16,
      fontFamily: 'DM Sans, sans-serif', flexShrink: 0,
    }}>
      <GlobalSearch placeholder="Search tutors, subjects, sessions..." />
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <NotificationDropdown />
        <MessageDropdown />
        <ProfileDropdown />
      </div>
    </header>
  )
}