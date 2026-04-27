'use client';

import { useState } from 'react';
import { updateToothStatus } from '@/lib/actions/dental';
import { TOOTH_STATUSES } from '@/lib/validations/schemas';
import type { ToothStatus, DentalRecord } from '@/types';

// FDI tooth numbering: upper right (18-11), upper left (21-28), lower left (38-31), lower right (41-48)
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT = [38, 37, 36, 35, 34, 33, 32, 31];
const LOWER_RIGHT = [41, 42, 43, 44, 45, 46, 47, 48];

interface DentalChartProps {
  patientId: string;
  initialRecords: DentalRecord[];
}

export default function DentalChart({ patientId, initialRecords }: DentalChartProps) {
  const [records, setRecords] = useState<Record<number, DentalRecord>>(
    Object.fromEntries(initialRecords.map(r => [r.tooth_number, r]))
  );
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const getToothStatus = (num: number): ToothStatus => {
    return records[num]?.status || 'healthy';
  };

  const getToothClass = (status: ToothStatus): string => {
    const classMap: Record<ToothStatus, string> = {
      healthy: 'healthy',
      filled: 'filled',
      crowned: 'crowned',
      extracted: 'extracted',
      root_canal: 'root-canal',
      needs_work: 'needs-work',
    };
    return classMap[status];
  };

  const handleToothClick = (num: number) => {
    setSelectedTooth(selectedTooth === num ? null : num);
  };

  const handleStatusChange = async (status: ToothStatus) => {
    if (!selectedTooth) return;
    setSaving(true);

    const result = await updateToothStatus(patientId, selectedTooth, status);

    if (result.success) {
      setRecords(prev => ({
        ...prev,
        [selectedTooth]: {
          ...prev[selectedTooth],
          patient_id: patientId,
          tooth_number: selectedTooth,
          status,
          id: prev[selectedTooth]?.id || '',
          clinic_id: prev[selectedTooth]?.clinic_id || '',
          notes: prev[selectedTooth]?.notes || null,
          updated_at: new Date().toISOString(),
        },
      }));
    }

    setSaving(false);
    setSelectedTooth(null);
  };

  const renderRow = (teeth: number[]) => (
    <div className="tooth-row">
      {teeth.map((num, i) => {
        const status = getToothStatus(num);
        const isSelected = selectedTooth === num;
        return (
          <div key={num}>
            <div
              className={`tooth ${getToothClass(status)} ${isSelected ? 'selected' : ''}`}
              onClick={() => handleToothClick(num)}
              style={isSelected ? { borderColor: 'var(--cyan)', transform: 'scale(1.15)', zIndex: 5, boxShadow: '0 0 12px rgba(0,212,255,0.5)' } : undefined}
              title={`${num} - ${TOOTH_STATUSES[status].label}`}
            >
              <span>{TOOTH_STATUSES[status].label.charAt(0)}</span>
              <span className="tooth-num">{num}</span>
            </div>
            {i === 7 && <div className="tooth-sep" style={{ display: 'inline-block' }} />}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">🦷 خريطة الأسنان</span>
        {saving && <span style={{ fontSize: 12, color: 'var(--gold)' }}>جاري الحفظ...</span>}
      </div>
      <div className="card-body">
        <div className="tooth-map">
          {/* Upper teeth */}
          <div style={{ display: 'flex', gap: 4 }}>
            {renderRow(UPPER_RIGHT)}
            <div style={{ width: 16 }} />
            {renderRow(UPPER_LEFT)}
          </div>

          <div style={{ width: '100%', borderBottom: '2px solid var(--border)', margin: '8px 0' }} />

          {/* Lower teeth */}
          <div style={{ display: 'flex', gap: 4 }}>
            {renderRow(LOWER_RIGHT)}
            <div style={{ width: 16 }} />
            {renderRow(LOWER_LEFT)}
          </div>
        </div>

        {/* Status selector */}
        {selectedTooth && (
          <div style={{
            padding: 16, margin: '12px 16px', background: 'var(--bg3)',
            borderRadius: 12, border: '1px solid var(--border2)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>
              سن رقم {selectedTooth} — اختر الحالة:
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(Object.entries(TOOTH_STATUSES) as [ToothStatus, { label: string; color: string }][]).map(
                ([key, val]) => (
                  <button
                    key={key}
                    className={`btn btn-sm badge-${val.color}`}
                    style={{
                      background: `rgba(${key === 'healthy' ? '0,214,143' : key === 'filled' || key === 'crowned' ? '0,200,180' : key === 'extracted' || key === 'needs_work' ? '255,77,109' : '124,92,191'},0.2)`,
                      border: getToothStatus(selectedTooth) === key ? '2px solid var(--teal)' : '1px solid transparent',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    onClick={() => handleStatusChange(key)}
                    disabled={saving}
                  >
                    {val.label}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="tooth-legend">
          {(Object.entries(TOOTH_STATUSES) as [ToothStatus, { label: string; color: string }][]).map(
            ([key, val]) => (
              <div className="legend-item" key={key}>
                <div
                  className="legend-dot"
                  style={{
                    background: key === 'healthy' ? 'var(--green)' :
                      key === 'filled' ? 'var(--teal)' :
                        key === 'crowned' ? 'var(--gold)' :
                          key === 'extracted' || key === 'needs_work' ? 'var(--red)' :
                            'var(--purple)'
                  }}
                />
                {val.label}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
