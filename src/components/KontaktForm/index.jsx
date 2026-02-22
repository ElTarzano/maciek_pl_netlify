import styles from './kontakt.module.css';

const ContactCard = ({ icon, title, value, href }) => (
    <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel="noopener noreferrer"
        className={styles.contactCard}
    >
        <span className={styles.contactIcon}>{icon}</span>
        <div className={styles.contactCardText}>
            <strong>{title}</strong>
            <p>{value}</p>
        </div>
    </a>
);

const FloatingInput = ({ id, name, type = 'text', label, required }) => (
    <div className={styles.floatGroup}>
        <input
            type={type}
            id={id}
            name={name}
            required={required}
            placeholder=" "
            className={styles.floatInput}
        />
        <label htmlFor={id} className={styles.floatLabel}>
            {label}{required && ' *'}
        </label>
    </div>
);

const FloatingSelect = ({ id, name, label, children }) => (
    <div className={styles.floatGroup}>
        <select
            id={id}
            name={name}
            className={`${styles.floatInput} ${styles.floatSelect}`}
            defaultValue=""
        >
            {children}
        </select>
        <label htmlFor={id} className={`${styles.floatLabel} ${styles.floatLabelSelect}`}>
            {label}
        </label>
    </div>
);

const FloatingTextarea = ({ id, name, label, required, rows = 5 }) => (
    <div className={styles.floatGroup}>
    <textarea
        id={id}
        name={name}
        required={required}
        placeholder=" "
        rows={rows}
        className={`${styles.floatInput} ${styles.floatTextarea}`}
    />
        <label htmlFor={id} className={styles.floatLabel}>
            {label}{required && ' *'}
        </label>
    </div>
);

export default function KontaktForm() {
    return (
        <div className={styles.wrapper}>

            {/* ── Karty kontaktowe ── */}
            <div className={styles.contactGrid}>
                <ContactCard
                    icon="📧"
                    title="E-mail"
                    value="maciek@example.com"
                    href="mailto:maciek@example.com"
                />
                <ContactCard
                    icon="📞"
                    title="Telefon"
                    value="+48 123 456 789"
                    href="tel:+48123456789"
                />
                <ContactCard
                    icon="👤"
                    title="Facebook"
                    value="Maciek Orłowski"
                    href="https://facebook.com/"
                />
            </div>

            {/* ── Formularz ── */}
            <form
                name="contact"
                method="POST"
                action="/sukces"
                data-netlify="true"
                netlify-honeypot="bot-field"
                className={styles.form}
            >
                <input type="hidden" name="form-name" value="contact" />
                <div style={{ display: 'none' }}>
                    <label>Don't fill this out: <input name="bot-field" /></label>
                </div>

                <div className={styles.formRow}>
                    <FloatingInput id="name"  name="name"  label="Imię i nazwisko" required />
                    <FloatingInput id="email" name="email" label="Adres e-mail" type="email" required />
                </div>

                <FloatingSelect id="subject" name="subject" label="Temat">
                    <option value="" disabled>Wybierz temat…</option>
                    <option value="trening-indywidualny">🏋️ Trening indywidualny</option>
                    <option value="zajecia-grupowe">👥 Zajęcia grupowe</option>
                    <option value="plan-treningowy">📋 Plan treningowy</option>
                    <option value="wspolpraca">🤝 Współpraca</option>
                    <option value="pytanie">❓ Pytanie ogólne</option>
                    <option value="inne">💬 Inne</option>
                </FloatingSelect>

                <FloatingTextarea id="message" name="message" label="Wiadomość" required />

                <button type="submit" className={styles.button}>
                    <span>Wyślij wiadomość</span>
                    <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </form>
        </div>
    );
}