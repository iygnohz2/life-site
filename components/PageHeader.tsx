import SectionContainer from './SectionContainer'

type Props = {
  eyebrow: string
  title: string
  desc: string
  children?: React.ReactNode
}

export default function PageHeader({ eyebrow, title, desc, children }: Props) {
  return (
    <SectionContainer>
      <div className="pt-16 pb-10 sm:pt-20">
        <p className="eyebrow rise">{eyebrow}</p>
        <h1
          className="rise mt-5 text-[clamp(1.9rem,4.2vw,2.7rem)] leading-[1.3] font-normal"
          style={{ animationDelay: '80ms' }}
        >
          {title}
        </h1>
        <p
          className="text-ink-2 rise mt-5 max-w-xl text-[14px] leading-[2]"
          style={{ animationDelay: '160ms' }}
        >
          {desc}
        </p>
      </div>
      {children}
    </SectionContainer>
  )
}
