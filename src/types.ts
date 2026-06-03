export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: string; // Category ID
}

export interface AppUsage {
  name: string;
  time: number; // in minutes
  icon: string;
}

export interface LocationTime {
  id: string;
  name: string;
  time: number; // in hours
  category: string; // Category ID
}

export interface RoutineItem {
  id: string;
  time: string;
  activity: string;
  type: string; // Category ID
  completed?: boolean;
}

export interface WellnessReminder {
  id: string;
  type: 'water' | 'food' | 'sleep' | 'rest' | 'medicine';
  label: string;
  time: string;
  completed: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: string; // Category ID
  completed?: boolean;
}

export type AlarmCategory = Category;

export interface Alarm {
  id: string;
  title: string;
  time: string;
  category: string; // ID of the category
  enabled: boolean;
  days: string[]; // e.g., ['Lun', 'Mar']
}