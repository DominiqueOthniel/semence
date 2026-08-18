import type { SavingsGoal } from '../types';
import { roundMoney, todayISO } from './money';

export function addMonthsISO(fromISO: string, months: number): string {
  const [y, m, d] = fromISO.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setMonth(date.getMonth() + Math.max(0, months));
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function planGoal(input: {
  target: number;
  months?: number | null;
  monthlyBudget?: number | null;
}): { target: number; months: number | null; monthlyBudget: number | null; dueDate: string | null } {
  const target = Math.max(0, roundMoney(input.target));
  let months = input.months && input.months > 0 ? Math.round(input.months) : null;
  let monthly = input.monthlyBudget && input.monthlyBudget > 0 ? roundMoney(input.monthlyBudget) : null;

  if (target > 0 && months && !monthly) {
    monthly = Math.ceil(target / months);
  } else if (target > 0 && monthly && !months) {
    months = Math.max(1, Math.ceil(target / monthly));
  } else if (!target && months && monthly) {
    return {
      target: months * monthly,
      months,
      monthlyBudget: monthly,
      dueDate: addMonthsISO(todayISO(), months),
    };
  }

  return {
    target,
    months,
    monthlyBudget: monthly,
    dueDate: months ? addMonthsISO(todayISO(), months) : null,
  };
}

export function goalPace(goal: SavingsGoal) {
  const left = Math.max(0, goal.target - goal.current);
  const monthly =
    goal.monthlyBudget && goal.monthlyBudget > 0
      ? goal.monthlyBudget
      : goal.months && goal.months > 0
        ? Math.ceil(left / goal.months)
        : 0;
  const monthsLeft = monthly > 0 ? Math.max(1, Math.ceil(left / monthly)) : goal.months;
  const done = goal.target > 0 ? Math.min(1, goal.current / goal.target) : 0;
  return { left, monthly, monthsLeft, done };
}
