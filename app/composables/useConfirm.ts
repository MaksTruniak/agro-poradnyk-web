const _state = reactive({
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Видалити',
  danger: true,
  resolve: null as ((v: boolean) => void) | null,
})

export const useConfirm = () => {
  const confirm = (message: string, options?: { title?: string; confirmLabel?: string; danger?: boolean }): Promise<boolean> => {
    return new Promise((resolve) => {
      _state.message = message
      _state.title = options?.title ?? 'Підтвердження'
      _state.confirmLabel = options?.confirmLabel ?? 'Видалити'
      _state.danger = options?.danger ?? true
      _state.resolve = resolve
      _state.open = true
    })
  }

  const accept = () => { _state.open = false; _state.resolve?.(true) }
  const cancel = () => { _state.open = false; _state.resolve?.(false) }

  return { confirm, state: _state, accept, cancel }
}
