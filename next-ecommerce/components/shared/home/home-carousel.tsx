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
      className='relative z-0 w-full overflow-hidden'
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
      opts={{ loop: true }}
    >
      <CarouselContent>
        {items.map((item, index) => (
          <CarouselItem key={item.title}>
            <div className='relative min-h-[56vh] w-full overflow-hidden md:min-h-[64vh]'>
              <Image
                src={item.image}
                alt={item.title}
                fill
                priority={index === 0}
                className='object-cover ken-zoom'
                sizes='100vw'
              />
              <div className='absolute inset-0 bg-gradient-to-r from-chrome via-chrome/70 to-transparent' />
              <div className='absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(240,161,26,0.22),transparent_42%)]' />

              <div className='page-shell relative z-10 flex h-full min-h-[56vh] items-center px-4 md:min-h-[64vh] md:px-8'>
                <div className='fade-up max-w-xl space-y-5 text-white'>
                  <p className='brick-label !text-primary'>{APP_NAME}</p>
                  <h1 className='font-display text-4xl font-extrabold leading-[1.02] tracking-tight md:text-6xl lg:text-7xl'>
                    {item.title}
                  </h1>
                  <p className='max-w-md text-base text-white/75 md:text-lg'>
                    Snap together categories, filters, and finds—modular shopping
                    built for everyday essentials.
                  </p>
                  <div className='flex flex-wrap gap-3 pt-1'>
                    <Link href={item.url} className='brick-cta'>
                      {item.buttonCaption}
                    </Link>
                    <Link href='/search' className='brick-cta-ghost'>
                      Browse catalog
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className='left-3 z-20 h-10 w-10 border border-white/20 bg-chrome text-white hover:bg-primary hover:text-chrome md:left-6' />
      <CarouselNext className='right-3 z-20 h-10 w-10 border border-white/20 bg-chrome text-white hover:bg-primary hover:text-chrome md:right-6' />
    </Carousel>
  )
}
