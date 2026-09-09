interface Props {
  title: string
  description: string
  path?: string
  image?: string
  noIndex?: boolean
}

/**
 * React 19 hoists <title>, <meta>, and <link> automatically when rendered
 * anywhere in the tree, so this component works without a helmet lib.
 */
export function SeoHead({ title, description, path, image, noIndex }: Props) {
  const siteUrl = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
  const url = path && siteUrl ? `${siteUrl}${path.startsWith('/') ? path : `/${path}`}` : undefined
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noIndex ? <meta name="robots" content="noindex,nofollow" /> : <meta name="robots" content="index,follow" />}
      {url && <link rel="canonical" href={url} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {url && <meta property="og:url" content={url} />}
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </>
  )
}
