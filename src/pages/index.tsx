import Link from 'next/link';
import { MapPinIcon, StarIcon, BarChart2Icon, ArrowDownIcon } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { useReveal } from '@/hooks/useReveal';
import { NeighborhoodCard } from '@/components/neighborhood-card';
import type { NextPageWithLayout } from './_app';

const services = [
  { icon: MapPinIcon, title: 'Interactive Map', desc: 'Browse neighborhoods on a live map with markers, clusters, and popup detail cards.' },
  { icon: StarIcon, title: 'Rated Reviews', desc: 'Read honest reviews with multi-dimension ratings from people who actually lived there.' },
  { icon: BarChart2Icon, title: 'Nomad Score', desc: 'Data-backed composite scores ranking neighborhoods by walkability, safety, cost, and more.' },
];

function HeroSection() {
  const { data: me, isLoading: meLoading } = trpc.user.me.useQuery();

  return (
    <section className="min-h-[calc(100vh-80px)] flex items-center relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-12 gap-8 items-center w-full">
        {/* Left: Headline */}
        <div className="col-span-12 lg:col-span-7">
          <h1 className="text-hero text-[--text-primary] mb-8">
            Know the<br />
            <em className="not-italic lowercase text-[--accent-rose]">neighborhood</em><br />
            before you<br />
            move.
          </h1>
          <p className="text-body text-[--text-secondary] max-w-md mb-8 text-xl leading-relaxed">
            Reviews, ratings, and maps from people who actually live there.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/neighborhoods" className="btn-pill">
              Browse Neighborhoods
            </Link>
            {!meLoading && !me && (
              <Link href="/auth/signin" className="btn-secondary">
                Sign In
              </Link>
            )}
          </div>
          {/* Arrow CTA */}
          <div className="mt-16 flex items-center gap-3 group cursor-pointer">
            <span className="text-micro text-[--text-tertiary] border-b-2 border-[--accent-rose] pb-1">
              SCROLL TO EXPLORE
            </span>
            <ArrowDownIcon className="h-4 w-4 text-[--accent-rose] group-hover:translate-y-1 transition-transform" />
          </div>
        </div>

        {/* Right: Image card */}
        <div className="col-span-12 lg:col-span-5 relative">
          <div className="rounded-3xl overflow-hidden aspect-[3/4] bg-[--bg-secondary]">
            <img
              src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=800&fit=crop"
              alt="City neighborhood"
              className="h-full w-full object-cover"
            />
          </div>
          {/* Floating badge */}
          <div className="absolute -bottom-6 -left-6 floating-badge">
            <span className="text-3xl italic font-light">01</span>
            <span className="text-[8px] font-black tracking-[0.4em]">NOMADHOOD</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  const { ref, isVisible } = useReveal();

  return (
    <section ref={ref} className="bg-[--bg-secondary] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2
          className={`text-display mb-16 ${
            isVisible ? 'animate-reveal' : 'opacity-0'
          }`}
        >
          What we offer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-[rgba(38,38,38,0.06)]">
          {services.map((svc, i) => (
            <div
              key={svc.title}
              className={`p-10 group cursor-default transition-all duration-700 ease-luxury hover:bg-[--accent-rose] ${
                isVisible ? 'animate-reveal' : 'opacity-0'
              }`}
              style={{ animationDelay: `${200 + i * 100}ms` }}
            >
              <svc.icon className="h-8 w-8 text-[--accent-rose] group-hover:text-[--accent-charcoal] mb-6 transition-colors" />
              <h3 className="text-subheading text-[--text-primary] group-hover:text-[--accent-charcoal] mb-3 transition-colors">
                {svc.title}
              </h3>
              <p className="text-body text-[--text-secondary] group-hover:text-[--accent-charcoal] leading-relaxed transition-colors">
                {svc.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedSection() {
  const { data: recent } = trpc.neighborhoods.list.useQuery({ limit: 6, sortBy: 'most_reviews' });
  const neighborhoodIds = recent?.neighborhoods.map((n) => n.id) ?? [];
  const { data: imageMap } = trpc.data.getImages.useQuery(
    { neighborhoodIds },
    { enabled: neighborhoodIds.length > 0 },
  );
  const { ref, isVisible } = useReveal();

  if (!recent || recent.neighborhoods.length === 0) return null;

  return (
    <section ref={ref} className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between mb-16">
          <h2
            className={`text-display ${isVisible ? 'animate-reveal' : 'opacity-0'}`}
          >
            Featured
          </h2>
          <Link
            href="/neighborhoods"
            className={`text-micro text-[--text-tertiary] hover:text-[--text-primary] transition-colors border-b-2 border-[--accent-rose] pb-1 ${
              isVisible ? 'animate-reveal' : 'opacity-0'
            }`}
            style={{ animationDelay: '200ms' }}
          >
            VIEW ALL
          </Link>
        </div>

        {/* Staggered 2-column grid */}
        {/* Mobile: single column in order */}
        <div className="flex flex-col gap-12 md:hidden">
          {recent.neighborhoods.map((n, i) => (
            <div
              key={n.id}
              className={isVisible ? 'animate-reveal' : 'opacity-0'}
              style={{ animationDelay: `${300 + i * 100}ms` }}
            >
              <NeighborhoodCard
                neighborhood={n}
                nomadScore={n.nomadScore}
                imageUrl={imageMap?.[n.id]?.[0]?.thumbUrl ?? imageMap?.[n.id]?.[0]?.imageUrl}
                imageAlt={imageMap?.[n.id]?.[0]?.altText ?? undefined}
                imageSource={imageMap?.[n.id]?.[0]?.source}
              />
            </div>
          ))}
        </div>
        {/* Desktop: two independent flex columns with subtle stagger */}
        <div className="hidden md:flex gap-x-12">
          <div className="flex-1 flex flex-col gap-12">
            {recent.neighborhoods.filter((_, i) => i % 2 === 0).map((n, idx) => (
              <div
                key={n.id}
                className={isVisible ? 'animate-reveal' : 'opacity-0'}
                style={{ animationDelay: `${300 + idx * 200}ms` }}
              >
                <NeighborhoodCard
                  neighborhood={n}
                  nomadScore={n.nomadScore}
                  imageUrl={imageMap?.[n.id]?.[0]?.thumbUrl ?? imageMap?.[n.id]?.[0]?.imageUrl}
                  imageAlt={imageMap?.[n.id]?.[0]?.altText ?? undefined}
                  imageSource={imageMap?.[n.id]?.[0]?.source}
                />
              </div>
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-12 mt-16">
            {recent.neighborhoods.filter((_, i) => i % 2 === 1).map((n, idx) => (
              <div
                key={n.id}
                className={isVisible ? 'animate-reveal' : 'opacity-0'}
                style={{ animationDelay: `${400 + idx * 200}ms` }}
              >
                <NeighborhoodCard
                  neighborhood={n}
                  nomadScore={n.nomadScore}
                  imageUrl={imageMap?.[n.id]?.[0]?.thumbUrl ?? imageMap?.[n.id]?.[0]?.imageUrl}
                  imageAlt={imageMap?.[n.id]?.[0]?.altText ?? undefined}
                  imageSource={imageMap?.[n.id]?.[0]?.source}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const { data: stats } = trpc.dashboard.getStats.useQuery();
  const { ref, isVisible } = useReveal();

  if (!stats) return null;

  const items = [
    { value: stats.neighborhoodCount, label: 'Neighborhoods' },
    { value: stats.reviewCount, label: 'Reviews' },
    { value: stats.userCount, label: 'Members' },
  ];

  return (
    <section ref={ref} className="bg-[--bg-secondary] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex justify-center gap-24">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={`text-center ${isVisible ? 'animate-reveal' : 'opacity-0'}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <p className="text-display tabular-nums text-[--text-primary]">{item.value}</p>
              <p className="text-label text-[--text-ghost] mt-2">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const IndexPage: NextPageWithLayout = () => {
  return (
    <div>
      <HeroSection />
      <ServicesSection />
      <FeaturedSection />
      <StatsSection />
    </div>
  );
};

export default IndexPage;
