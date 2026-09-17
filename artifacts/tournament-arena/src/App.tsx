import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  Crosshair,
  Filter,
  LayoutDashboard,
  ListFilter,
  LockKeyhole,
  Menu,
  Plus,
  Radio,
  Search,
  Settings2,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react';
import {
  getGetDashboardSummaryQueryKey,
  getGetTournamentQueryKey,
  getListRegistrationsQueryKey,
  getListTournamentsQueryKey,
  useCreateTournament,
  useGetDashboardSummary,
  useGetTournament,
  useJoinTournament,
  useListLeaderboard,
  useListRegistrations,
  useListTournaments,
  useUpdateTournament,
} from '@workspace/api-client-react';
import type { LeaderboardEntry, Registration, Tournament } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import NotFound from '@/pages/not-found';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import bgmiTournamentImage from '@assets/generated_images/bgmi-tournament-realistic.jpg';
import freeFireTournamentImage from '@assets/generated_images/free-fire-tournament-realistic.jpg';

const queryClient = new QueryClient();
const PLAYER_TAG = 'RAHUL_7';

const formatINR = (value?: number) => `₹${(value ?? 0).toLocaleString('en-IN')}`;
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : 'TBA';
const gameLabel = (game?: string) => game === 'free-fire' ? 'Free Fire' : 'BGMI';
const gameImage = (game?: string) => game === 'free-fire' ? freeFireTournamentImage : bgmiTournamentImage;

function Logo() {
  return <Link href="/" data-testid="link-logo" className="flex items-center gap-2.5 group">
    <span className="relative grid h-9 w-9 place-items-center bg-primary text-primary-foreground clip-corner transition-transform group-hover:rotate-6"><Crosshair className="h-5 w-5" strokeWidth={2.6} /></span>
    <span className="display-font text-[21px] font-extrabold tracking-[.03em] text-foreground">TOURNAMENT <span className="text-primary">ARENA</span></span>
  </Link>;
}

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/tournaments', label: 'Tournaments', icon: Swords },
  { href: '/my-matches', label: 'My matches', icon: Radio },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="min-h-[100dvh] bg-background">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-foreground/10 bg-secondary text-secondary-foreground lg:flex">
      <div className="px-6 py-7"><Logo /></div>
      <div className="px-4"><p className="mono-font mb-3 px-3 text-[10px] font-medium uppercase tracking-[.2em] text-secondary-foreground/45">Player console</p>
        <nav className="space-y-1">{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`group flex items-center gap-3 border-l-2 px-3 py-3 text-sm font-semibold transition-colors ${location === href ? 'border-primary bg-primary/15 text-primary' : 'border-transparent text-secondary-foreground/65 hover:border-primary/50 hover:bg-secondary-foreground/5 hover:text-secondary-foreground'}`}><Icon className="h-[17px] w-[17px]" />{label}{href === '/my-matches' && <span className="mono-font ml-auto rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">2</span>}</Link>)}</nav>
      </div>
      <div className="mt-auto p-4"><Link href="/organizer" data-testid="link-organizer" className="flex items-center gap-3 border border-secondary-foreground/10 bg-secondary-foreground/5 px-3 py-3 text-sm font-semibold transition-colors hover:border-primary/60 hover:text-primary"><Settings2 className="h-4 w-4" />Organizer studio<ChevronRight className="ml-auto h-4 w-4 opacity-50" /></Link><div className="mt-5 flex items-center gap-3 border-t border-secondary-foreground/10 pt-5"><span className="grid h-8 w-8 shrink-0 place-items-center bg-accent text-xs font-black text-accent-foreground">R7</span><div className="min-w-0"><div className="truncate text-sm font-bold">Rahul_7</div><div className="mono-font text-[10px] text-secondary-foreground/45">RANK #48</div></div></div></div>
    </aside>
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-foreground/10 bg-background/90 px-4 backdrop-blur lg:ml-[232px] lg:px-8">
      <div className="flex items-center gap-3 lg:hidden"><button data-testid="button-open-menu" aria-label="Open menu" onClick={() => setMobileOpen(true)} className="rounded-md p-2 hover:bg-muted"><Menu className="h-5 w-5" /></button><Logo /></div>
      <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex"><span className="mono-font text-[10px] uppercase tracking-[.16em]">Season 04</span><span className="h-1 w-1 rounded-full bg-primary" /><span>South Asia circuit</span></div>
      <div className="ml-auto flex items-center gap-3"><div className="hidden items-center gap-2 border border-border bg-card px-3 py-2 text-xs text-muted-foreground sm:flex"><Search className="h-3.5 w-3.5" />Search matches <kbd className="mono-font rounded bg-muted px-1.5 py-0.5 text-[9px]">⌘ K</kbd></div><span data-testid="profile-avatar" className="grid h-9 w-9 place-items-center bg-accent text-xs font-black text-accent-foreground">R7</span></div>
    </header>
    {mobileOpen && <div className="fixed inset-0 z-50 bg-secondary/70 lg:hidden" onClick={() => setMobileOpen(false)}><div className="h-full w-[280px] bg-secondary p-5 text-secondary-foreground" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><Logo /><button data-testid="button-close-menu" onClick={() => setMobileOpen(false)} className="p-2"><X className="h-5 w-5" /></button></div><nav className="mt-10 space-y-1">{navItems.map(({ href, label, icon: Icon }) => <Link onClick={() => setMobileOpen(false)} key={href} href={href} data-testid={`mobile-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className="flex items-center gap-3 border-l-2 border-transparent px-3 py-3 text-sm font-semibold hover:border-primary hover:bg-secondary-foreground/5"><Icon className="h-4 w-4" />{label}</Link>)}</nav><Link href="/organizer" onClick={() => setMobileOpen(false)} data-testid="mobile-nav-organizer" className="mt-8 flex items-center gap-3 border border-secondary-foreground/15 px-3 py-3 text-sm font-semibold"><Settings2 className="h-4 w-4" />Organizer studio</Link></div></div>}
    <main className="lg:ml-[232px]">{children}</main>
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">{navItems.slice(0, 4).map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`mobile-bottom-${label.toLowerCase().replaceAll(' ', '-')}`} className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${location === href ? 'text-primary' : 'text-muted-foreground'}`}><Icon className="h-[18px] w-[18px]" />{label === 'Overview' ? 'Home' : label.split(' ')[0]}</Link>)}</nav>
  </div>;
}

