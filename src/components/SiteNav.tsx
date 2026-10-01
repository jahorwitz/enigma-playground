export function SiteNav({ current }: { current: 'machine' | 'codebreaking' }) {
  return (
    <nav className="site-nav" aria-label="Pages">
      <a href="./" aria-current={current === 'machine' ? 'page' : undefined}>
        The machine
      </a>
      <a href="./codebreaking.html" aria-current={current === 'codebreaking' ? 'page' : undefined}>
        Breaking it
      </a>
    </nav>
  )
}
