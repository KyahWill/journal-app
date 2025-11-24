'use client'

import { useState, useEffect } from 'react'

interface MobileDetectionResult {
  isMobile: boolean
  isIOS: boolean
  isAndroid: boolean
  isSafari: boolean
  isChrome: boolean
}

export function useMobileDetection(): MobileDetectionResult {
  const [detection, setDetection] = useState<MobileDetectionResult>({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const userAgent = navigator.userAgent.toLowerCase()
    
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
    const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent)

    setDetection({
      isMobile,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
    })
  }, [])

  return detection
}
