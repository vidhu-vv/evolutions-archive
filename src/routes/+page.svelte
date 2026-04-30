<script>
  /** @type {import('./$types').PageData} */
  export let data;

  let activeEpisode = data.episodes[0] ?? null;

  /** @type {Array<{ label: string; episodes: import('./$types').PageData['episodes'] }>} */
  const seasonGroups = [];

  /** @type {Map<string, import('./$types').PageData['episodes']>} */
  const groupedEpisodes = new Map();

  for (const episode of data.episodes) {
    const label =
      episode.seasonNumber !== null
        ? `Season ${episode.seasonNumber}`
        : "Other Recordings";

    if (!groupedEpisodes.has(label)) {
      groupedEpisodes.set(label, []);
    }

    groupedEpisodes.get(label)?.push(episode);
  }

  for (const [label, episodes] of groupedEpisodes) {
    seasonGroups.push({ label, episodes });
  }

  /** @param {import('./$types').PageData['episodes'][number]} episode */
  function selectEpisode(episode) {
    activeEpisode = episode;
  }
</script>

<svelte:head>
  <title>Evolutions! by DJ Vee</title>
  <meta
    name="description"
    content="An archive for Evolutions! by DJ Vee on UCLA Radio, with a tactile listening interface for every recorded show."
  />
</svelte:head>

