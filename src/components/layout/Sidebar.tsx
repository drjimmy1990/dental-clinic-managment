'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: string;
  badgeClass?: string;
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: 'الرئيسية',
    items: [
      { href: '/', icon: '📊', label: 'لوحة التحكم' },
      { href: '/appointments', icon: '📅', label: 'المواعيد' },
      { href: '/patients', icon: '🧑‍⚕️', label: 'المرضى' },
    ],
  },
  {
    label: 'مالية',
    items: [
      { href: '/payments', icon: '💰', label: 'المدفوعات' },
      { href: '/debts', icon: '💳', label: 'الديون' },
      { href: '/expenses', icon: '💸', label: 'المصاريف' },
    ],
  },
  {
    label: 'عمليات',
    items: [
      { href: '/lab', icon: '🧪', label: 'معمل التركيبات' },
      { href: '/stock', icon: '📦', label: 'المخزن' },
      { href: '/maintenance', icon: '🔧', label: 'صيانة الأجهزة' },
    ],
  },
  {
    label: 'إدارة',
    items: [
      { href: '/salaries', icon: '👤', label: 'مرتبات' },
      { href: '/reports', icon: '📈', label: 'تقارير' },
      { href: '/settings', icon: '⚙️', label: 'الإعدادات' },
    ],
  },
];

interface SidebarProps {
  clinicName?: string;
  doctorName?: string;
  userRole?: string;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ clinicName, doctorName, userRole, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">🦷</div>
            <div>
              <div className="logo-name">DentaCare Pro</div>
              <div className="logo-sub">{clinicName || 'عيادة أسنان'}</div>
            </div>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {navSections.map((section) => {
            if (userRole === 'assistant' || userRole === 'technician') {
              if (section.label === 'مالية' || section.label === 'إدارة') return null;
            }
            return (
              <div className="nav-section" key={section.label}>
              <div className="nav-label">{section.label}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                  onClick={() => {
                    if (window.innerWidth <= 900) onToggle();
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                  {item.badge && (
                    <span className={`nav-badge ${item.badgeClass || ''}`}>{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <div className="doctor-card">
            <div className="doctor-avatar">
              {doctorName ? doctorName.charAt(0) : 'د'}
            </div>
            <div>
              <div className="doctor-name">{doctorName || 'د. الطبيب'}</div>
              <div className="doctor-role">طبيب أسنان</div>
            </div>
            <div style={{ marginRight: 'auto', width: 8, height: 8, background: 'var(--green)', borderRadius: '50%' }} />
          </div>
        </div>
      </aside>

      <button className="sidebar-toggle" onClick={onToggle}>
        ☰
      </button>
    </>
  );
}
