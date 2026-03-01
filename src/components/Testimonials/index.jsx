import React from 'react';
import styles from './Testimonials.module.css';

const TESTIMONIALS = [
  {
    name: 'Mark Erikson',
    handle: '@acemarke',
    avatar: 'https://unavatar.io/x/acemarke',
    text: "We've been using Docusaurus for all the Redux org docs sites for the last couple years, and it's great! We've been able to focus on content, customize features, and it Just Works.",
    date: 'Oct 26, 2021',
  },
  {
    name: 'Supabase',
    handle: '@supabase',
    avatar: 'https://unavatar.io/x/supabase',
    text: "We've been using V2 since January and it has been great — we spend less time building documentation and more time building 🛳",
    date: 'Nov 18, 2020',
  },
  {
    name: 'Dr.Electron',
    handle: '@Dr_Electron',
    avatar: 'https://unavatar.io/x/Dr_Electron',
    text: 'The #IOTA wiki is now part of the @docusaurus showcase. We even have the honor of being a favorite. It helped us a lot to improve the documentation.',
    date: 'Oct 11, 2021',
  },
  {
    name: 'Maël',
    handle: '@arcanis',
    avatar: 'https://unavatar.io/x/arcanis',
    text: "I've used Docusaurus for two websites this year, and I've been very happy about the v2. Looks good, and simple to setup.",
    date: 'Jan 20, 2021',
  },
  {
    name: 'Paul Armstrong',
    handle: '@paularmstrong',
    avatar: 'https://unavatar.io/x/paularmstrong',
    text: 'Continue to be impressed and excited about Docusaurus v2 alpha releases. Already using the sidebar items generator to help monorepo workspace devs create their own doc pages.',
    date: 'Apr 27, 2021',
  },
  {
    name: 'Kent C. Dodds',
    handle: '@kentcdodds',
    avatar: 'https://unavatar.io/x/kentcdodds',
    text: 'testing-library.com just got a nice update! My favorite new feature: dark mode!! 🌑/☀️',
    date: 'Nov 4, 2020',
  },
  {
    name: 'Max Lynch',
    handle: '@maxlynch',
    avatar: 'https://unavatar.io/x/maxlynch',
    text: 'Docusaurus v2 doubles as a really nice little static site generator tool for content-focused sites, love it 👏',
    date: 'Mar 25, 2021',
  },
  {
    name: "Debbie O'Brien",
    handle: '@debs_obrien',
    avatar: 'https://unavatar.io/x/debs_obrien',
    text: 'Been doing a lot of work with @docusaurus lately and I have to say it is really fun to work with. A lot of really cool features. 🔥',
    date: 'Mar 24, 2021',
  },
  {
    name: 'swyx',
    handle: '@swyx',
    avatar: 'https://unavatar.io/x/swyx',
    text: "Happy to share Temporal's first open source sponsorship — of @docusaurus! It has been a huge boon to our docs team.",
    date: 'Jul 23, 2021',
  },
];

function XIcon() {
  return (
      <svg className={styles.xIcon} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.735-8.836L2.25 2.25h6.797l4.256 5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
  );
}

function TestimonialCard({ name, handle, avatar, text, date }) {
  return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <img className={styles.avatar} src={avatar} alt={name} loading="lazy" />
          <div className={styles.meta}>
            <div className={styles.name}>{name}</div>
            <div className={styles.handle}>{handle}</div>
          </div>
          <XIcon />
        </div>
        <div className={styles.stars}>★★★★★</div>
        <p className={styles.text}>{text}</p>
        <div className={styles.date}>{date}</div>
      </div>
  );
}

export default function Testimonials({ title = 'Loved by many engineers', subtitle = '', label = 'Testimonials' }) {
  // Duplicate for seamless infinite loop
  const doubled = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
      <section className={styles.section}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {title.split('engineers').map((part, i, arr) =>
                i < arr.length - 1
                    ? <React.Fragment key={i}>{part}<span className={styles.titleAccent}>engineers</span></React.Fragment>
                    : part
            )}
          </h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        <div className={styles.wrapper}>
          <div className={styles.scroll}>
            {doubled.map((t, i) => (
                <TestimonialCard key={i} {...t} />
            ))}
          </div>
        </div>
      </section>
  );
}