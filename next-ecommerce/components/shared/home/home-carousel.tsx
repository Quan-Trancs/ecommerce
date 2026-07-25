'use client'

import * as React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import Image from 'next/image'
import Autoplay from 'embla-carousel-autoplay'
import Link from 'next/link'
import { Button } from '@/components/ui/custom/custom-button'
import { APP_NAME } from '@/lib/constants'

export function HomeCarousel({
  items,
}: {
  items: {
    image: string
    url: string
    title: string
    buttonCaption: string
  }[]
}) {
  const plugin = React.useRef(
    Autoplay({
      delay: 4500,
      stopOnInteraction: true,
    })
  )

  return (
    <Carousel
      dir='ltr'
      plugins={[plugin.current]}
      className='w-full'
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
      opts={{ loop: true }}
    >
      <CarouselContent>
        {items.map((item, index) => (
          <CarouselItem key={item.title}>
            <div className='relative min-h-[58vh] w-full overflow-hidden md:min-h-[68vh]'>
              <Image
                src={item.image}
                alt={item.title}
                fill
                priority={index === 0}
                className='object-cover ken-zoom'
                sizes='100vw'
              />
              <div className='absolute inset-0 bg-gradient-to-r from-chrome/85 via-chrome/55 to-chrome/15' />
              <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(240,161,26,0.18),transparent_45%)]' />

              <div className='page-shell relative z-10 flex h-full min-h-[58vh] items-center px-4 md:min-h-[68vh] md:px-8'>
                <div className='fade-up max-w-xl space-y-4 text-white md:space-y-5'>
                  <p className='font-display text-sm font-semibold uppercase tracking-[0.22em] text-primary md:text-base'>
                    {APP_NAME}
                  </p>
                  <h1 className='font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl'>
                    {item.title}
                  </h1>
                  <p className='max-w-md text-base text-white/80 md:text-lg'>
                    Discover everyday essentials with clear categories and
                    smart filters—built like the stores you already trust.
                  </p>
                  <Button
                    asChild
                    className='mt-2 h-11 rounded-full px-7 text-base font-semibold shadow-lg shadow-amber-900/20'
                  >
                    <Link href={item.url}>{item.buttonCaption}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className='left-3 border-0 bg-white/90 text-chrome hover:bg-white md:left-6' />
      <CarouselNext className='right-3 border-0 bg-white/90 text-chrome hover:bg-white md:right-6' />
    </Carousel>
  )
}
