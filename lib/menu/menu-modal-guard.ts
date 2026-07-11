/** Blocks silent menu polling / realtime refresh while a product modal is open. */
let modalDepth = 0

export function registerMenuModalOpen(): () => void {
  modalDepth += 1
  return () => {
    modalDepth = Math.max(0, modalDepth - 1)
  }
}

export function isMenuModalBlockingRefresh(): boolean {
  return modalDepth > 0
}