<div class="page-shell">
  <header class="topbar">
    <p class="eyebrow">UCLA Radio Archive</p>
    <div class="topbar-meta">
      <span>{data.source}</span>
      <span>{data.stats.totalEpisodes} recordings</span>
    </div>
  </header>

  <section class="hero">
    <h1>Evolutions!</h1>
    <p class="subhead">by DJ Vee</p>
  </section>

  <section class="player-panel">
    <div class="player-status">
      <span class="status-chip cyan"></span>
      <span>Now playing</span>
    </div>
    {#if activeEpisode}
      <h2>{activeEpisode.title}</h2>
      <div class="feature-meta">
        <span>{activeEpisode.episodeLabel ?? activeEpisode.folder}</span>
        <span>{activeEpisode.airDate ?? activeEpisode.filename}</span>
        <span
          >{activeEpisode.source === "cloudflare"
            ? "R2 stream"
            : "Local file"}</span
        >
      </div>
      <audio controls preload="metadata" src={activeEpisode.src}></audio>
    {:else}
      <h2>No archive loaded yet</h2>
      <p class="empty-copy">
        Add a manifest or local files and the player will populate
        automatically.
      </p>
    {/if}
  </section>

  <section class="archive-panel">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Episodes</p>
        <h2>Every episode, ready to revisit</h2>
      </div>
      <p class="panel-note">{data.stats.folders} collections</p>
    </div>

    {#if data.episodes.length}
      {#each seasonGroups as group}
        <section class="season-group">
          <div class="season-heading">
            <h3>{group.label}</h3>
            <span>{group.episodes.length} episodes</span>
          </div>

          <div class="episode-list">
            {#each group.episodes as episode}
              <button
                type="button"
                class:active={activeEpisode?.id === episode.id}
                class="episode-card"
                on:click={() => selectEpisode(episode)}
              >
                <div class="episode-topline">
                  <span>{episode.episodeLabel ?? "--"}</span>
                  <span>{episode.source === "cloudflare" ? "R2" : "Local"}</span
                  >
                </div>
                <div class="episode-main">
                  <h3>{episode.title}</h3>
                  <p>{episode.airDate ?? episode.filename}</p>
                </div>
                <div class="episode-footer">
                  <span>{episode.size}</span>
                </div>
              </button>
            {/each}
          </div>
        </section>
      {/each}
    {:else}
      <div class="empty-state">
        <p>No recordings found yet.</p>
        <p>
          If you’re using Cloudflare, publish an <code
            >archive-manifest.json</code
          >
          file in the bucket and set the matching environment variable. Local
          <code>/archive</code> files still work as a fallback.
        </p>
      </div>
    {/if}
  </section>
</div>

<style>
  :global(body) {
    margin: 0;
    min-height: 100vh;
    font-family: "Times New Roman", Georgia, serif;
    background: radial-gradient(
        circle at top,
        rgba(8, 126, 139, 0.08),
        transparent 24%
      ),
      radial-gradient(
        circle at 80% 20%,
        rgba(255, 90, 95, 0.08),
        transparent 24%
      ),
      linear-gradient(180deg, #070707 0%, #0b0b0c 100%);
    color: #f4f2ec;
  }

  :global(*) {
    box-sizing: border-box;
  }

  :global(button),
  :global(audio) {
    font: inherit;
  }

  .page-shell {
    position: relative;
    width: min(960px, calc(100% - 2rem));
    margin: 0 auto;
    padding: 1.5rem 0 5rem;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem 0 2rem;
  }

  .topbar-meta,
  .eyebrow,
  .panel-note,
  .episode-topline,
  .episode-footer,
  .feature-meta,
  .empty-state p,
  .lede {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  }

  .topbar-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    font-size: 0.78rem;
    color: #8d8d94;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .hero {
    padding: 1rem 0 2rem;
  }

  .eyebrow {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.75rem;
    color: #8a8a8a;
  }

  .hero h1,
  .panel-heading h2,
  .player-panel h2 {
    margin: 0;
    font-weight: 400;
    line-height: 0.95;
  }

  .hero h1 {
    font-size: clamp(4rem, 11vw, 7rem);
    letter-spacing: -0.05em;
  }

  .subhead {
    margin: 0.35rem 0 0;
    font-size: clamp(1.2rem, 2.8vw, 1.8rem);
    color: #b5b5bb;
  }

  .lede {
    max-width: 34rem;
    margin: 1.25rem 0 0;
    font-size: 0.95rem;
    line-height: 1.6;
    color: #a7a7ad;
  }

  .player-panel {
    padding: 1.5rem 0 2.5rem;
    border-top: 1px solid #1d1d22;
    border-bottom: 1px solid #1d1d22;
  }

  .player-status,
  .feature-meta,
  .episode-topline,
  .episode-footer {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.75rem;
    font-size: 0.76rem;
    color: #8d8d94;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    flex-wrap: wrap;
  }

  .player-status {
    margin-bottom: 0.85rem;
  }

  .status-chip {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 999px;
    display: inline-block;
  }

  .status-chip.cyan {
    background: #087e8b;
  }

  .player-panel h2 {
    font-size: clamp(2rem, 4.8vw, 3.25rem);
    margin-bottom: 0.8rem;
  }

  .player-panel audio {
    width: 100%;
    margin-top: 1rem;
    filter: grayscale(1);
  }

  .empty-copy {
    color: #a0a0a6;
  }

  .archive-panel {
    padding-top: 2rem;
  }

  .panel-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .panel-heading h2 {
    font-size: clamp(1.8rem, 3.8vw, 2.6rem);
  }

  .panel-note,
  .empty-state {
    color: #83838b;
    line-height: 1.5;
  }

  .season-group + .season-group {
    margin-top: 2rem;
  }

  .season-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .season-heading h3,
  .season-heading span {
    margin: 0;
  }

  .season-heading h3 {
    font-size: 1.25rem;
    font-weight: 400;
    color: #f4f2ec;
  }

  .season-heading span {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8d8d94;
  }

  .episode-list {
    display: flex;
    flex-direction: column;
    border-top: 1px solid #1d1d22;
  }

  .episode-card {
    text-align: left;
    padding: 1rem 0;
    border: 0;
    border-bottom: 1px solid #1d1d22;
    background: transparent;
    cursor: pointer;
    transition:
      transform 150ms ease,
      color 150ms ease;
    display: grid;
    grid-template-columns: 3.5rem minmax(0, 1fr) auto;
    gap: 1rem;
    align-items: center;
  }

  .episode-card:hover,
  .episode-card.active {
    color: #ffffff;
  }

  .episode-main {
    min-width: 0;
  }

  .episode-card h3 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 400;
    line-height: 1.1;
    color: #f5f3ec;
  }

  .episode-card p {
    margin: 0.35rem 0 0;
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #83838b;
  }

  .episode-footer {
    justify-content: flex-end;
    text-align: right;
  }

  .empty-state {
    padding: 2rem;
    border-radius: 0.8rem;
    background: rgba(16, 16, 17, 0.45);
    border: 1px solid #1f1f22;
    text-align: center;
  }

  @media (max-width: 900px) {
    .panel-heading {
      flex-direction: column;
      align-items: start;
    }
  }

  @media (max-width: 640px) {
    .page-shell {
      width: min(100% - 1rem, 100%);
    }

    .archive-panel {
      padding-top: 1.5rem;
    }

    .topbar {
      flex-direction: column;
      align-items: flex-start;
    }

    .episode-card {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .episode-footer {
      justify-content: flex-start;
      text-align: left;
    }

    .season-heading {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
