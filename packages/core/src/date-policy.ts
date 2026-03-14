import type {
  GridDateBadge,
  GridEditorSpec,
  GridValidator,
} from "./contracts";

type DatePolicyEditor<Row> = Extract<GridEditorSpec<Row>, { type: "date" }>;

export type GridDatePolicyMessages = {
  invalidDate?: string;
  disabledDate?: string;
  outOfRangeDate?: string;
};

export type GridDatePolicyConfig<Row> = {
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disableWeekends?: boolean;
  disabledDates?: Iterable<string>;
  holidayDates?: Iterable<string>;
  specialDates?: Iterable<string>;
  disabledDate?: (date: string, row: Row) => boolean;
  dateBadge?: (date: string, row: Row) => GridDateBadge | undefined;
  messages?: GridDatePolicyMessages;
};

export type GridDatePolicy<Row> = {
  editor: DatePolicyEditor<Row>;
  validators: GridValidator<Row>[];
  isDateDisabled: (date: string, row: Row) => boolean;
  getDateBadge: (date: string, row: Row) => GridDateBadge | undefined;
};

const defaultDatePolicyMessages: Required<GridDatePolicyMessages> = {
  invalidDate: "The date must use YYYY-MM-DD.",
  disabledDate: "The selected date is not allowed.",
  outOfRangeDate: "The date is outside the allowed range.",
};

function toDateLookup(values?: Iterable<string>) {
  return new Set(values ?? []);
}

export function isIsoGridDateValue(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isWeekendGridDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const day = date.getDay();
  return day === 0 || day === 6;
}

export function createGridDatePolicy<Row>(
  config: GridDatePolicyConfig<Row>,
): GridDatePolicy<Row> {
  const disabledDateLookup = toDateLookup(config.disabledDates);
  const holidayDateLookup = toDateLookup(config.holidayDates);
  const specialDateLookup = toDateLookup(config.specialDates);
  const messages = {
    ...defaultDatePolicyMessages,
    ...config.messages,
  };

  const isDateDisabled = (date: string, row: Row) => {
    if (config.disableWeekends && isWeekendGridDate(date)) {
      return true;
    }

    if (disabledDateLookup.has(date)) {
      return true;
    }

    return config.disabledDate?.(date, row) ?? false;
  };

  const getDateBadge = (date: string, row: Row) => {
    const customBadge = config.dateBadge?.(date, row);
    if (customBadge) {
      return customBadge;
    }

    if (holidayDateLookup.has(date)) {
      return "holiday";
    }

    if (config.disableWeekends && isWeekendGridDate(date)) {
      return "weekend";
    }

    if (specialDateLookup.has(date)) {
      return "special";
    }

    return undefined;
  };

  const validators: GridValidator<Row>[] = [
    (value) =>
      isIsoGridDateValue(value) ? null : messages.invalidDate,
    (value, row) => {
      if (!isIsoGridDateValue(value)) {
        return null;
      }

      if (config.minDate && value < config.minDate) {
        return messages.outOfRangeDate;
      }

      if (config.maxDate && value > config.maxDate) {
        return messages.outOfRangeDate;
      }

      return isDateDisabled(value, row) ? messages.disabledDate : null;
    },
  ];

  return {
    editor: {
      type: "date",
      placeholder: config.placeholder,
      minDate: config.minDate,
      maxDate: config.maxDate,
      disabledDate: isDateDisabled,
      dateBadge: getDateBadge,
    },
    validators,
    isDateDisabled,
    getDateBadge,
  };
}

export function createGridDateEditorSpec<Row>(
  config: GridDatePolicyConfig<Row>,
) {
  return createGridDatePolicy(config).editor;
}

export function createGridDateValidators<Row>(
  config: GridDatePolicyConfig<Row>,
) {
  return createGridDatePolicy(config).validators;
}
