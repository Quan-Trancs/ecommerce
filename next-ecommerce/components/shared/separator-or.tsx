import { ReactNode } from 'react'

const SeparatorOr = ({ children }: { children: ReactNode }) => {
  return (
    <div className='h-5 border-b my-5 text-center w-full border-gray-300'>
      <span className='bg-background absolute left-1/2 -translate-x-1/2 mt-2 text-[#565959] px-2 text-xs'>
        {children ?? 'or'}
      </span>
    </div>
  )
}

export default SeparatorOr