function Page({ eyebrow, title, description, actions, children }: { eyebrow: string; title: ReactNode; description?: string; actions?: ReactNode; children: ReactNode }) {
  return <div className="arena-grid min-h-[calc(100dvh-68px)] px-4 py-6 pb-24 sm:px-7 lg:px-10 lg:py-9"><div className="mx-auto max-w-[1280px]"><div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mono-font mb-2 text-[10px] font-bold uppercase tracking-[.22em] text-primary">{eyebrow}</p><h1 className="display-font text-4xl font-extrabold uppercase leading-[.9] tracking-tight text-foreground sm:text-5xl">{title}</h1>{description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}</div>{actions && <div className="flex w-full shrink-0 items-center justify-end gap-2 md:w-auto">{actions}</div>}</div>{children}</div></div>;
}

function State({ type, message, onRetry }: { type: 'loading' | 'error' | 'empty'; message: string; onRetry?: () => void }) {
  if (type === 'loading') return <div className="space-y-3">{[1, 2, 3].map((n) => <div key={n} className="h-24 animate-pulse border border-border bg-card/70" />)}</div>;
  return <div className="border border-dashed border-border bg-card/70 px-6 py-14 text-center"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center bg-muted text-muted-foreground">{type === 'error' ? <Zap className="h-5 w-5" /> : <ListFilter className="h-5 w-5" />}</div><h3 className="display-font text-xl font-bold uppercase">{type === 'error' ? 'Signal lost' : 'Nothing on the board'}</h3><p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>{type === 'error' && onRetry && <Button data-testid="button-retry" onClick={onRetry} variant="outline" size="sm" className="mt-4">Try again</Button>}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const live = status === 'live';
  return <Badge data-testid={`status-${status}`} className={live ? 'border-destructive/20 bg-destructive/10 text-destructive' : status === 'open' ? 'border-primary/20 bg-primary/10 text-primary' : 'border-muted bg-muted text-muted-foreground'} variant="outline"><span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${live ? 'pulse-dot bg-destructive' : status === 'open' ? 'bg-primary' : 'bg-muted-foreground'}`} />{status}</Badge>;
}

function TournamentCard({ tournament, compact = false }: { tournament: Tournament; compact?: boolean }) {
  return <Link href={`/tournaments/${tournament.id}`} data-testid={`card-tournament-${tournament.id}`} className={`group block overflow-hidden border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[4px_4px_0_hsl(var(--primary)/.13)]`}>
    <div className={`relative overflow-hidden ${compact ? 'h-24' : 'h-36'}`}>
      <img src={gameImage(tournament.game)} alt={`${gameLabel(tournament.game)} tournament artwork`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/25 to-transparent" />
      <div className="absolute bottom-3 left-4 flex items-center gap-2 text-secondary-foreground">
        <span className="mono-font text-[10px] font-bold uppercase tracking-[.12em]">{gameLabel(tournament.game)}</span>
        <span className="h-1 w-1 rounded-full bg-primary" />
        <span className="mono-font text-[10px] uppercase tracking-[.1em] text-secondary-foreground/70">{tournament.map || 'Arena'}</span>
      </div>
    </div>
    <div className={compact ? 'p-4' : 'p-5'}>
    <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><span className="mono-font text-[10px] font-bold uppercase tracking-[.12em] text-primary">{gameLabel(tournament.game)}</span><span className="text-muted-foreground">/</span><span className="mono-font text-[10px] uppercase tracking-[.1em] text-muted-foreground">{tournament.mode}</span></div><StatusBadge status={tournament.status} /></div>
    <h3 className="mt-4 line-clamp-2 pr-4 text-base font-extrabold leading-snug group-hover:text-primary">{tournament.title}</h3>
    <div className="mt-5 flex items-end justify-between gap-3"><div><p className="mono-font text-[9px] uppercase tracking-[.12em] text-muted-foreground">Prize pool</p><p className="display-font text-2xl font-bold text-accent">{formatINR(tournament.prizePool)}</p></div><div className="text-right"><p className="mono-font text-[9px] uppercase tracking-[.12em] text-muted-foreground">Starts</p><p className="text-xs font-bold">{formatDate(tournament.startsAt)}</p></div></div>
    {!compact && <div className="mt-4 border-t border-border pt-3"><div className="mb-2 flex justify-between text-[11px] font-semibold text-muted-foreground"><span>{tournament.filledSlots}/{tournament.slots} slots filled</span><span>{tournament.entryFee ? formatINR(tournament.entryFee) : 'Free entry'}</span></div><div className="h-1.5 bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (tournament.filledSlots / tournament.slots) * 100)}%` }} /></div></div>}
    </div>
  </Link>;
}

