/**
 * i18n Type Definitions
 * 
 * Type-safe translations for next-intl
 */

import ru from '../messages/ru.json';

// Use type safe message keys with `next-intl`
type Messages = typeof ru;

declare global {
  // eslint-disable-next-line no-unused-vars
  interface IntlMessages extends Messages {}
}

