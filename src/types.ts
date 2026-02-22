export interface User {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'teacher';
}

export interface Group {
  id: number;
  name: string;
}

export interface Teacher {
  id: number;
  name: string;
  username: string;
  password?: string;
}

export interface Subject {
  id: number;
  teacher_id: number;
  name: string;
  total_hours: number;
  lecture_hours: number;
  seminar_hours: number;
  lab_hours: number;
  practical_hours: number;
  groups?: Group[];
}

export interface ScheduleItem {
  id: number;
  teacher_id: number;
  date: string;
  pair_number: number;
  subject_id: number;
  group_id: number;
  lesson_type: 'lecture' | 'seminar' | 'lab' | 'practical';
  subject_name?: string;
  group_name?: string;
}

export interface Message {
  id: number;
  from_id: number;
  to_id: number;
  content: string;
  created_at: string;
  from_name?: string;
}

export interface TeacherStats {
  id: number;
  name: string;
  total: number;
  completed: number;
  remaining: number;
}