function Dashboard() {
  const summaryQuery = useGetDashboardSummary({ playerTag: PLAYER_TAG });
  const tournamentsQuery = useListTournaments({ status: 'open' });
  const summary = summaryQuery.data;
  const tournaments = tournamentsQuery.data ?? [];
  return <Page eyebrow="Command center / 04" title={<>Ready up, <span className="text-primary">Rahul.</span></>} description="Your next match, live circuit activity and a clear path to the podium." actions={<Link href="/tournaments" data-testid="link-find-match"><Button><Swords className="h-4 w-4" />Find a match</Button></Link>}>
    {summaryQuery.isLoading ? <div className="h-40 animate-pulse bg-secondary/10" /> : summaryQuery.isError ? <State type="error" message="We couldn't load your player briefing." onRetry={() => summaryQuery.refetch()} /> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: 'Tournaments joined', value: summary?.tournamentsJoined ?? 0, icon: Swords },
      { label: 'Live matches', value: summary?.liveMatches ?? 0, icon: Radio },
      { label: 'Arena points', value: summary?.totalPoints ?? 0, icon: Trophy },
      { label: 'Win rate', value: `${summary?.winRate ?? 0}%`, icon: BarChart3 },
    ].map(({ label, value, icon: Icon }, i) => <Card key={label} data-testid={`stat-${label.toLowerCase().replaceAll(' ', '-')}`} className={`stagger-in border-border shadow-none ${i === 2 ? 'bg-secondary text-secondary-foreground' : ''}`} style={{ animationDelay: `${i * 60}ms` }}><CardContent className="flex items-center justify-between p-4"><div><p className={`mono-font text-[10px] uppercase tracking-[.1em] ${i === 2 ? 'text-secondary-foreground/55' : 'text-muted-foreground'}`}>{label}</p><p className="display-font mt-1 text-4xl font-bold">{value}</p></div><Icon className={`h-5 w-5 ${i === 2 ? 'text-accent' : 'text-primary'}`} /></CardContent></Card>)}</div>}
    <div className="mt-9 grid gap-8 xl:grid-cols-[1.35fr_.65fr]">
      <section><div className="mb-4 flex items-center justify-between"><div><p className="mono-font text-[10px] uppercase tracking-[.16em] text-muted-foreground">The next drop</p><h2 className="display-font text-2xl font-bold uppercase">Your next match</h2></div><Link href="/my-matches" data-testid="link-view-matches" className="text-xs font-bold text-primary hover:underline">View all <ChevronRight className="inline h-3 w-3" /></Link></div>
        {summary?.nextMatch ? <Link href={`/tournaments/${summary.nextMatch.id}`} data-testid="card-next-match" className="hero-stripe clip-corner relative block overflow-hidden p-6 text-secondary-foreground transition-transform hover:-translate-y-0.5 sm:p-8"><div className="absolute right-6 top-6 opacity-10"><Crosshair className="h-32 w-32" /></div><div className="relative"><div className="flex items-center gap-2"><StatusBadge status={summary.nextMatch.status} /><span className="mono-font text-[10px] uppercase tracking-[.14em] text-secondary-foreground/65">{gameLabel(summary.nextMatch.game)} / {summary.nextMatch.mode}</span></div><h3 className="display-font mt-8 max-w-lg text-3xl font-bold uppercase leading-[.9] sm:text-5xl">{summary.nextMatch.title}</h3><div className="mt-8 flex flex-wrap gap-5 text-xs font-semibold"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{formatDate(summary.nextMatch.startsAt)}</span><span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-accent" />{formatINR(summary.nextMatch.prizePool)} prize pool</span></div><div className="mt-7 inline-flex items-center gap-2 bg-accent px-4 py-2 text-xs font-extrabold text-accent-foreground">Open match room <ChevronRight className="h-4 w-4" /></div></div></Link> : <State type="empty" message="Join a tournament to see your next match here." />}
      </section>
      <section><div className="mb-4 flex items-end justify-between"><div><p className="mono-font text-[10px] uppercase tracking-[.16em] text-muted-foreground">Open for entry</p><h2 className="display-font text-2xl font-bold uppercase">Hot drops</h2></div><Link href="/tournaments" data-testid="link-all-tournaments" className="text-xs font-bold text-primary">See all</Link></div>{tournamentsQuery.isLoading ? <State type="loading" message="" /> : tournamentsQuery.isError ? <State type="error" message="Unable to load the open bracket." onRetry={() => tournamentsQuery.refetch()} /> : tournaments.length ? <div className="space-y-3">{tournaments.slice(0, 3).map((t) => <TournamentCard key={t.id} tournament={t} compact />)}</div> : <State type="empty" message="No open tournaments right now. Check back before the next drop." />}</section>
    </div>
    <div className="mt-10 flex flex-col justify-between gap-3 border-y border-border py-4 text-xs text-muted-foreground sm:flex-row"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Verified organizers. Protected room details. Zero group-chat chaos.</span><span className="mono-font uppercase tracking-[.12em]">Last sync just now</span></div>
  </Page>;
}

