import { Card, CardContent, CardFooter } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

type CardItem = {
  title: string
  link: { text: string; href: string }
  items: {
    name: string
    href: string
    image: string
    items?: string[]
  }[]
}

export function HomeCard({ cards }: { cards: CardItem[] }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 md:gap-4'>
      {cards.map((card) => (
        <Card key={card.title} className='rounded-none flex flex-col'>
          <CardContent className='p-4 flex-1'>
            <h3 className='text-xl font-bold mb-4'>{card.title}</h3>
            <div className='grid grid-cols-2 gap-4'>
              {card.items.map((item) => (
                <Link
                  href={item.href}
                  key={item.name}
                  className='flex flex-col'
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={120}
                    height={120}
                    className='aspect-square object-scale-down max-w-full h-auto mx-auto'
                  />
                  <p className='text-sm text-center whitespace-nowrap overflow-hidden text-ellipsis'>
                    {item.name}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
          {card.link && (
            <CardFooter>
              <Link href={card.link.href} className='m-4 block'>
                {card.link.text}
              </Link>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  )
}
