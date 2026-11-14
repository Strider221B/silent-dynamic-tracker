import { useCallback, useMemo, useState } from "react";
import { DateResolutionService } from "@/services/DateResolutionService";

export interface IUseMidnightRolloverOptions {
  dateService?: DateResolutionService;
  now?: Date;
}

export interface IUseMidnightRolloverReturn {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  showRolloverModal: boolean;
  confirmYesterday: () => void;
  confirmToday: () => void;
  overrideDate: (customDate: string) => void;
  dismissModal: () => void;
}

/**
 * Hook detecting midnight late-night window and managing target date confirmation.
 */
export function useMidnightRollover(
  options: IUseMidnightRolloverOptions = {},
): IUseMidnightRolloverReturn {
  const { dateService: customService, now: customNow } = options;
  const dateService = useMemo(
    () => customService ?? new DateResolutionService(),
    [customService],
  );
  const initialNow = useMemo(() => customNow ?? new Date(), [customNow]);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    dateService.getDefaultTargetDate(initialNow),
  );
  const [showRolloverModal, setShowRolloverModal] = useState<boolean>(() =>
    dateService.isInMidnightWindow(initialNow),
  );

  const confirmYesterday = useCallback((): void => {
    setSelectedDate(dateService.getYesterdayDate());
    setShowRolloverModal(false);
  }, [dateService]);

  const confirmToday = useCallback((): void => {
    setSelectedDate(dateService.getTodayDate());
    setShowRolloverModal(false);
  }, [dateService]);

  const overrideDate = useCallback((customDate: string): void => {
    if (customDate) {
      setSelectedDate(customDate);
      setShowRolloverModal(false);
    }
  }, []);

  const dismissModal = useCallback((): void => {
    setShowRolloverModal(false);
  }, []);

  return {
    selectedDate,
    setSelectedDate,
    showRolloverModal,
    confirmYesterday,
    confirmToday,
    overrideDate,
    dismissModal,
  };
}

export default useMidnightRollover;
