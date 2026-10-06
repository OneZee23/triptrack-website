import { ArrowDown, ArrowRight, Check, MessageCircle, Monitor, Smartphone } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from '../i18n/useTranslation';
import { usePageMeta } from '../components/PageMeta';
import { roadmapContent } from './roadmapContent';
import './roadmap.css';

export default function Roadmap() {
  const { lang, href } = useTranslation();
  const copy = roadmapContent[lang];
  usePageMeta('/roadmap');

  return (
    <div className="roadmap-page">
      <header className="roadmap-intro">
        <div className="roadmap-dateline">
          <span>{copy.eyebrow}</span>
          <span>{copy.updated} <time dateTime="2026-10-06">{copy.date}</time></span>
        </div>
        <h1>{copy.title}</h1>
        <p className="roadmap-lead">{copy.lead}</p>
        <nav className="roadmap-index" aria-label={copy.navigation}>
          {copy.sections.map((section, index) => (
            <a key={section.id} href={`#${section.id}`} className={`roadmap-index-link roadmap-${section.id}`}>
              <span className="roadmap-index-number" aria-hidden="true">0{index + 1}</span>
              <span><strong>{section.label}</strong><small>{section.summary}</small></span>
              <ArrowDown size={18} aria-hidden="true" />
            </a>
          ))}
        </nav>
      </header>

      <section id="available" className="roadmap-section roadmap-available" aria-labelledby="available-title">
        <div className="roadmap-section-heading">
          <span className="roadmap-section-number" aria-hidden="true">01</span>
          <h2 id="available-title">{copy.sections[0].label}</h2>
          <p>{copy.availableLead}</p>
        </div>
        <div className="roadmap-section-content">
          <article className="roadmap-web-card">
            <div className="roadmap-card-topline">
              <span className="roadmap-platform"><Monitor size={17} aria-hidden="true" />{copy.web.platform}</span>
              <span className="roadmap-status"><Check size={13} aria-hidden="true" />{copy.web.status}</span>
            </div>
            <h3>{copy.web.title}</h3>
            <p>{copy.web.description}</p>
            <ul className="roadmap-checklist">
              {copy.web.features.map(feature => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}
            </ul>
            <Link to={href('/app/trips')} className="roadmap-link roadmap-web-link">
              {copy.web.action}<ArrowRight size={18} aria-hidden="true" />
            </Link>
          </article>
          <article className="roadmap-card roadmap-phone-card">
            <div className="roadmap-card-topline">
              <span className="roadmap-platform"><Smartphone size={17} aria-hidden="true" />{copy.phone.platform}</span>
              <span className="roadmap-status"><Check size={13} aria-hidden="true" />{copy.phone.status}</span>
            </div>
            <h3>{copy.phone.title}</h3>
            <p>{copy.phone.description}</p>
            <ul className="roadmap-checklist">
              {copy.phone.features.map(feature => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}
            </ul>
            <div className="roadmap-phone-actions">
              <Link to={href('/features')} className="roadmap-link">
                {copy.phone.action}<ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a href="https://apps.apple.com/app/id6760650361" target="_blank" rel="noopener noreferrer" className="roadmap-history-link">
                {copy.releaseHistory}
              </a>
            </div>
          </article>
          <article className="roadmap-card roadmap-phone-card">
            <div className="roadmap-card-topline">
              <span className="roadmap-platform"><Smartphone size={17} aria-hidden="true" />{copy.pro.platform}</span>
              <span className="roadmap-status"><Check size={13} aria-hidden="true" />{copy.pro.status}</span>
            </div>
            <h3>{copy.pro.title}</h3>
            <p>{copy.pro.description}</p>
            <ul className="roadmap-checklist">
              {copy.pro.features.map(feature => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}
            </ul>
            <p className="roadmap-release-note">{copy.pro.note}</p>
            <a href="https://apps.apple.com/app/id6760650361" target="_blank" rel="noopener noreferrer" className="roadmap-link">
              {copy.pro.action}<ArrowRight size={18} aria-hidden="true" />
            </a>
          </article>
        </div>
      </section>

      <section id="in-progress" className="roadmap-section roadmap-in-progress" aria-labelledby="progress-title">
        <div className="roadmap-section-heading">
          <span className="roadmap-section-number" aria-hidden="true">02</span>
          <h2 id="progress-title">{copy.sections[1].label}</h2>
          <p>{copy.progressLead}</p>
        </div>
        <div className="roadmap-section-content">
          {copy.inProgress.map(item => (
            <article key={item.title} className="roadmap-card roadmap-progress-card">
              <div className="roadmap-card-topline">
                <span className="roadmap-platform">{item.platform}</span>
                <span className="roadmap-status">{item.status}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <ul className="roadmap-detail-list">
                {item.features.map(feature => <li key={feature}>{feature}</li>)}
              </ul>
              <p className="roadmap-release-note">{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="later" className="roadmap-section roadmap-later" aria-labelledby="later-title">
        <div className="roadmap-section-heading">
          <span className="roadmap-section-number" aria-hidden="true">03</span>
          <h2 id="later-title">{copy.sections[2].label}</h2>
          <p>{copy.laterLead}</p>
        </div>
        <div className="roadmap-future-list">
          {copy.later.map(item => (
            <article key={item.title} className="roadmap-future-item">
              <div><h3>{item.title}</h3><p>{item.description}</p></div>
              <span className="roadmap-status">{copy.ideaStatus}</span>
            </article>
          ))}
        </div>
      </section>
      <aside className="roadmap-feedback" aria-labelledby="feedback-title">
        <div>
          <h2 id="feedback-title">{copy.feedbackTitle}</h2>
          <p>{copy.feedbackDescription}</p>
        </div>
        <a href="https://t.me/triptrack_app" target="_blank" rel="noopener noreferrer" className="roadmap-feedback-link">
          <MessageCircle size={18} aria-hidden="true" />{copy.feedbackAction}<ArrowRight size={18} aria-hidden="true" />
        </a>
      </aside>
    </div>
  );
}
