/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EmailDatasetItem } from '../types';

export const DEFAULT_EMAIL_DATASET: EmailDatasetItem[] = [
  // PHISHING EMAILS
  {
    id: 'phish-1',
    sender: 'security@netflix-verify-service.com',
    subject: 'URGENT: Your Netflix Account is Suspended - Payment Declined',
    body: 'Dear customer, Your Netflix account has been suspended due to issues verifying your payment billing details. We were unable to charge your card on file for this month subscription. To restore your access and prevent permanent profile termination, check your account immediately by clicking the link: http://192.168.12.55/update-login/netflix. Please verify your billing profile and credit card numbers right away to prevent any interruptions to your favorite movies. This is your final notice. Click here to confirm your details.',
    label: 'phishing',
  },
  {
    id: 'phish-2',
    sender: 'support-chasebank@secure-alert-net.com',
    subject: 'Unusual Activity Detected: Action Required Immediately!',
    body: 'Dear Chase Customer, We detected an unauthorized sign-in attempt from an unknown device in Russia on your bank profile. To secure your funds and avoid account lockdown, please confirm your identity. Verify your account now at http://chasebank.login-secure-web.com/portal/login. You must action this within 24 hours. Failure to comply will lead to temporary credit card restrictions and banking suspension for security purposes. Thank you, Chase Fraud Prevention Team.',
    label: 'phishing',
  },
  {
    id: 'phish-3',
    sender: 'giftcards-service@win-free-jackpot.net',
    subject: 'CONGRATULATIONS: You Won a Free $1000 Amazon Gift Card!',
    body: 'You have been selected as the lucky grand prize winner of this week’s promotional drawing! You have won a free $1000 Amazon Gift Card, ready for use! To claim your gift card, click here to enter your delivery address, full name, and mobile number: http://www.amazon-winners-dashboard.com/claim-now. Warning: You must claim your reward within 3 days or files will expire. Free shopping is waiting for you! Click the link and enter your profile.',
    label: 'phishing',
  },
  {
    id: 'phish-4',
    sender: 'helpdesk-officer3@it-services-renew.com',
    subject: 'Security Notice: Immediate Password Expired Reset Request',
    body: 'Your workspace password is set to expire in exactly 4 hours. You will lose access to your corporate email box, spreadsheets, and calendar databases. To preserve your inbox, click the following secure URL to renew your login password: http://corporate-login-sso-portal.xyz/login. Enter your current credentials and select a new secure passcode. DO NOT close or delay, otherwise your account is suspended.',
    label: 'phishing',
  },
  {
    id: 'phish-5',
    sender: 'refunds@irsgov-tax-return.org',
    subject: 'Notification of Outstanding IRS Tax Refund of $841.50',
    body: 'After recalculating your fiscal obligations for the past tax year, we found that you are eligible to receive a tax refund of $841.50 from the Internal Revenue Service. Please verify your claim profile and update your direct deposit bank routing info here to trigger immediate payout: http://official-irs-portal-claims.net/refund. It only takes a few minutes to complete. We require social security number and account details to complete verification.',
    label: 'phishing',
  },
  {
    id: 'phish-6',
    sender: 'delivery-support@fedexx-parcel-tracking.com',
    subject: 'Pending Package: Delivery Failure, Address Update Required',
    body: 'Your package carrier attempted to deliver a parcel to your home address today but was unable to complete the shipping because of incorrect address labels on package. Action Required: Click here http://fedex-package-tracking-update.xyz/reschedule to verify your details and pay a small rescheduling surcharge of $1.50. If you do not claim this package within 48 hours, it will be returned to the overseas sender.',
    label: 'phishing',
  },
  {
    id: 'phish-7',
    sender: 'admin@paypal-verification-centre.info',
    subject: 'Your PayPal account is restricted - Verify billing details',
    body: 'Your PayPal payment threshold limit has been exceeded. Due to regulatory compliance regulations, we are forced to temporarily restrict transfers and withdrawals on your profile until further notice. To resolve this restriction and restore full account capability, please confirm your security questions at http://paypal.com.identity-login-resolve.xyz. Do not delay, as failed authentication will lead to automatic credit rating reduction.',
    label: 'phishing',
  },
  {
    id: 'phish-8',
    sender: 'hr@employees-facebook-services.com',
    subject: 'Important: Urgent Employee Benefits Review Form',
    body: 'Hello Team, Facebook corporate is offering a specialized bonus package for employees. To register and secure your bonus allocations, you are requested to review the benefits scheme immediately. Click here: http://facebook-hr-benefitportal.com/auth during working hours. Enter your staff credentials to authenticate instantly. Free gift voucher included for first 100 signups. This offer expires tonight!',
    label: 'phishing',
  },
  {
    id: 'phish-9',
    sender: 'billing@apple-invoice-billing.net',
    subject: 'Receipt for Purchase: iCloud 2TB Storage Plan Renewed',
    body: 'Thank you for your purchase. We have successfully billed your credit card in the amount of $149.99 for Apple iCloud Pro 2TB annual subscription. If you did not make this transaction, please open a billing dispute and request a full refund immediately at: http://apple-dispute-resolution.net/auth. Failing to report within 24 hours will finalize the charges.',
    label: 'phishing',
  },
  {
    id: 'phish-10',
    sender: 'crypto-bonus@blockchain-wallet-alert.com',
    subject: 'Crypto Wallet Security Breach: Backup Recovery Required',
    body: 'Attention: A critical memory leak has been detected in our blockchain wallet database. Your private phrases and cryptocurrency assets might be vulnerable to hackers. You must immediately update your seed key and confirm ownership of your tokens. Open: http://10.22.44.110/blockchain-key-verify to secure your recovery codes immediately and protect your digital wallet and bitcoin ledger.',
    label: 'phishing',
  },
  {
    id: 'phish-11',
    sender: 'covid-grants@goverment-assistance.xyz',
    subject: 'Get Your Grant Assistance Scheme Bonus Approved',
    body: 'Under the federal economic relief plan, you have been designated as a prime recipient for a state auxiliary grant of $3,500. This is a free subsidy with zero repayment terms. To claim your check, click http://www.gov-aid-check-payouts.org/apply-form within 48 hours. Please supply bank details, social security number, and drivers license scan for swift identity matching.',
    label: 'phishing',
  },
  {
    id: 'phish-12',
    sender: 'secure-alert@microsoft-mfa-sso.xyz',
    subject: 'Security Warning: Microsoft Office365 Account Deactivation',
    body: 'Dear system user, we have detected multiple unsuccessful authentication attempts on your Office365 suite. For user isolation and server safety, we will lock your mailbox databases within 12 hours. Please complete the MFA security challenge immediately to verify your profile: http://microsoft.mfa-verify-login-portal.info/sso. Keep this page open while we sync files.',
    label: 'phishing',
  },

  // SAFE EMAILS
  {
    id: 'safe-1',
    sender: 'newsletter@github.com',
    subject: 'GitHub: Clean Code Practices & Weekly Newsletter',
    body: 'Hello Developer, Welcome to this week’s issue of the GitHub newsletter. In this edition, we explore clean code practices for modern web development, focusing on React and TypeScript hooks. Learn how to write reusable elements and manage context efficiently without causing unnecessary re-renders. Check out our open-source repositories and start contributing today at https://github.com/trending. Happy coding, the GitHub team.',
    label: 'safe',
  },
  {
    id: 'safe-2',
    sender: 'customer-care@amazon.com',
    subject: 'Your order #402-959828-11 has been shipped!',
    body: 'Hi there, great news! We have shipped your Amazon order of "Python Machine Learning for Beginners" and "Mechanical Keyboard Keycaps". Your package is currently on its way via UPS and is expected to arrive on Friday. You can track your shipment status, view invoice documents, or modify your delivery preferences at any time by logging into your official dashboard at https://www.amazon.com/orders. Thank you for shopping with us!',
    label: 'safe',
  },
  {
    id: 'safe-3',
    sender: 'alice.johnson@company.com',
    subject: 'Weekly Team Sync: Agenda and Details for Wednesday',
    body: 'Hi team, I hope you all had a wonderful weekend. For our upcoming sync on Wednesday at 10:00 AM, please bring your status reports on the API database migration and review the Figma design board for the new user profile dashboard. We will also coordinate tasks for the upcoming sprint. The Google Meet link is attached to the calendar invite. Let me know if you are unable to attend. Best, Alice.',
    label: 'safe',
  },
  {
    id: 'safe-4',
    sender: 'noreply@spotify.com',
    subject: 'Your Spotify Premium Monthly Receipt - Payment Successful',
    body: 'Your Spotify Premium monthly subscription has been renewed. We have successfully processed your credit card payment of $10.99 for the billing period of May. Your invoice is now available for download. To update your active payment cards or manage your premium package, please visit your account dashboard at https://www.spotify.com. Thank you for listening to music with Spotify!',
    label: 'safe',
  },
  {
    id: 'safe-5',
    sender: 'hr-alerts@corporate-hq.com',
    subject: 'FYI: Update on Company Health & Benefits Policy',
    body: 'Dear Employees, We are pleased to announce several improvements to our corporate medical and dental health programs starting next calendar month. The newly updated handbook lists full details regarding doctor coverage, optical claims, and gym memberships. Please log in to our internal intranet portal to download the handbook or message the HR department if you have any questions. Warm regards, HR team.',
    label: 'safe',
  },
  {
    id: 'safe-6',
    sender: 'notifications@linkedin.com',
    subject: 'LinkedIn: 4 new connection requests and job matches',
    body: 'Hi there, you have some news waiting for you on LinkedIn: 4 people have sent you connection requests, and 3 recruiters have viewed your professional summary this week. We have also identified 5 new job listings matching your skills in TypeScript, React, and Machine Learning. To see their profiles and apply for positions, download the app or log in to the platform at https://www.linkedin.com.',
    label: 'safe',
  },
  {
    id: 'safe-7',
    sender: 'confirmations@delta.com',
    subject: 'Flight Confirmation: Your Trip to Seattle (DL-8429)',
    body: 'Thank you for choosing Delta Airlines. Your flight from San Francisco (SFO) to Seattle (SEA) has been booked. Your confirmation code is DL8429. Departure is scheduled for June 12 at 8:30 AM from Terminal 2. You can check in online, select seats, pre-order meals, and configure baggage options anytime up to 24 hours before take-off by visiting our website at https://www.delta.com. Have a pleasant flight!',
    label: 'safe',
  },
  {
    id: 'safe-8',
    sender: 'education-notices@coursera.org',
    subject: 'Congratulations: Course Completed - Scikit-learn Basics',
    body: 'Outstanding job! You have successfully completed the online course "Introduction to Scikit-learn and Supervised Classification Algorithms". Your digital certificate is ready for download. You can share this credential on your resume or directly to your LinkedIn profile. Explore our advanced neural network classes to continue your education journey at https://www.coursera.org. Keep up the amazing work!',
    label: 'safe',
  },
  {
    id: 'safe-9',
    sender: 'no-reply@medium.com',
    subject: 'Medium Daily Digest: Top Stories in Artificial Intelligence',
    body: 'Welcome to your custom Medium digest! Today, we have curated articles based on your interest in Machine Learning, Python, and Web Development: "How to Build clean Decision Trees in TypeScript", "Stop using default UI designs", and "Gradient Descent Explained with Interactive Code". Read these full articles and follow the authors by visiting https://medium.com. Your feedback is always welcome!',
    label: 'safe',
  },
  {
    id: 'safe-10',
    sender: 'billing@comcast-xfinity.com',
    subject: 'Your Comcast Xfinity High-Speed Internet Statement Approved',
    body: 'Hello, your monthly utility statement for Comcast Xfinity broadband services is ready for viewing. Total amount due is $79.99, which will be auto-debited from your bank card on the scheduled payment date (June 5). You can log in securely to view a detailed breakdown of your data usage or change your payment methods by visiting the customer portal at https://www.xfinity.com/myaccount.',
    label: 'safe',
  },
  {
    id: 'safe-11',
    sender: 'bob.harris@developer-coalition.org',
    subject: 'Review request for pull request #145: Add ML component',
    body: 'Hi Chinmai, could you please review the latest code changes in our repository? I added the machine learning wrapper module for model weights and connected the confusion matrix table. The tests built successfully in CI, but I want to double-check that our TF-IDF tokenization respects case sensitivity properly. Check the pull request details at https://github.com/org/project/pulls/145. Thanks!',
    label: 'safe',
  },
  {
    id: 'safe-12',
    sender: 'newsletter@duolingo.com',
    subject: 'Keep your streak alive! Learn Spanish today',
    body: 'Hola! Don’t let your 15-day Spanish learning streak expire! Just 5 minutes of practice today is all it takes to maintain your ranking inside the Ruby League and master basic food vocabulary. Learn anywhere, anytime, with our lightweight mobile app. Start today’s mini lesson by opening https://www.duolingo.com. Buena suerte with your lessons!',
    label: 'safe',
  },
];
