'use client';

interface TopbarProps {
  onAddClick?: () => void;
}

export default function Topbar({ onAddClick }: TopbarProps) {
  const now = new Date();
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const months = ['يناير', 'فبراير', 'مارس', 'ابريل', 'مايو', 'يونيو', 'يوليو', 'اغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const dateStr = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div className="topbar">
      <div className="topbar-title">
        <span>🦷</span> عيادة أسنان
      </div>
      <div className="topbar-date">{dateStr}</div>
      <div className="topbar-search">
        <span>🔍</span>
        <input type="text" placeholder="بحث عن مريض..." />
      </div>
      <div className="topbar-btn" title="إشعارات">🔔</div>
      <div className="topbar-btn" title="إضافة" onClick={onAddClick}>➕</div>
    </div>
  );
}
