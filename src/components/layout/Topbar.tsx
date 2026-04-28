'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { searchPatients } from '@/lib/actions/patients';

interface TopbarProps {
  onAddClick?: () => void;
}

export default function Topbar({ onAddClick }: TopbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const months = ['يناير', 'فبراير', 'مارس', 'ابريل', 'مايو', 'يونيو', 'يوليو', 'اغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const dateStr = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        const results = await searchPatients(searchQuery);
        setSearchResults(results || []);
        setIsSearching(false);
        setShowSearchDropdown(true);
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePatientSelect = (id: string) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    router.push(`/patients/${id}`);
  };

  return (
    <div className="topbar">
      <div className="topbar-title">
        <span>🦷</span> عيادة أسنان
      </div>
      <div className="topbar-date">{dateStr}</div>
      
      <div className="topbar-search" ref={searchRef} style={{ position: 'relative' }}>
        <span>🔍</span>
        <input 
          type="text" 
          placeholder="بحث عن مريض بالاسم أو الكود..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchResults.length > 0) setShowSearchDropdown(true);
          }}
        />
        {showSearchDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 8,
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 100,
            overflow: 'hidden'
          }}>
            {isSearching ? (
              <div style={{ padding: 12, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>جاري البحث...</div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: 12, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>لا توجد نتائج</div>
            ) : (
              searchResults.map(p => (
                <div 
                  key={p.id}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--teal3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => handlePatientSelect(p.id)}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{p.full_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>الكود: {p.code}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <div 
          className="topbar-btn" 
          title="إشعارات"
          onClick={() => {
            setShowNotifications(!showNotifications);
            setShowAddMenu(false);
          }}
        >
          🔔
        </div>
        {showNotifications && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 8,
            width: 250,
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 100,
            padding: 16,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>لا توجد إشعارات جديدة</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>أنت على اطلاع بكل جديد</div>
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <div 
          className="topbar-btn" 
          title="إضافة" 
          onClick={() => {
            setShowAddMenu(!showAddMenu);
            setShowNotifications(false);
          }}
        >
          ➕
        </div>
        {showAddMenu && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 8,
            width: 200,
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 100,
            overflow: 'hidden'
          }}>
            <div 
              style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--teal3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => {
                setShowAddMenu(false);
                router.push('/patients');
              }}
            >
              <span>👤</span> إضافة مريض جديد
            </div>
            <div 
              style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--teal3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => {
                setShowAddMenu(false);
                router.push('/appointments');
              }}
            >
              <span>📅</span> حجز موعد جديد
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
