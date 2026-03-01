import { useState, useEffect } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Testimonials from '@site/src/components/Testimonials';

import Heading from '@theme/Heading';
import styles from './index.module.css';

// Zamień na swój base64 placeholder (miniatura ~20px szerokości)
const HERO_PLACEHOLDER = 'data:image/webp;base64,UklGRqoAAABXRUJQVlA4IJ4AAAAwBgCdASoeABQAPzmGu1SvKSYjKA1R4CcJaAC7AEtnvhXtdtrWJSStEmX9myiC4/d49QpD80WIKtsAAP7RDdza8YVux7L42QNC6AHfvZoKaM0k0/9ocw1KO9Yd17J4InWyxUBWKFX6+tBsJs/UDdcFhz9ZYqtrDkZRRsnWd1t4Us+meT6kuH/2CeWc68jZp+nnXXXJ6uGCy9dsqPOgAA==';

function HomepageHeader() {
    const {siteConfig} = useDocusaurusContext();
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const img = new window.Image();
        // Dobiera odpowiedni obrazek zależnie od szerokości ekranu
        img.src = window.innerWidth <= 996
            ? '/img/hero-image-mobile.webp'
            : '/img/hero-image.webp';
        img.onload = () => setLoaded(true);
    }, []);

    return (
        <header className={clsx('hero hero--primary', 'heroBanner-global', styles.heroBanner)}>
            {/* Blur-up placeholder — znika gdy główny obrazek się załaduje */}
            <div
                className={clsx(
                    styles.heroBannerPlaceholder,
                    loaded && styles.heroBannerPlaceholderHidden
                )}
                style={{ '--placeholder-src': `url(${HERO_PLACEHOLDER})` }}
            />
            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                <Heading as="h1" className="hero__title">
                    {siteConfig.title}
                </Heading>
                <p className="hero__subtitle">{siteConfig.tagline}</p>
                <div className={styles.buttons}>
                    <Link
                        className={clsx('button button--lg', styles.ctaButton)}
                        to="/docs/intro">
                        Zrób ze mną formę 🏋️
                    </Link>
                </div>
            </div>
        </header>
    );
}

export default function Home() {
    const {siteConfig} = useDocusaurusContext();
    return (
        <Layout
            title={`Hello from ${siteConfig.title}`}
            description="Description will go into a meta tag in <head />">
            <HomepageHeader />
            <main>
                <HomepageFeatures />
                <Testimonials />
            </main>
        </Layout>
    );
}