function Tournaments() {
  const [game, setGame] = useState<'all' | 'bgmi' | 'free-fire'>('all');
  const [status, setStatus] = useState<'all' | 'open' | 'live' | 'completed'>('all');
  const query = useListTournaments({ game, status });
  const list = query.data ?? [];
  return <Page eyebrow="Match finder / 01" title="Pick your arena" description="Every bracket, room and slot in one place. Filter the noise, lock your squad." actions={<div className="flex items-center gap-2"><Button data-testid="button-refresh-tournaments" onClick={() => query.refetch()} variant="outline" size="sm"><Zap className="h-3.5 w-3.5" />Refresh</Button></div>}>
    <div className="mb-6 flex flex-col gap-3 border-y border-border py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2"><Filter className="mr-1 h-4 w-4 text-muted-foreground" />{(['all', 'bgmi', 'free-fire'] as const).map((item) => <button key={item} data-testid={`filter-game-${item}`} onClick={() => setGame(item)} className={`rounded-sm px-3.5 py-2 text-[11px] font-bold transition-colors ${game === item ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>{item === 'all' ? 'All games' : gameLabel(item)}</button>)}</div><div className="flex items-center gap-1.5 overflow-auto">{(['all', 'open', 'live', 'completed'] as const).map((item) => <button key={item} data-testid={`filter-status-${item}`} onClick={() => setStatus(item)} className={`mono-font whitespace-nowrap px-2.5 py-2 text-[11px] uppercase tracking-[.08em] ${status === item ? 'text-primary underline decoration-2 underline-offset-4' : 'text-muted-foreground'}`}>{item}</button>)}</div></div>
    {query.isLoading ? <State type="loading" message="" /> : query.isError ? <State type="error" message="The bracket feed is taking a breather." onRetry={() => query.refetch()} /> : list.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((t) => <TournamentCard key={t.id} tournament={t} />)}</div> : <State type="empty" message="No tournaments match these filters yet." />}
  </Page>;
}

function JoinDialog({ tournament, open, onOpenChange }: { tournament: Tournament; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const join = useJoinTournament();
  const client = useQueryClient();
  const [form, setForm] = useState({ playerTag: PLAYER_TAG, playerName: 'Rahul Mehta', teamName: '' });
  const submit = (event: FormEvent) => { event.preventDefault(); join.mutate({ id: tournament.id, data: { ...form, teamName: form.teamName || null } }, { onSuccess: () => { toast({ title: 'Slot secured', description: `You are in ${tournament.title}.` }); client.invalidateQueries({ queryKey: getGetTournamentQueryKey(tournament.id) }); client.invalidateQueries({ queryKey: getListRegistrationsQueryKey({ playerTag: PLAYER_TAG }) }); client.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey({ playerTag: PLAYER_TAG }) }); onOpenChange(false); }, onError: () => toast({ title: 'Could not secure slot', description: 'Check your details and try again.', variant: 'destructive' }) }); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-border bg-background sm:max-w-md"><DialogHeader><DialogTitle className="display-font text-3xl uppercase">Lock your slot</DialogTitle><DialogDescription>One clean step. Your room details appear in My matches once confirmed.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div><label className="mono-font mb-1.5 block text-[10px] uppercase tracking-[.12em] text-muted-foreground">Player tag</label><Input data-testid="input-player-tag" value={form.playerTag} onChange={(e) => setForm({ ...form, playerTag: e.target.value })} minLength={2} required /></div><div><label className="mono-font mb-1.5 block text-[10px] uppercase tracking-[.12em] text-muted-foreground">Player name</label><Input data-testid="input-player-name" value={form.playerName} onChange={(e) => setForm({ ...form, playerName: e.target.value })} minLength={2} required /></div><div><label className="mono-font mb-1.5 block text-[10px] uppercase tracking-[.12em] text-muted-foreground">Team name <span className="normal-case text-muted-foreground/60">(optional)</span></label><Input data-testid="input-team-name" placeholder="Solo queue or team tag" value={form.teamName} onChange={(e) => setForm({ ...form, teamName: e.target.value })} /></div><div className="flex items-center justify-between border border-border bg-muted/50 p-3 text-xs"><span>Entry fee</span><strong className="text-accent">{tournament.entryFee ? formatINR(tournament.entryFee) : 'Free'}</strong></div><DialogFooter><Button type="submit" data-testid="button-confirm-join" disabled={join.isPending} className="w-full">{join.isPending ? 'Securing slot…' : 'Confirm & join'}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function TournamentDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const query = useGetTournament(id, { query: { queryKey: getGetTournamentQueryKey(id), enabled: Number.isFinite(id) } });
  const [joinOpen, setJoinOpen] = useState(false);
  const tournament = query.data;
  if (query.isLoading) return <Page eyebrow="Match intel" title="Loading bracket"><State type="loading" message="" /></Page>;
  if (query.isError || !tournament) return <Page eyebrow="Match intel" title="Bracket unavailable"><State type="error" message="This tournament moved off the board." onRetry={() => query.refetch()} /></Page>;
  return <Page eyebrow={`${gameLabel(tournament.game)} / ${tournament.mode} / Match intel`} title={tournament.title} description={tournament.description} actions={<Link href="/tournaments" data-testid="link-back-tournaments" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />All tournaments</Link>}>
     <div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]"><div className="space-y-6"><div className="hero-stripe relative overflow-hidden p-6 text-secondary-foreground sm:p-9"><img src={gameImage(tournament.game)} alt={`${gameLabel(tournament.game)} tournament artwork`} className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-screen" /><div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/90 to-secondary/35" /><div className="absolute right-5 top-5 opacity-10"><Swords className="h-40 w-40" /></div><div className="relative"><div className="flex items-center gap-3"><StatusBadge status={tournament.status} /><span className="mono-font text-[10px] uppercase tracking-[.14em] text-secondary-foreground/65">{gameLabel(tournament.game)} artwork brief</span></div><p className="mono-font mt-7 text-[10px] uppercase tracking-[.18em] text-secondary-foreground/55">Match briefing</p><div className="mt-2 grid max-w-xl grid-cols-2 gap-y-6 sm:grid-cols-4"><div><p className="mono-font text-[9px] uppercase text-secondary-foreground/50">Starts</p><p className="mt-1 text-sm font-bold">{formatDate(tournament.startsAt)}</p></div><div><p className="mono-font text-[9px] uppercase text-secondary-foreground/50">Map</p><p className="mt-1 text-sm font-bold">{tournament.map || 'TBA'}</p></div><div><p className="mono-font text-[9px] uppercase text-secondary-foreground/50">Entry</p><p className="mt-1 text-sm font-bold text-accent">{tournament.entryFee ? formatINR(tournament.entryFee) : 'Free'}</p></div><div><p className="mono-font text-[9px] uppercase text-secondary-foreground/50">Organizer</p><p className="mt-1 truncate text-sm font-bold">{tournament.organizer || 'Arena staff'}</p></div></div></div></div><div className="grid gap-4 sm:grid-cols-3"><Card className="border-border shadow-none"><CardContent className="p-5"><p className="mono-font text-[10px] uppercase tracking-[.12em] text-muted-foreground">Prize pool</p><p className="display-font mt-2 text-3xl font-bold text-accent">{formatINR(tournament.prizePool)}</p></CardContent></Card><Card className="border-border shadow-none"><CardContent className="p-5"><p className="mono-font text-[10px] uppercase tracking-[.12em] text-muted-foreground">Slots left</p><p className="display-font mt-2 text-3xl font-bold">{Math.max(0, tournament.slots - tournament.filledSlots)}</p></CardContent></Card><Card className="border-border shadow-none"><CardContent className="p-5"><p className="mono-font text-[10px] uppercase tracking-[.12em] text-muted-foreground">Format</p><p className="display-font mt-2 text-3xl font-bold uppercase">{tournament.mode}</p></CardContent></Card></div><div className="border border-border bg-card p-5 sm:p-7"><h2 className="display-font text-2xl font-bold uppercase">Match rules</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{tournament.description || 'Show up on time, use the room credentials in My matches and play clean. Any rule updates from the organizer will appear here.'}</p><div className="mt-5 grid gap-3 text-xs font-semibold sm:grid-cols-2"><span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Verified room credentials</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Results posted after match</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Fair-play monitoring active</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Support on match day</span></div></div></div>
      <div><div className="sticky top-24 border border-border bg-card p-5 shadow-[5px_5px_0_hsl(var(--foreground)/.06)] sm:p-6"><div className="flex items-center justify-between"><p className="mono-font text-[10px] uppercase tracking-[.16em] text-muted-foreground">Slot status</p><Users className="h-4 w-4 text-primary" /></div><div className="mt-5 flex items-end justify-between"><span className="display-font text-5xl font-bold">{tournament.filledSlots}</span><span className="pb-1 text-sm text-muted-foreground">/ {tournament.slots} players</span></div><div className="mt-3 h-2 bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.min(100, tournament.filledSlots / tournament.slots * 100)}%` }} /></div><p className="mt-3 text-xs text-muted-foreground">{tournament.slots - tournament.filledSlots} slots remaining</p><Button data-testid="button-join-tournament" onClick={() => setJoinOpen(true)} disabled={tournament.status !== 'open' || tournament.filledSlots >= tournament.slots} className="mt-7 w-full">{tournament.status === 'live' ? 'Match is live' : tournament.status === 'completed' ? 'Bracket closed' : 'Join this tournament'}<ChevronRight className="h-4 w-4" /></Button><div className="mt-5 border-t border-border pt-5 text-xs text-muted-foreground"><p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />No hidden platform fees</p><p className="mt-3 flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-primary" />Room details stay private</p></div></div></div></div>
    <JoinDialog tournament={tournament} open={joinOpen} onOpenChange={setJoinOpen} />
  </Page>;
}

function MyMatches() {
  const query = useListRegistrations({ playerTag: PLAYER_TAG });
  const registrations = query.data ?? [];
  return <Page eyebrow="Player log / 02" title="My matches" description="Your confirmed slots, room credentials and match-day checklist." actions={<Link href="/tournaments" data-testid="link-browse-from-matches"><Button size="sm"><Plus className="h-4 w-4" />Join another</Button></Link>}>
    {query.isLoading ? <State type="loading" message="" /> : query.isError ? <State type="error" message="Your match log could not be loaded." onRetry={() => query.refetch()} /> : registrations.length === 0 ? <State type="empty" message="No registrations yet. Your next win starts with a slot." /> : <div className="space-y-4">{registrations.map((registration) => <MatchRegistration key={registration.id} registration={registration} />)}</div>}
  </Page>;
}

function MatchRegistration({ registration }: { registration: Registration }) {
  const tournamentQuery = useGetTournament(registration.tournamentId, { query: { queryKey: getGetTournamentQueryKey(registration.tournamentId), enabled: !!registration.tournamentId } });
  const tournament = tournamentQuery.data;
  const [copied, setCopied] = useState('');
  const copy = (value: string, key: string) => { navigator.clipboard?.writeText(value); setCopied(key); window.setTimeout(() => setCopied(''), 1400); };
  return <Card data-testid={`match-registration-${registration.id}`} className="overflow-hidden border-border shadow-none"><div className="flex flex-col gap-4 border-b border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><StatusBadge status={registration.status} /><span className="mono-font text-[10px] uppercase tracking-[.12em] text-muted-foreground">Slot #{registration.slotNumber}</span></div><h2 className="mt-3 text-lg font-extrabold">{registration.tournamentTitle}</h2><p className="mt-1 text-xs text-muted-foreground">Joined {formatDate(registration.joinedAt)} {tournament?.startsAt ? `· Match ${formatDate(tournament.startsAt)}` : ''}</p></div><Link href={`/tournaments/${registration.tournamentId}`} data-testid={`link-match-details-${registration.id}`} className="flex items-center gap-1 text-xs font-bold text-primary">Match details <ChevronRight className="h-4 w-4" /></Link></div><CardContent className="grid gap-4 bg-muted/30 p-5 sm:grid-cols-3"><div><p className="mono-font text-[9px] uppercase tracking-[.12em] text-muted-foreground">Player</p><p className="mt-1 text-sm font-bold">{registration.playerName} <span className="font-normal text-muted-foreground">({registration.playerTag})</span></p></div><div><p className="mono-font text-[9px] uppercase tracking-[.12em] text-muted-foreground">Room ID</p>{tournament?.roomId ? <button data-testid={`button-copy-room-${registration.id}`} onClick={() => copy(tournament.roomId || '', 'room')} className="mt-1 flex items-center gap-2 text-sm font-bold text-primary">{copied === 'room' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === 'room' ? 'Copied' : tournament.roomId}</button> : <p className="mt-1 text-sm text-muted-foreground">Releases before match</p>}</div><div><p className="mono-font text-[9px] uppercase tracking-[.12em] text-muted-foreground">Room password</p>{tournament?.roomPassword ? <button data-testid={`button-copy-password-${registration.id}`} onClick={() => copy(tournament.roomPassword || '', 'password')} className="mt-1 flex items-center gap-2 text-sm font-bold text-primary">{copied === 'password' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === 'password' ? 'Copied' : tournament.roomPassword}</button> : <p className="mt-1 text-sm text-muted-foreground">Releases before match</p>}</div></CardContent></Card>;
}

function Leaderboard() {
  const [game, setGame] = useState<'all' | 'bgmi' | 'free-fire'>('all');
  const query = useListLeaderboard({ game });
  const entries = query.data ?? [];
  return <Page eyebrow="Competitive index / 03" title="The standings" description="Consistency compounds. See who is converting match points into season pressure." actions={<div className="flex border border-border bg-card p-1">{(['all', 'bgmi', 'free-fire'] as const).map((item) => <button key={item} data-testid={`leaderboard-filter-${item}`} onClick={() => setGame(item)} className={`px-3 py-1.5 text-xs font-bold ${game === item ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground'}`}>{item === 'all' ? 'All' : gameLabel(item)}</button>)}</div>}>
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Card className="border-border bg-secondary text-secondary-foreground shadow-none"><CardContent className="p-5"><p className="mono-font text-[10px] uppercase text-secondary-foreground/55">Season leader</p><p className="display-font mt-2 text-3xl font-bold">{entries[0]?.playerName || '—'}</p><p className="mt-1 text-xs text-secondary-foreground/60">{entries[0] ? `${entries[0].points} points / ${entries[0].wins} wins` : 'Awaiting standings'}</p></CardContent></Card><Card className="border-border shadow-none"><CardContent className="p-5"><p className="mono-font text-[10px] uppercase text-muted-foreground">Your position</p><p className="display-font mt-2 text-3xl font-bold">#48</p><p className="mt-1 flex items-center gap-1 text-xs font-bold text-primary"><ArrowUpRight className="h-3.5 w-3.5" />+6 this week</p></CardContent></Card><Card className="border-border shadow-none"><CardContent className="p-5"><p className="mono-font text-[10px] uppercase text-muted-foreground">Points to top 10</p><p className="display-font mt-2 text-3xl font-bold">{entries[9] ? Math.max(0, entries[9].points - (entries.find((e) => e.playerTag === PLAYER_TAG)?.points ?? 0)) : '—'}</p><p className="mt-1 text-xs text-muted-foreground">Keep the streak alive</p></CardContent></Card></div>
    {query.isLoading ? <State type="loading" message="" /> : query.isError ? <State type="error" message="Standings couldn't be synced." onRetry={() => query.refetch()} /> : entries.length ? <div className="overflow-x-auto border border-border bg-card"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-border bg-muted/50"><tr className="mono-font text-[10px] uppercase tracking-[.13em] text-muted-foreground"><th className="px-5 py-4">Rank</th><th className="px-5 py-4">Player</th><th className="px-5 py-4">Game</th><th className="px-5 py-4 text-right">Matches</th><th className="px-5 py-4 text-right">Wins</th><th className="px-5 py-4 text-right">Kills</th><th className="px-5 py-4 text-right">Points</th></tr></thead><tbody>{entries.map((entry, index) => <LeaderboardRow key={`${entry.playerTag}-${index}`} entry={entry} />)}</tbody></table></div> : <State type="empty" message="No standings for this game yet." />}
  </Page>;
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const isPlayer = entry.playerTag === PLAYER_TAG;
  return <tr data-testid={`leaderboard-row-${entry.rank}`} className={`border-b border-border last:border-0 ${isPlayer ? 'bg-primary/5' : ''}`}><td className="px-5 py-4"><span className={`display-font text-xl font-bold ${entry.rank <= 3 ? 'text-accent' : ''}`}>{entry.rank.toString().padStart(2, '0')}</span><span className="ml-2 inline-flex">{entry.trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5 text-primary" /> : entry.trend === 'down' ? <ArrowDownRight className="h-3.5 w-3.5 text-destructive" /> : <span className="h-3.5 w-3.5 text-muted-foreground">—</span>}</span></td><td className="px-5 py-4"><div className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center text-[10px] font-black ${entry.rank === 1 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>{entry.playerName.slice(0, 2).toUpperCase()}</span><div><p className={`font-bold ${isPlayer ? 'text-primary' : ''}`}>{entry.playerName}{isPlayer && <span className="mono-font ml-2 text-[9px] uppercase">you</span>}</p><p className="mono-font text-[10px] text-muted-foreground">{entry.playerTag}</p></div></div></td><td className="px-5 py-4 text-xs font-semibold">{gameLabel(entry.game)}</td><td className="px-5 py-4 text-right text-muted-foreground">{entry.matches}</td><td className="px-5 py-4 text-right font-bold">{entry.wins}</td><td className="px-5 py-4 text-right text-muted-foreground">{entry.kills}</td><td className="px-5 py-4 text-right"><span className="display-font text-2xl font-bold">{entry.points}</span></td></tr>;
}

function Organizer() {
  const [editing, setEditing] = useState<Tournament | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const query = useListTournaments();
  const mine = (query.data ?? []).filter((t) => t.organizer === 'Arena staff' || !t.organizer);
  return <Page eyebrow="Operations / 05" title="Organizer studio" description="Build a clean match-day brief. Update rooms and status without chasing player groups." actions={<Button data-testid="button-new-tournament" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" />Create tournament</Button>}>
    <div className="mb-6 grid gap-3 sm:grid-cols-3"><Card className="border-border shadow-none"><CardContent className="p-5"><p className="mono-font text-[10px] uppercase text-muted-foreground">Active brackets</p><p className="display-font mt-1 text-4xl font-bold">{mine.filter((t) => t.status !== 'completed').length}</p></CardContent></Card><Card className="border-border shadow-none"><CardContent className="p-5"><p className="mono-font text-[10px] uppercase text-muted-foreground">Players locked</p><p className="display-font mt-1 text-4xl font-bold">{mine.reduce((sum, t) => sum + t.filledSlots, 0)}</p></CardContent></Card><Card className="border-border bg-secondary text-secondary-foreground shadow-none"><CardContent className="p-5"><p className="mono-font text-[10px] uppercase text-secondary-foreground/55">Organizer score</p><p className="display-font mt-1 text-4xl font-bold text-accent">4.8<span className="text-lg">/5</span></p></CardContent></Card></div>
    {query.isLoading ? <State type="loading" message="" /> : query.isError ? <State type="error" message="Tournament controls are offline." onRetry={() => query.refetch()} /> : <div className="space-y-3">{mine.length ? mine.map((t) => <OrganizerRow key={t.id} tournament={t} onEdit={() => { setEditing(t); setDialogOpen(true); }} />) : <State type="empty" message="Create your first bracket to start filling the arena." />}</div>}
    <TournamentForm tournament={editing} open={dialogOpen} onOpenChange={setDialogOpen} />
  </Page>;
}

function OrganizerRow({ tournament, onEdit }: { tournament: Tournament; onEdit: () => void }) {
  const update = useUpdateTournament();
  const client = useQueryClient();
  const { toast } = useToast();
  const advance = () => { const next = tournament.status === 'open' ? 'live' : tournament.status === 'live' ? 'completed' : 'open'; update.mutate({ id: tournament.id, data: { status: next } }, { onSuccess: () => { client.invalidateQueries({ queryKey: getListTournamentsQueryKey() }); toast({ title: 'Bracket updated', description: `Status moved to ${next}.` }); }, onError: () => toast({ title: 'Update failed', description: 'Try again in a moment.', variant: 'destructive' }) }); };
  return <div data-testid={`organizer-row-${tournament.id}`} className="flex flex-col gap-4 border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><div className={`mt-1 grid h-9 w-9 place-items-center ${tournament.status === 'live' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}><Radio className="h-4 w-4" /></div><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{tournament.title}</h3><StatusBadge status={tournament.status} /></div><p className="mt-1 text-xs text-muted-foreground">{gameLabel(tournament.game)} · {tournament.filledSlots}/{tournament.slots} slots · {formatDate(tournament.startsAt)}</p></div></div><div className="flex items-center gap-2 sm:shrink-0"><Button data-testid={`button-advance-${tournament.id}`} onClick={advance} variant="outline" size="sm">{tournament.status === 'open' ? 'Start match' : tournament.status === 'live' ? 'Close bracket' : 'Reopen'}</Button><Button data-testid={`button-edit-${tournament.id}`} onClick={onEdit} variant="secondary" size="sm"><Settings2 className="h-3.5 w-3.5" />Edit</Button></div></div>;
}

function TournamentForm({ tournament, open, onOpenChange }: { tournament: Tournament | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateTournament();
  const update = useUpdateTournament();
  const client = useQueryClient();
  const { toast } = useToast();
  const blank = { title: '', game: 'bgmi' as 'bgmi' | 'free-fire', mode: 'squad' as 'solo' | 'duo' | 'squad', startsAt: '', prizePool: '25000', entryFee: '49', slots: '100', map: 'Erangel', organizer: 'Arena staff', description: '', roomId: '', roomPassword: '' };
  const [form, setForm] = useState(blank);
  const [lastId, setLastId] = useState<number | null>(null);
  useEffect(() => {
    if (!open) return;
    if (tournament) {
      setForm({ title: tournament.title, game: tournament.game, mode: tournament.mode, startsAt: tournament.startsAt.slice(0, 16), prizePool: String(tournament.prizePool), entryFee: String(tournament.entryFee), slots: String(tournament.slots), map: tournament.map || '', organizer: tournament.organizer || 'Arena staff', description: tournament.description || '', roomId: tournament.roomId || '', roomPassword: tournament.roomPassword || '' });
      setLastId(tournament.id);
    } else {
      setForm(blank);
      setLastId(null);
    }
  }, [open, tournament]);
  const submit = (event: FormEvent) => { event.preventDefault(); const data = { ...form, prizePool: Number(form.prizePool), entryFee: Number(form.entryFee), slots: Number(form.slots), startsAt: new Date(form.startsAt).toISOString() }; if (tournament) { update.mutate({ id: tournament.id, data: { roomId: form.roomId || null, roomPassword: form.roomPassword || null } }, { onSuccess: () => { toast({ title: 'Tournament updated' }); client.invalidateQueries({ queryKey: getListTournamentsQueryKey() }); onOpenChange(false); }, onError: () => toast({ title: 'Could not update tournament', variant: 'destructive' }) }); } else { create.mutate({ data }, { onSuccess: () => { toast({ title: 'Tournament created', description: 'Your bracket is now on the board.' }); client.invalidateQueries({ queryKey: getListTournamentsQueryKey() }); onOpenChange(false); setForm(blank); }, onError: () => toast({ title: 'Could not create tournament', description: 'Check every field and try again.', variant: 'destructive' }) }); } };
  return <Dialog open={open} onOpenChange={(value) => { if (!value) setLastId(null); onOpenChange(value); }}><DialogContent className="border-border bg-background sm:max-w-2xl"><DialogHeader><DialogTitle className="display-font text-3xl uppercase">{tournament ? 'Edit bracket room' : 'New bracket'}</DialogTitle><DialogDescription>{tournament ? 'Release room credentials to confirmed players when the lobby is ready.' : 'Publish the exact details players need before they lock in.'}</DialogDescription></DialogHeader><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label className="mono-font mb-1.5 block text-[10px] uppercase text-muted-foreground">Tournament title</label><Input data-testid="input-tournament-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} minLength={2} required disabled={!!tournament} placeholder="e.g. Night Raid — S04 Finals" /></div><div><label className="mono-font mb-1.5 block text-[10px] uppercase text-muted-foreground">Game</label><select disabled={!!tournament} data-testid="select-tournament-game" className="h-9 w-full border border-input bg-transparent px-3 text-sm disabled:opacity-60" value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value as 'bgmi' | 'free-fire' })}><option value="bgmi">BGMI</option><option value="free-fire">Free Fire</option></select></div><div><label className="mono-font mb-1.5 block text-[10px] uppercase text-muted-foreground">Mode</label><select disabled={!!tournament} data-testid="select-tournament-mode" className="h-9 w-full border border-input bg-transparent px-3 text-sm disabled:opacity-60" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as 'solo' | 'duo' | 'squad' })}><option value="solo">Solo</option><option value="duo">Duo</option><option value="squad">Squad</option></select></div><div><label className="mono-font mb-1.5 block text-[10px] uppercase text-muted-foreground">Start time</label><Input disabled={!!tournament} data-testid="input-tournament-start" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required /></div><div><label className="mono-font mb-1.5 block text-[10px] uppercase text-muted-foreground">Map</label><Input disabled={!!tournament} data-testid="input-tournament-map" value={form.map} onChange={(e) => setForm({ ...form, map: e.target.value })} required /></div><div><label className="mono-font mb-1.5 block text-[10px] uppercase text-muted-foreground">Prize pool</label><Input disabled={!!tournament} data-testid="input-prize-pool" type="number" min="0" value={form.prizePool} onChange={(e) => setForm({ ...form, prizePool: e.target.value })} required /></div><div><label className="mono-font mb-1.5 block text-[10px] uppercase text-muted-foreground">Entry fee</label><Input disabled={!!tournament} data-testid="input-entry-fee" type="number" min="0" value={form.entryFee} onChange={(e) => setForm({ ...form, entryFee: e.target.value })} required /></div><div><label className="mono-font mb-1.5 block text-[10px] uppercase text-muted-foreground">Slots</label><Input disabled={!!tournament} data-testid="input-slots" type="number" min="1" value={form.slots} onChange={(e) => setForm({ ...form, slots: e.target.value })} required /></div>{tournament && <><div><label className="mono-font mb-1.5 block text-[10px] uppercase text-muted-foreground">Room ID</label><Input data-testid="input-room-id" value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} placeholder="Releases to players" /></div><div><label className="mono-font mb-1.5 block text-[10px] uppercase text-muted-foreground">Room password</label><Input data-testid="input-room-password" value={form.roomPassword} onChange={(e) => setForm({ ...form, roomPassword: e.target.value })} placeholder="Private until ready" /></div></>}<div className="sm:col-span-2"><label className="mono-font mb-1.5 block text-[10px] uppercase text-muted-foreground">Description</label><Textarea disabled={!!tournament} data-testid="input-tournament-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required minLength={2} placeholder="Rules, check-in instructions and what players should expect." /></div><DialogFooter className="sm:col-span-2"><Button type="submit" data-testid="button-submit-tournament" disabled={create.isPending || update.isPending} className="w-full sm:w-auto">{create.isPending || update.isPending ? 'Saving…' : tournament ? 'Save room details' : 'Publish tournament'}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Shell><Switch><Route path="/" component={Dashboard} /><Route path="/tournaments" component={Tournaments} /><Route path="/tournaments/:id" component={TournamentDetail} /><Route path="/my-matches" component={MyMatches} /><Route path="/leaderboard" component={Leaderboard} /><Route path="/organizer" component={Organizer} /><Route component={NotFound} /></Switch></Shell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;