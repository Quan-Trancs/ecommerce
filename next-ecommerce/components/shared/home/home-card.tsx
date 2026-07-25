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
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {cards.map((card) => (
        <section key={card.title} className='store-section flex flex-col'>
          <h3 className='font-display mb-4 text-xl font-bold tracking-tight'>
            {card.title}
          </h3>
          <div className='grid flex-1 grid-cols-2 gap-3'>
            {card.items.map((item) => (
              <Link
                href={item.href}
                key={item.name}
                className='group flex flex-col rounded-xl bg-muted/50 p-2 transition hover:bg-muted'
              >
                <div className='relative mx-auto aspect-square w-full overflow-hidden rounded-lg bg-white'>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes='160px'
                    className='object-contain p-2 transition duration-300 group-hover:scale-105'
                  />
                </div>
                <p className='mt-2 truncate text-center text-sm font-medium'>
                  {item.name}
                </p>
              </Link>
            ))}
          </div>
          {card.link && (
            <Link
              href={card.link.href}
              className='mt-4 text-sm font-semibold text-sky-700 hover:text-amber-700 hover:underline'
            >
              {card.link.text}
            </Link>
          )}
        </section>
      ))}
    </div>
  )
}
