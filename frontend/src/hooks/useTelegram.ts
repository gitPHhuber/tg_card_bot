const tg = window.Telegram?.WebApp;

export function useTelegram() {
  return {
    tg,
    user: tg?.initDataUnsafe?.user,
    initData: tg?.initData ?? "",
    startParam: tg?.initDataUnsafe?.start_param,
    ready: () => tg?.ready(),
    expand: () => tg?.expand(),
    close: () => tg?.close(),
    haptic: tg?.HapticFeedback,
    mainButton: tg?.MainButton,
    backButton: tg?.BackButton,
  };
}
