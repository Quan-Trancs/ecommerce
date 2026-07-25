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
      {cards.map((card, index) => (
        <section
          key={card.title}
          className='brick brick-stud flex flex-col p-4 md:p-5'
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className='section-band mt-1'>
            <h3 className='brick-title text-lg md:text-xl'>{card.title}</h3>
          </div>
          <div className='grid flex-1 grid-cols-2 gap-2.5'>
            {card.items.map((item) => (
              <Link
                href={item.href}
                key={item.name}
                className='group flex flex-col p-1.5 transition hover:bg-chrome/[0.03]'
              >
                <div className='brick-media relative mx-auto aspect-square w-full bg-white'>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes='160px'
                    className='object-contain p-2 transition duration-300 group-hover:scale-105'
                  />
                </div>
                <p className='mt-2 truncate text-center text-xs font-semibold text-chrome md:text-sm'>
                  {item.name}
                </p>
              </Link>
            ))}
          </div>
          {card.link && (
            <Link href={card.link.href} className='brick-link mt-4'>
              {card.link.text} →
            </Link>
          )}
        </section>
      ))}
    </div>
  )
}
