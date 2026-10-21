'use client'

import dynamic from 'next/dynamic'

/** three.js и drei загружаются только вместе со сценой, а не с основным бандлом урока. */
export const LazyMatrixScene = dynamic(() => import('./MatrixScene').then((m) => m.MatrixScene), { ssr: false })
