import { defineNuxtPlugin, useRouter, useRuntimeConfig } from '#imports'
import { isNavigationFailure } from '#vue-router'
import { setup, type FacebookQuery } from 'meta-pixel'
import { minimatch } from 'minimatch'
import type { Plugin } from 'nuxt/app'

// Flag to check if the pixel is initialized
let pixelInitialized = false

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const pixels = runtimeConfig.public.metapixel
  const { $fbq, init, pageView } = setup()
  $fbq.disablePushState = true

  const router = useRouter()

  // Consent function to initialize and activate the pixel
  const consent = () => {
    if (!pixelInitialized) {
      for (const name in pixels) {
        const pixel = pixels[name]
        init(pixel.id.toString(), pixel.autoconfig)
      }
      pixelInitialized = true
      console.log('Pixel initialized and consent granted.')
    }

    // Track the page view after consent
    router.afterEach((to, _, failure) => {
      if (isNavigationFailure(failure)) return

      for (const name in pixels) {
        const pixel = pixels[name]
        const match = minimatch(to.path, pixel.pageView ?? '**')
        if (match) {
          pageView(pixel.id.toString())
        }
      }
    })
  }

  return {
    provide: {
      fbq: $fbq,
      consent, // Provide the consent function so it can be called elsewhere
    },
  }
}) as Plugin<{ fbq: FacebookQuery, consent: () => void }>