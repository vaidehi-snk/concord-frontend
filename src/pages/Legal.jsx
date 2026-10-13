import { Link } from 'react-router-dom';
import { SitePage } from '../components/site';
import { useDocumentTitle } from '../lib/hooks';

// The address people write to, and who answers grievances.
export const CONTACT_EMAIL = 'vaidehi27sept@gmail.com';
const UPDATED = '13 October 2026';
const mail = (subject) => `mailto:${CONTACT_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

export function Privacy() {
  useDocumentTitle('Privacy policy');
  return (
    <SitePage title="Privacy policy" updated={UPDATED}>
      <p>
        This policy explains what Concord collects, why, who processes it for us, and the rights you have under India’s Digital Personal Data Protection Act, 2023. Concord is in pilot; this policy will be reviewed by a lawyer before general launch.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Your account:</strong> your name, work email, company name, GSTIN and state, and the answers you give when you sign up (team size, invoice volume, accounting software).
        </li>
        <li>
          <strong>Your documents:</strong> the purchase orders, challans and invoices you upload or forward. We read each file in memory and store only the fields we extract: numbers, dates, line items, totals, GSTINs and the payee bank details printed on invoices. We do not keep the original files.
        </li>
        <li>
          <strong>Your vendors:</strong> vendor names, GSTINs, contact names and emails you add, and the bank accounts seen on their invoices.
        </li>
        <li>
          <strong>What happens in your workspace:</strong> disputes, emails drafted, approvals and replies, kept as an activity log and audit trail.
        </li>
        <li>
          <strong>Technical data:</strong> IP address and request logs kept by our hosting providers for security and rate limiting.
        </li>
      </ul>
      <h2>Why we use it</h2>
      <p>Only to run Concord for you: reading documents, running checks, preparing disputes and payment plans, signing you in, keeping your account secure, and answering your support requests. We do not sell your data or use it for advertising.</p>
      <h2>Who processes it for us</h2>
      <ul>
        <li>MongoDB Atlas stores the database.</li>
        <li>Render runs the Concord server and Vercel serves the website.</li>
        <li>Google’s Gemini API reads scanned pages and photos, reads documents our rules can’t, drafts vendor emails and answers questions in Ask Concord. Only the document or the summary needed for that task is sent.</li>
      </ul>
      <p>If you need your data held only in India, tell us before you start so we can confirm what is possible.</p>
      <h2>How long we keep it</h2>
      <p>Workspace data is kept while your account is open. Sample (demo) workspaces are deleted automatically after 24 hours. When you ask us to close your account, we delete your workspace and everything in it.</p>
      <h2>Your rights</h2>
      <p>You can ask to see the personal data we hold about you, correct it, or have it erased, and you can withdraw consent at any time by closing your account. Write to us from your account’s email address.</p>
      <h2>Grievances</h2>
      <p>
        For any concern about how your data is handled, write to <a href={mail('Privacy grievance')}>{CONTACT_EMAIL}</a>. We aim to reply within 7 days. If you are not satisfied, you may approach the Data Protection Board of India.
      </p>
    </SitePage>
  );
}

export function Terms() {
  useDocumentTitle('Terms of use');
  return (
    <SitePage title="Terms of use" updated={UPDATED}>
      <p>These terms apply while Concord is in pilot. By creating a workspace you agree to them on behalf of your company.</p>
      <h2>What Concord does, and what it doesn’t</h2>
      <p>
        Concord compares your purchase orders, challans and invoices and flags differences, with the calculation shown. Its flags, payment plans, GST and MSME reminders help your team decide; they are not tax, legal or financial advice. Your company remains responsible for what it pays, files and claims. Check anything important with your CA.
      </p>
      <h2>Your data</h2>
      <p>
        Everything you upload stays yours. You give us permission to process it only to run Concord for you, as described in the <Link to="/privacy">privacy policy</Link>.
      </p>
      <h2>Acceptable use</h2>
      <ul>
        <li>Upload only documents your company is entitled to use.</li>
        <li>Keep your password and API keys private, and tell us if you think one has leaked.</li>
        <li>Don’t try to reach another company’s data, overload the service or reverse engineer it.</li>
      </ul>
      <h2>Availability</h2>
      <p>During the pilot Concord runs on shared hosting and may be slow to start or briefly unavailable. We provide it as it is, without guarantees of uptime or fitness for a particular purpose.</p>
      <h2>Fees</h2>
      <p>The Starter plan is free. Prices for paid plans are shown on the home page, are indicative during the pilot, and will not apply to you without notice.</p>
      <h2>Liability</h2>
      <p>To the extent the law allows, we are not liable for indirect losses, and our total liability is limited to the fees you paid us in the previous three months.</p>
      <h2>Ending</h2>
      <p>You can stop using Concord and ask us to delete your workspace at any time. We may suspend accounts that break these terms.</p>
      <h2>Law</h2>
      <p>These terms are governed by the laws of India, and courts in Pune have jurisdiction.</p>
      <p>
        Questions: <a href={mail('Terms')}>{CONTACT_EMAIL}</a>
      </p>
    </SitePage>
  );
}

export function Security() {
  useDocumentTitle('Security');
  return (
    <SitePage title="Security" updated={UPDATED}>
      <p>Concord handles invoices and vendor bank details, so we describe exactly what protects them today, and what isn’t in place yet.</p>
      <h2>In place today</h2>
      <ul>
        <li>All traffic is encrypted with HTTPS.</li>
        <li>Passwords are stored only as bcrypt hashes. Sign-in uses signed tokens, and repeated login attempts are rate limited.</li>
        <li>Every request is tied to one company, and every database query is limited to that company.</li>
        <li>Roles: accountants can upload and draft; only managers and owners approve emails to vendors; only owners change settings, keys and team access.</li>
        <li>API keys are shown once and stored only as SHA-256 hashes, and can be revoked at any time.</li>
        <li>Original files are processed in memory and not stored.</li>
        <li>A change in a vendor’s bank account holds the payment until someone confirms it by phone, and account numbers are masked in alerts.</li>
        <li>Vendors see only their own dispute, through a private link with a 192-bit random token.</li>
        <li>Every draft, approval, reply and resolution is kept in an exportable audit trail.</li>
      </ul>
      <h2>Not yet in place</h2>
      <ul>
        <li>Two-factor sign-in and single sign-on.</li>
        <li>An independent security audit or certification such as ISO 27001 or SOC 2.</li>
        <li>India-only data hosting.</li>
      </ul>
      <h2>Report a problem</h2>
      <p>
        If you find a security issue, write to <a href={mail('Security report')}>{CONTACT_EMAIL}</a>. Please don’t access other companies’ data while testing. We will reply within 3 working days.
      </p>
    </SitePage>
  );
}

export function Contact() {
  useDocumentTitle('Contact');
  return (
    <SitePage title="Talk to Concord">
      <p>We’re looking for five manufacturers and traders around Pune to run Concord on their real invoices during our pilot, free. If that’s you, or you want a walkthrough, write to me.</p>
      <p className="mt-6">
        <a href={mail('Concord pilot')} className="btn-primary h-12 px-6 text-base no-underline">
          Email {CONTACT_EMAIL}
        </a>
      </p>
      <h2>What to include</h2>
      <ul>
        <li>Your company and what you make or trade.</li>
        <li>Roughly how many purchase invoices you handle a month.</li>
        <li>Which accounting software you use, for example TallyPrime.</li>
      </ul>
      <p>
        Prefer to look first? <Link to="/login">Explore the sample company</Link>, no sign-up needed.
      </p>
    </SitePage>
  );
}

export function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <SitePage title="This page doesn’t exist">
      <p>The link may be old or mistyped.</p>
      <p className="mt-6 flex flex-wrap gap-3">
        <Link to="/" className="btn-primary no-underline">
          Go to the home page
        </Link>
        <Link to="/login" className="btn-secondary no-underline">
          Log in
        </Link>
      </p>
    </SitePage>
  );
}
