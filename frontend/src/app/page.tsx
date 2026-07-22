import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="text-heading-3 font-semibold text-neutral-dark">SmartMeet</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#product" className="text-body text-neutral hover:text-neutral-dark transition-colors">Product</a>
            <a href="#how-it-works" className="text-body text-neutral hover:text-neutral-dark transition-colors">How It Works</a>
            <a href="#pricing" className="text-body text-neutral hover:text-neutral-dark transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-body font-medium text-neutral-dark hover:text-primary transition-colors">
              Log in
            </Link>
            <Link href="/signup">
              <Button>Try SmartMeet Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-heading-1 font-bold text-neutral-dark mb-6">
            Turn Meetings Into Actionable Intelligence.
          </h1>
          <p className="text-body text-neutral mb-8 max-w-xl mx-auto leading-relaxed">
            Upload an audio recording or transcript. SmartMeet automatically extracts summaries,
            decisions, action items, and everything your team needs next.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">Try SmartMeet Free</Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="secondary" size="lg">See How It Works</Button>
            </a>
          </div>
        </div>

        {/* Visual */}
        <div className="mt-16 relative">
          <div className="bg-gradient-to-b from-primary/5 to-transparent rounded-2xl p-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-body font-medium text-neutral-dark">Product Planning Meeting</p>
                  <p className="text-small text-neutral">Jul 22, 2024 · 48 min · 10 Participants</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-small font-medium text-neutral-dark mb-2">Summary</p>
                  <p className="text-small text-neutral">Key points and outcomes</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-small font-medium text-neutral-dark mb-2">Decisions</p>
                  <p className="text-small text-neutral">5 decisions made</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-small font-medium text-neutral-dark mb-2">Action Items</p>
                  <p className="text-small text-neutral">8 tasks assigned</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-small text-neutral mb-8">Trusted by forward-thinking teams</p>
          <div className="flex items-center justify-center gap-12 opacity-50 flex-wrap">
            {['Acme Corp', 'Pulse', 'Cloudify', 'Inspire', 'Volt'].map((company) => (
              <span key={company} className="text-heading-3 font-semibold text-neutral">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-small text-neutral">© 2024 SmartMeet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
