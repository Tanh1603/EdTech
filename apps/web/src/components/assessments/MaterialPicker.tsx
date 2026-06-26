/**
 * MaterialPicker — cascading Lesson → Material selector.
 *
 * Given a `courseId` (derived from the selected classroom), renders:
 *   1. A lesson dropdown (fetched from the course)
 *   2. A material dropdown (fetched from the selected lesson, only `ready` ones)
 *
 * Calls `onChange(materialId | '')` whenever the selection changes.
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, FileText } from 'lucide-react';
import { fetchLessonsByCourse } from '../../services/academic';
import { fetchMaterials } from '../../services/learning';

interface MaterialPickerProps {
  /** courseId linked to the selected classroom */
  courseId: string | undefined;
  value: string;
  onChange: (materialId: string) => void;
}

export const MaterialPicker: React.FC<MaterialPickerProps> = ({ courseId, value, onChange }) => {
  const [selectedLessonId, setSelectedLessonId] = useState('');

  const { data: lessonsResp, isLoading: isLessonsLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => fetchLessonsByCourse(courseId!),
    enabled: !!courseId,
  });
  const lessons = lessonsResp?.data || [];

  const { data: materialsResp, isLoading: isMaterialsLoading } = useQuery({
    queryKey: ['materials', selectedLessonId],
    queryFn: () => fetchMaterials({ lessonId: selectedLessonId }),
    enabled: !!selectedLessonId,
  });
  const materials = (materialsResp?.data || []).filter((m) => m.status === 'ready');

  const handleLessonChange = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    onChange(''); // clear material when lesson changes
  };

  if (!courseId) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Chọn lớp học để xem tài liệu có thể dùng.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {/* Lesson picker */}
      <div className="relative">
        <select
          value={selectedLessonId}
          onChange={(e) => handleLessonChange(e.target.value)}
          disabled={isLessonsLoading}
          className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        >
          <option value="">-- Chọn bài học --</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.orderNo}. {l.title}
            </option>
          ))}
        </select>
        {isLessonsLoading && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Material picker */}
      {selectedLessonId && (
        <div className="relative">
          {isMaterialsLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2">
              <Loader2 size={12} className="animate-spin" />
              Đang tải tài liệu...
            </div>
          ) : materials.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2 italic">
              Bài học này chưa có tài liệu nào đã lập chỉ mục (status: ready).
            </p>
          ) : (
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">-- Không dùng tài liệu (AI tạo theo chủ đề) --</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  📄 {m.title}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Preview of selected material */}
      {value && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border border-primary/20 rounded-lg">
          <FileText size={12} className="text-primary shrink-0" />
          <span className="text-xs text-primary font-medium">
            AI sẽ dùng RAG từ tài liệu đã chọn để tạo câu hỏi sát nội dung học.
          </span>
        </div>
      )}
    </div>
  );
};
