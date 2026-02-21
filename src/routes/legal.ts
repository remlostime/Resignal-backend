import { type FastifyPluginAsync } from 'fastify';

function renderPage(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Resignal</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #4a4a4a;
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 48px 24px 80px;
    }
    h1 {
      font-size: 2rem;
      color: #1a1a1a;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e5e5;
      margin-bottom: 8px;
    }
    .last-updated {
      font-size: 0.875rem;
      color: #888;
      margin-bottom: 32px;
    }
    h2 {
      font-size: 1.35rem;
      color: #1a1a1a;
      margin-top: 2.5rem;
      margin-bottom: 0.75rem;
    }
    h3 {
      font-size: 1.1rem;
      color: #2a2a2a;
      margin-top: 1.25rem;
      margin-bottom: 0.5rem;
    }
    p { margin-bottom: 1rem; }
    ul {
      padding-left: 1.5rem;
      margin-bottom: 1rem;
      list-style: disc;
    }
    li { margin-bottom: 0.35rem; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    @media (max-width: 600px) {
      .container { padding: 32px 16px 60px; }
      h1 { font-size: 1.6rem; }
      h2 { font-size: 1.2rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

function privacyContent(): string {
  return `
    <h1>Privacy Policy</h1>
    <p class="last-updated">Last Updated: February 20, 2026</p>

    <p>Welcome to Resignal.<br />
    This Privacy Policy explains how we collect, use, and protect your information when you use our mobile application.</p>

    <h2>1. Information We Collect</h2>
    <p>We may collect the following types of information:</p>

    <h3>(1) Account Information</h3>
    <ul>
      <li>Email address</li>
      <li>Name (if provided)</li>
    </ul>

    <h3>(2) Audio &amp; Transcripts</h3>
    <ul>
      <li>Interview audio recordings (temporarily processed)</li>
      <li>Generated transcripts</li>
      <li>AI-generated feedback and analysis</li>
    </ul>

    <h3>(3) Usage Information</h3>
    <ul>
      <li>App usage data</li>
      <li>Device type</li>
      <li>Basic analytics data</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <p>We use your information to:</p>
    <ul>
      <li>Generate transcripts from your audio recordings</li>
      <li>Provide AI-based feedback and interview analysis</li>
      <li>Improve our services</li>
      <li>Provide customer support</li>
    </ul>

    <h2>3. AI &amp; Third-Party Processing</h2>
    <p>We use third-party AI service providers, including OpenAI, Gemini, and DeepSeek to process audio recordings and generate transcripts and feedback.</p>
    <p>Your data is transmitted securely and used only to provide the requested services.</p>
    <p>We do not sell your personal information.</p>

    <h2>4. Data Retention</h2>
    <ul>
      <li>Audio files may be temporarily stored for processing and may be deleted after transcription.</li>
      <li>Transcripts and feedback are stored until you delete them or delete your account.</li>
      <li>You may request deletion at any time.</li>
    </ul>

    <h2>5. Data Security</h2>
    <p>We use industry-standard security measures including:</p>
    <ul>
      <li>Encrypted transmission (HTTPS)</li>
      <li>Secure cloud storage</li>
      <li>Access control protections</li>
    </ul>
    <p>However, no method of transmission over the Internet is 100% secure.</p>

    <h2>6. Your Rights (US &amp; Canada)</h2>
    <p>If you are a resident of certain US states or Canada, you may have the right to:</p>
    <ul>
      <li>Access your data</li>
      <li>Request deletion of your data</li>
      <li>Request correction of your data</li>
    </ul>
    <p>To make a request, contact us at: <a href="mailto:support@email.com">support@email.com</a></p>

    <h2>7. Children's Privacy</h2>
    <p>Our service is not intended for individuals under 13 years of age.</p>

    <h2>8. Changes to This Policy</h2>
    <p>We may update this Privacy Policy from time to time. We will notify users of significant changes within the app.</p>

    <h2>9. Contact Us</h2>
    <p>If you have questions about this Privacy Policy, contact us at:</p>
    <p>Resignal<br />
    Email: <a href="mailto:support@email.com">support@email.com</a></p>`;
}

function termsContent(): string {
  return `
    <h1>Terms of Service</h1>
    <p class="last-updated">Last Updated: February 20, 2026</p>

    <p>Welcome to Resignal.<br />
    These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of our mobile application and related services (the &ldquo;Service&rdquo;).</p>
    <p>By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.</p>

    <h2>1. Description of the Service</h2>
    <p>Resignal provides AI-powered tools that:</p>
    <ul>
      <li>Convert user audio recordings into transcripts</li>
      <li>Generate AI-based interview feedback and analysis</li>
      <li>Store transcripts and related data for user access</li>
    </ul>
    <p>The Service may use third-party providers, including OpenAI, Gemini, and DeepSeek to process audio and generate AI content.</p>

    <h2>2. Eligibility</h2>
    <p>You must be at least 13 years old to use the Service.</p>
    <p>By using the Service, you represent that:</p>
    <ul>
      <li>You are legally capable of entering into a binding agreement</li>
      <li>You comply with all applicable laws</li>
    </ul>

    <h2>3. User Responsibilities</h2>
    <p>You agree that you will NOT:</p>
    <ul>
      <li>Use the Service for unlawful purposes</li>
      <li>Upload content that infringes intellectual property rights</li>
      <li>Attempt to reverse engineer or disrupt the Service</li>
      <li>Use the Service to generate harmful, abusive, or illegal content</li>
    </ul>
    <p>You are solely responsible for the content you record and submit.</p>

    <h2>4. AI-Generated Content Disclaimer</h2>
    <p>The Service provides AI-generated transcripts and feedback.</p>
    <p>You acknowledge that:</p>
    <ul>
      <li>AI-generated outputs may contain inaccuracies</li>
      <li>Feedback is for informational and educational purposes only</li>
      <li>The Service does not guarantee job offers, interview success, or employment outcomes</li>
    </ul>
    <p>We are not responsible for decisions made based on AI-generated feedback.</p>

    <h2>5. Data &amp; Privacy</h2>
    <p>Your use of the Service is also governed by our <a href="/privacy">Privacy Policy</a>.</p>
    <p>By using the Service, you consent to:</p>
    <ul>
      <li>The processing of audio recordings</li>
      <li>The generation of transcripts and AI feedback</li>
      <li>The storage of data as described in our Privacy Policy</li>
    </ul>

    <h2>6. Intellectual Property</h2>
    <p>All software, design, logos, and content provided by Resignal are owned by Resignal.</p>
    <p>You retain ownership of your audio recordings and transcripts, subject to the rights necessary for us to operate the Service.</p>

    <h2>7. Service Availability</h2>
    <p>We may:</p>
    <ul>
      <li>Modify the Service</li>
      <li>Suspend or discontinue features</li>
      <li>Restrict access</li>
    </ul>
    <p>At any time, without prior notice. We do not guarantee uninterrupted or error-free operation.</p>

    <h2>8. Termination</h2>
    <p>We may suspend or terminate your access if you violate these Terms.</p>
    <p>You may stop using the Service at any time.</p>
    <p>You may request deletion of your data as described in the Privacy Policy.</p>

    <h2>9. Disclaimer of Warranties</h2>
    <p>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE.&rdquo;</p>
    <p>TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING:</p>
    <ul>
      <li>Merchantability</li>
      <li>Fitness for a particular purpose</li>
      <li>Non-infringement</li>
    </ul>
    <p>WE DO NOT WARRANT THAT THE SERVICE WILL BE ACCURATE, RELIABLE, OR ERROR-FREE.</p>

    <h2>10. Limitation of Liability</h2>
    <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</p>
    <p>RESIGNAL, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:</p>
    <ul>
      <li>Loss of employment opportunities</li>
      <li>Loss of data</li>
      <li>Business interruption</li>
      <li>Loss of profits or revenue</li>
    </ul>
    <p>OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US (IF ANY) IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.</p>
    <p>IF YOU USE THE SERVICE FOR FREE, OUR LIABILITY IS LIMITED TO ONE HUNDRED DOLLARS ($100 USD).</p>

    <h2>11. Indemnification</h2>
    <p>You agree to indemnify, defend, and hold harmless Resignal and its officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&rsquo; fees) arising out of or related to:</p>
    <ul>
      <li>Your use of the Service</li>
      <li>Your violation of these Terms</li>
      <li>Content you submit through the Service</li>
    </ul>

    <h2>12. Governing Law</h2>
    <p>These Terms shall be governed by and construed in accordance with the laws of [Your State / Province], without regard to conflict of law principles.</p>
    <p>If you are located in Canada, mandatory consumer protection laws may apply.</p>

    <h2>13. Changes to These Terms</h2>
    <p>We may update these Terms from time to time. If we make material changes, we will provide notice within the app.</p>
    <p>Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>

    <h2>14. Contact</h2>
    <p>If you have questions about these Terms, contact us at:</p>
    <p>Resignal<br />
    Email: <a href="mailto:support@email.com">support@email.com</a></p>`;
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
} as const;

const legalRoutes: FastifyPluginAsync = async (server) => {
  server.get('/privacy', async (_request, reply) => {
    const html = renderPage('Privacy Policy', privacyContent());
    return reply
      .headers(SECURITY_HEADERS)
      .type('text/html; charset=utf-8')
      .send(html);
  });

  server.get('/terms', async (_request, reply) => {
    const html = renderPage('Terms of Service', termsContent());
    return reply
      .headers(SECURITY_HEADERS)
      .type('text/html; charset=utf-8')
      .send(html);
  });
};

export default legalRoutes;
