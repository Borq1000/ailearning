'use client'

import dynamic from 'next/dynamic'

/** three.js и drei загружаются только вместе со сценой, а не с основным бандлом урока. */
export const LazyVectorScene = dynamic(() => import('./VectorScene').then((m) => m.VectorScene), { ssr: false })
