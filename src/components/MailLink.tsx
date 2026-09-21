/** A mailto link that Cloudflare's Email Address Obfuscation leaves alone.
 *
 *  Cloudflare rewrites every e-mail it finds in HTML into
 *  `/cdn-cgi/l/email-protection#…` and injects an inline decode script to
 *  restore it in the browser. Our CSP has no `unsafe-inline`, so that script
 *  is blocked and the address stays scrambled («[email protected]»). The
 *  `<!--email_off-->` markers are Cloudflare's own opt-out; JSX cannot emit
 *  comments, hence the innerHTML. The address and label are ours, not user
 *  input. */
export default function MailLink({ email, label, className }: { email: string; label: string; className?: string }) {
  const html = `<!--email_off--><a href="mailto:${email}" class="${className ?? ''}">${label}</a><!--/email_off-->`;
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
