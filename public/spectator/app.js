const API_URL = '/api';

const STATUS_LABEL = {
  DRAFT: 'Rascunho',
  IN_PROGRESS: 'Em andamento',
  FINISHED: 'Finalizado',
  CANCELLED: 'Cancelado',
};

const GENDER_LABEL = {
  MALE: 'Homem',
  FEMALE: 'Mulher',
};

const MATCH_STATUS_LABEL = {
  PENDING: 'Pendente',
  FINISHED: 'Finalizado',
  WALKOVER: 'W.O.',
  CANCELLED: 'Cancelado',
};

const NETWORK_MESSAGE =
  'Não foi possível conectar ao servidor.\nVerifique sua internet e tente novamente.';

const UNEXPECTED_MESSAGE =
  'Ocorreu um erro inesperado.\nTente novamente em alguns instantes.';

let currentToken = null;

function getTokenFromPath() {
  const match = window.location.pathname.match(/\/t\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function parseApiError(body) {
  if (body && typeof body.code === 'string' && typeof body.message === 'string') {
    return body;
  }
  if (body?.message && typeof body.message === 'object') {
    return body.message;
  }
  if (typeof body?.message === 'string') {
    return { message: body.message };
  }
  return { message: 'Torneio não encontrado.' };
}

function formatErrorMessage(error) {
  if (error.code === 'PUBLIC_LINK_EXPIRED' || error.code === 'EXPIRED') {
    return 'Link expirado.\n\nSolicite um novo link ao organizador.';
  }
  if (error.code === 'PUBLIC_LINK_REVOKED' || error.code === 'REVOKED') {
    return 'Este link não está mais disponível.';
  }
  if (
    error.code === 'PUBLIC_LINK_INVALID' ||
    error.code === 'NOT_FOUND' ||
    error.code === 'TOURNAMENT_NOT_FOUND'
  ) {
    return 'Torneio não encontrado.';
  }
  return error.message || 'Torneio não encontrado.';
}

async function fetchTournament(token) {
  let res;
  try {
    res = await fetch(`${API_URL}/public/tournaments/${token}`);
  } catch {
    throw new Error(NETWORK_MESSAGE);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatErrorMessage(parseApiError(body)));
  }
  return res.json();
}

function renderError(message, { retry = false } = {}) {
  const app = document.getElementById('app');
  const retryButton = retry
    ? '<button type="button" class="retry-btn" id="retry-btn">Tentar novamente</button>'
    : '';

  app.innerHTML = `<div class="error-box">${message.replace(/\n/g, '<br>')}${retryButton}</div>`;

  if (retry) {
    document.getElementById('retry-btn')?.addEventListener('click', () => {
      if (currentToken) boot(currentToken);
    });
  }
}

function renderMatches(data) {
  const byRound = new Map();
  for (const match of data.matches) {
    const list = byRound.get(match.round) || [];
    list.push(match);
    byRound.set(match.round, list);
  }

  if (!data.matches.length) {
    return '<p class="match-pending">Nenhuma partida gerada ainda.</p>';
  }

  return [...byRound.entries()]
    .sort(([a], [b]) => a - b)
    .map(([round, matches]) => {
      const items = matches
        .map((m) => {
          const teamA = `${m.teamA.player1Name} / ${m.teamA.player2Name}`;
          const teamB = `${m.teamB.player1Name} / ${m.teamB.player2Name}`;
          const score =
            m.teamAScore != null && m.teamBScore != null
              ? `${m.teamAScore} x ${m.teamBScore}`
              : null;
          const line = score ? `${teamA} ${score} ${teamB}` : `${teamA} x ${teamB}`;
          const statusLabel =
            m.status === 'PENDING'
              ? 'Pendente'
              : MATCH_STATUS_LABEL[m.status] || m.status;

          return `
            <div class="card">
              <div class="match-court">Quadra ${m.courtNumber}</div>
              <div class="match-line">${line}</div>
              <div class="${m.status === 'PENDING' ? 'match-pending' : 'match-court'}">${statusLabel}</div>
            </div>
          `;
        })
        .join('');

      return `<h3 class="round-title">Rodada ${round}</h3>${items}`;
    })
    .join('');
}

function renderRanking(data) {
  if (!data.ranking.length) {
    return '<p class="match-pending">Ranking ainda não disponível.</p>';
  }
  return data.ranking
    .map(
      (r) => `
      <div class="rank-row">
        <span>${r.position}º ${r.participantName}</span>
        <span>${r.wins}V · ${r.gamesBalance >= 0 ? '+' : ''}${r.gamesBalance}</span>
      </div>
    `,
    )
    .join('');
}

function renderParticipants(data) {
  return data.participants
    .map((p) => {
      const gender = p.gender ? ` — ${GENDER_LABEL[p.gender]}` : '';
      const withdrawn = p.status === 'WITHDRAWN' ? ' (desistente)' : '';
      return `<div class="participant-row">${p.name}${gender}${withdrawn}</div>`;
    })
    .join('');
}

function renderHighlights(data) {
  const h = data.highlights;
  if (!h?.maleHighlights || !h.femaleHighlights) {
    return '<p class="match-pending">Destaques indisponíveis.</p>';
  }
  return `
    <h3 class="section-title">👨 Destaques Masculinos</h3>
    <div class="card">
      <div class="highlight-row">👨 Melhor Homem<span>${h.maleHighlights.best}</span></div>
      <div class="highlight-row">🥈 Vice-Homem<span>${h.maleHighlights.runnerUp}</span></div>
      <div class="highlight-row">🐔 Frango Homem<span>${h.maleHighlights.last}</span></div>
    </div>
    <h3 class="section-title">👩 Destaques Femininos</h3>
    <div class="card">
      <div class="highlight-row">👩 Melhor Mulher<span>${h.femaleHighlights.best}</span></div>
      <div class="highlight-row">🥈 Vice-Mulher<span>${h.femaleHighlights.runnerUp}</span></div>
      <div class="highlight-row">🐔 Frango Mulher<span>${h.femaleHighlights.last}</span></div>
    </div>
  `;
}

function renderChallenge(data) {
  if (!data.challenge) {
    return '<p class="match-pending">Nenhum desafio sorteado.</p>';
  }
  return `
    <div class="card challenge-box">
      <div class="highlight-row">Participante<span>${data.challenge.participantName}</span></div>
      <div class="highlight-row">Prenda<span>${data.challenge.challengeText}</span></div>
    </div>
  `;
}

function renderApp(data) {
  const tabs = [
    { id: 'matches', label: 'Partidas', show: true },
    { id: 'ranking', label: 'Ranking', show: true },
    { id: 'participants', label: 'Participantes', show: true },
    {
      id: 'highlights',
      label: 'Destaques',
      show: data.tournament.format === 'SUPER_8_MIXED',
    },
    { id: 'challenge', label: 'Frango', show: Boolean(data.challenge) },
  ].filter((t) => t.show);

  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="header">
      <h1>${data.tournament.name}</h1>
      <p>${formatDate(data.tournament.date)}${data.tournament.location ? ` · ${data.tournament.location}` : ''}</p>
      <span class="status-badge">${STATUS_LABEL[data.tournament.status] || data.tournament.status}</span>
      ${
        data.tournament.status === 'CANCELLED'
          ? '<p style="margin-top:12px">Torneio cancelado.</p>'
          : ''
      }
    </header>
    <nav class="tabs">
      ${tabs
        .map(
          (t, i) =>
            `<button class="tab ${i === 0 ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`,
        )
        .join('')}
    </nav>
    <main class="content">
      <section class="panel active" data-panel="matches">${renderMatches(data)}</section>
      <section class="panel" data-panel="ranking">${renderRanking(data)}</section>
      <section class="panel" data-panel="participants">${renderParticipants(data)}</section>
      ${
        tabs.some((t) => t.id === 'highlights')
          ? `<section class="panel" data-panel="highlights">${renderHighlights(data)}</section>`
          : ''
      }
      ${
        tabs.some((t) => t.id === 'challenge')
          ? `<section class="panel" data-panel="challenge">${renderChallenge(data)}</section>`
          : ''
      }
    </main>
  `;

  const tabButtons = app.querySelectorAll('.tab');
  const panels = app.querySelectorAll('.panel');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      tabButtons.forEach((b) => b.classList.toggle('active', b === btn));
      panels.forEach((p) =>
        p.classList.toggle('active', p.dataset.panel === tab),
      );
    });
  });
}

async function boot(token = getTokenFromPath()) {
  const app = document.getElementById('app');
  currentToken = token;

  if (!token) {
    renderError('Link inválido.');
    return;
  }

  app.innerHTML = '<div class="loading">Carregando torneio...</div>';

  try {
    const data = await fetchTournament(token);
    renderApp(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : UNEXPECTED_MESSAGE;
    const isRetryable =
      message === NETWORK_MESSAGE || message === UNEXPECTED_MESSAGE;
    renderError(
      isRetryable
        ? 'Não foi possível carregar as informações.'
        : message,
      { retry: isRetryable },
    );
  }
}

boot();
