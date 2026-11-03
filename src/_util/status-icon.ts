import type { FC } from 'jinge';

import {
  AntDesignCheckCircleFilled,
  AntDesignCloseCircleFilled,
  AntDesignExclamationCircleFilled,
  AntDesignInfoCircleFilled,
} from '../icon';

export type FeedbackStatus = 'success' | 'info' | 'warning' | 'error';
const icons: Record<FeedbackStatus, FC> = {
  success: AntDesignCheckCircleFilled,
  info: AntDesignInfoCircleFilled,
  warning: AntDesignExclamationCircleFilled,
  error: AntDesignCloseCircleFilled,
};
export function statusIcon(status: FeedbackStatus) {
  return icons[status];
}
