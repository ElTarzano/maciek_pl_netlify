// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Maciek Orłowski',
  tagline: 'Kompleksowy trening wspinaczkowy dla wszystkich, którzy kochają wspinanie.',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://maciektest.netlify.app/',
  baseUrl: '/',
  organizationName: 'ElTarzano',
  projectName: 'maciek_pl',
  onBrokenLinks: 'throw',

  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        href: '/img/hero-image-mobile.webp',
        as: 'image',
        media: '(max-width: 996px)',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        href: '/img/hero-image.webp',
        as: 'image',
        media: '(min-width: 997px)',
      },
    },
  ],

  i18n: {
    defaultLocale: 'pl',
    locales: ['pl'],
    localeConfigs: {
      pl: {
        label: 'Polski',
      },
    },
  },

  plugins: [
    [
      '@docusaurus/plugin-ideal-image',
      {
        quality: 70,
        max: 1030,
        min: 640,
        steps: 2,
        disableInDev: false,
      },
    ],
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      /** @type {import('@easyops-cn/docusaurus-search-local').PluginOptions} */
      ({
        hashed: true,
        language: ['en'],
        indexBlog: true,
        indexDocs: true,
        indexPages: true,
        searchBarShortcut: false,
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        removeDefaultStemmer: true,
        askAi: false,
        },
      }),
    ],
  ],

  themeConfig:
  /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
      ({
        image: 'img/maciek-social-card.jpg',
        colorMode: {
          respectPrefersColorScheme: false,
        },
        navbar: {
          title: '',
          logo: {
            alt: 'Maciek Orłowski Logo',
            src: 'img/logo.svg',
            width: 64,
            height: 64,
          },
          hideOnScroll: true,
          items: [
            {
              type: 'dropdown',
              label: 'Trening',
              position: 'left',
              items: [
                {
                  label: 'Indywidualny',
                  to: '/trening/indywidualny',
                },
                {
                  label: 'Kalkulator 1rm',
                  to: '/trening/kalkulator',
                },
                {
                  label: 'timer',
                  to: '/trening/timer',
                },
                {
                  label: 'timer2',
                  to: '/trening/timer2',
                },
                {
                  label: 'grafik',
                  to: '/trening/grafik',
                },
              ],
            },
            {
              type: 'docSidebar',
              sidebarId: 'tutorialSidebar',
              position: 'left',
              label: 'Dokumentacja',
            },
            { to: '/blog', label: 'Blog', position: 'left' },
          ],
        },
        footer: {
          style: 'dark',
          links: [
            {
              title: 'Docs',
              items: [
                {
                  label: 'Tutorial',
                  to: '/docs/intro',
                },
              ],
            },
            {
              title: 'Community',
              items: [
                {
                  label: 'Stack Overflow',
                  href: 'https://stackoverflow.com/',
                },
                {
                  label: 'Discord',
                  href: 'https://discordapp.com/',
                },
                {
                  label: 'X',
                  href: 'https://x.com/',
                },
              ],
            },
            {
              title: 'More',
              items: [
                {
                  label: 'Blog',
                  to: '/blog',
                },
                {
                  label: 'GitHub',
                  href: 'https://github.com/',
                },
              ],
            },
          ],
          copyright: `Copyright © ${new Date().getFullYear()} Maciek Orłowski`,
        },
        prism: {
          theme: prismThemes.github,
          darkTheme: prismThemes.dracula,
        },
      }),
};

export default config;