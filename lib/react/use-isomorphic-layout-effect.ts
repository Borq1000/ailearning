import { useEffect, useLayoutEffect } from 'react'

/** useLayoutEffect в браузере, useEffect на сервере (там layout-эффекты не выполняются). */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
