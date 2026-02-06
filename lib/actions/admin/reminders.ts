'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { revalidatePath } from 'next/cache';
import { valueToMinutes } from '@/lib/utils/reminder-schedule';

export type ReminderScheduleRow = {
  id: string;
  label: string;
  minutes_before: number;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export async function getReminderSchedules(): Promise<ReminderScheduleRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return [];
  }
  const service = await createServiceClient();
  const { data, error } = await (service.from('reminder_schedules') as any)
    .select('id, label, minutes_before, is_active, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true });
  if (error) return [];
  return (data ?? []) as ReminderScheduleRow[];
}

export async function createReminderSchedule(
  prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; created?: ReminderScheduleRow }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }
  const label = String(formData.get('label') ?? '').trim();
  const value = Number(formData.get('value'));
  const unit = (formData.get('unit') as string) || 'min';
  const minutesBefore = valueToMinutes(value, unit);
  if (!label || value <= 0 || minutesBefore <= 0) {
    return { error: 'Label and a positive value (with unit) are required' };
  }
  const service = await createServiceClient();
  const { data, error } = await (service.from('reminder_schedules') as any)
    .insert({
      label,
      minutes_before: minutesBefore,
      is_active: true,
      sort_order: 999,
    })
    .select('id, label, minutes_before, is_active, sort_order')
    .single();
  if (error) return { error: error.message };
  revalidatePath('/admin/reminders');
  return { created: data as ReminderScheduleRow };
}

export async function updateReminderSchedule(
  id: string,
  updates: { label?: string; minutes_before?: number; is_active?: boolean; sort_order?: number }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }
  const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.label !== undefined) body.label = updates.label.trim();
  if (updates.minutes_before !== undefined) body.minutes_before = updates.minutes_before;
  if (updates.is_active !== undefined) body.is_active = updates.is_active;
  if (updates.sort_order !== undefined) body.sort_order = updates.sort_order;
  const service = await createServiceClient();
  const { error } = await (service.from('reminder_schedules') as any).update(body).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/reminders');
  return {};
}

export async function deleteReminderSchedule(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }
  const service = await createServiceClient();
  const { error } = await (service.from('reminder_schedules') as any).delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/reminders');
  return {};
}

export async function toggleReminderSchedule(id: string, isActive: boolean) {
  return updateReminderSchedule(id, { is_active: isActive });
}
