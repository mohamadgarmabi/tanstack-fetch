type CodeFile = {
  name: string
  code: string
}

type ShowcaseOutput = {
  name: string
  code: string
}

type ShowcaseItem = {
  id: string
  label: string
  lead: string
  files: CodeFile[]
  output: ShowcaseOutput
}

type FeatureItem = {
  title: string
  text: string
}

type PackageItem = {
  title: string
  spec: string
  text: string
  tags: string[]
  href: string
}

type CompareMark = 'yes' | 'partial' | 'no'

type CompareRow = {
  feature: string
  href: string
  fetch: CompareMark
  axios: CompareMark
  ky: CompareMark
  ofetch: CompareMark
}

type FooterColumn = {
  title: string
  links: { label: string; href: string }[]
}

type PillLink = {
  label: string
  href: string
}

type WhyItem = {
  title: string
  text: string
}

type TestimonialItem = {
  quote: string
  author: string
  role: string
}

type StackBlitzLink = {
  label: string
  href: string
  docs: string
}

type StatItem = {
  value: string
  label: string
  href?: string
}

export type {
  CodeFile,
  CompareMark,
  CompareRow,
  FeatureItem,
  FooterColumn,
  PackageItem,
  PillLink,
  ShowcaseItem,
  ShowcaseOutput,
  StackBlitzLink,
  StatItem,
  TestimonialItem,
  WhyItem,
}
