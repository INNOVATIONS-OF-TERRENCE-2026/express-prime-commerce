import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { LeadershipTeam } from '@/components/home/LeadershipTeam';
import { TrustBadges } from '@/components/trust/TrustBadges';
import { 
  Rocket, 
  Target, 
  Globe, 
  Sparkles, 
  Shield, 
  Zap, 
  TrendingUp,
  Heart,
  Award,
  Users
} from 'lucide-react';
import { BRAND } from '@/lib/constants';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  const stats = [
    { value: '50K+', label: 'Happy Customers', icon: Users },
    { value: '10K+', label: 'Products Curated', icon: Sparkles },
    { value: '99.8%', label: 'Satisfaction Rate', icon: Heart },
    { value: '24/7', label: 'AI-Powered Support', icon: Zap },
  ];

  const values = [
    {
      icon: Rocket,
      title: 'Innovation First',
      description: 'We leverage cutting-edge AI to revolutionize how people discover and shop for products online.',
    },
    {
      icon: Shield,
      title: 'Trust & Quality',
      description: 'Every product is vetted, every transaction secured, and every customer protected.',
    },
    {
      icon: Target,
      title: 'Customer Obsession',
      description: 'Your satisfaction drives every decision we make, from product selection to delivery.',
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Premium products delivered worldwide with fast, reliable shipping you can count on.',
    },
  ];

  const timeline = [
    {
      year: '2024',
      title: 'The Vision',
      description: 'Terrence Milliner envisioned a smarter way to shop online—powered by AI, curated by humans.',
    },
    {
      year: '2025',
      title: 'Building the Future',
      description: 'Tiara Smith joined as CFO, bringing financial expertise to scale our operations globally.',
    },
    {
      year: '2026',
      title: 'Express Prime Launches',
      description: 'The world\'s most intelligent e-commerce platform goes live, revolutionizing online shopping.',
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary/90 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Our Story</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Building the Future of{' '}
              <span className="text-gradient-gold">Intelligent Commerce</span>
            </h1>
            
            <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              {BRAND.name} is where artificial intelligence meets exceptional curation. 
              We're not just selling products—we're revolutionizing how the world shops.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-16 z-10 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-xl p-6 text-center border border-gray-100"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-accent" />
                </div>
                <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Our <span className="text-accent">Mission</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                We believe shopping should be effortless, intelligent, and delightful. Our AI-powered 
                platform analyzes millions of products to surface only the best—saving you time and 
                ensuring every purchase exceeds expectations.
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                From trending items to hidden gems, our algorithms work 24/7 to curate a selection 
                that matches your style, needs, and budget. This is the future of e-commerce.
              </p>
              <div className="flex gap-4">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white btn-glow">
                  <Link to="/collections">
                    Start Shopping
                    <Zap className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/support">Contact Us</Link>
                </Button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-accent/20 via-primary/10 to-accent/5 p-8 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-24 h-24 text-accent mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-2">AI-Powered Curation</h3>
                  <p className="text-muted-foreground">
                    Machine learning that understands what you'll love
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our <span className="text-accent">Values</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mb-6">
                  <value.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our <span className="text-accent">Journey</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              From vision to reality
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent via-primary to-accent/30" />
            
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative pl-20 pb-12 last:pb-0"
              >
                <div className="absolute left-0 w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {item.year.slice(2)}
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="text-sm font-semibold text-accent mb-2">{item.year}</div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <LeadershipTeam variant="hero" />

      {/* Trust Section */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="container mx-auto">
          <TrustBadges className="max-w-5xl mx-auto" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary via-primary/95 to-primary text-white">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Award className="w-16 h-16 mx-auto mb-6 text-accent" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Experience the Future?
            </h2>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who've discovered smarter shopping
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white btn-glow">
                <Link to="/collections">
                  Shop Now
                  <Sparkles className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                <Link to="/support">Get in Touch</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
