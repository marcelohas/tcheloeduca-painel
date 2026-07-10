const state = {
  turmas: [],
  turmaAtual: '',
  filtro: 'all',
  selecionado: null
};

const els = {
  fileInput: document.getElementById('fileInput'),
  message: document.getElementById('message'),
  dashboard: document.getElementById('dashboard'),
  classTitle: document.getElementById('classTitle'),
  classSelect: document.getElementById('classSelect'),
  classNote: document.getElementById('classNote'),
  totalStudents: document.getElementById('totalStudents'),
  averageScore: document.getElementById('averageScore'),
  approvedCount: document.getElementById('approvedCount'),
  recoveryCount: document.getElementById('recoveryCount'),
  scoreHistogram: document.getElementById('scoreHistogram'),
  situationChart: document.getElementById('situationChart'),
  attentionList: document.getElementById('attentionList'),
  studentsTable: document.getElementById('studentsTable'),
  reportTitle: document.getElementById('reportTitle'),
  studentReport: document.getElementById('studentReport'),
  printButton: document.getElementById('printButton'),
  themeButton: document.getElementById('themeButton'),
  clearButton: document.getElementById('clearButton'),
  filterButtons: document.querySelectorAll('.filter-button')
};

initializeTheme();
els.fileInput.addEventListener('change', handleFiles);
els.classSelect.addEventListener('change', () => {
  state.turmaAtual = els.classSelect.value;
  state.selecionado = null;
  renderDashboard();
});
els.clearButton.addEventListener('click', resetDashboard);
els.themeButton.addEventListener('click', toggleTheme);
els.printButton.addEventListener('click', () => window.print());

els.filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.filtro = button.dataset.filter;
    els.filterButtons.forEach((item) => item.classList.toggle('is-active', item === button));
    renderTable();
  });
});

function initializeTheme() {
  const savedTheme = localStorage.getItem('painelNotasTheme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
  setTheme(nextTheme);
  localStorage.setItem('painelNotasTheme', nextTheme);
}

function setTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-theme', isDark);
  els.themeButton.textContent = isDark ? 'Modo claro' : 'Modo escuro';
  els.themeButton.setAttribute('aria-pressed', String(isDark));
}

async function handleFiles(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  if (typeof XLSX === 'undefined') {
    showMessage('A biblioteca de leitura de Excel não foi encontrada na pasta js.', true);
    return;
  }

  const loaded = [];
  const errors = [];

  for (const file of files) {
    try {
      const sheet = await readWorkbookSheet(file);
      loaded.push(readSheetData(sheet, file.name));
    } catch (error) {
      errors.push(file.name);
      console.error(error);
    }
  }

  if (!loaded.length) {
    showMessage('Não foi possível ler as planilhas selecionadas. Confira se elas seguem o modelo esperado.', true);
    return;
  }

  state.turmas = mergeClasses(state.turmas, loaded);
  state.turmaAtual = loaded[0].turma;
  state.selecionado = null;
  state.filtro = 'all';
  els.filterButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.filter === 'all');
  });

  renderClassSelect();
  renderDashboard();

  const successText = loaded.length === 1
    ? `1 planilha carregada: ${loaded[0].turma}.`
    : `${loaded.length} planilhas carregadas: ${loaded.map((item) => item.turma).join(', ')}.`;
  const errorText = errors.length ? ` Não lidas: ${errors.join(', ')}.` : '';
  showMessage(successText + errorText, Boolean(errors.length));
}

function readWorkbookSheet(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const data = new Uint8Array(loadEvent.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook.Sheets[workbook.SheetNames[0]]);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function readSheetData(sheet, fileName) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const turma = findClassName(rows, fileName);
  const headerIndex = rows.findIndex((row) => normalize(row.join(' ')).includes('numero aluno'));

  if (headerIndex === -1) {
    throw new Error('Cabeçalho não encontrado.');
  }

  const footerText = rows
    .flat()
    .find((cell) => normalize(String(cell)).startsWith('consideracoes sobre a turma'));

  const alunos = rows
    .slice(headerIndex + 1)
    .map((row) => parseStudentRow(row))
    .filter(Boolean);

  if (!alunos.length) {
    throw new Error('Nenhum aluno encontrado.');
  }

  return {
    turma,
    arquivo: fileName,
    consideracoes: footerText || 'Sem considerações registradas para esta turma.',
    alunos
  };
}

function mergeClasses(current, incoming) {
  const byClass = new Map(current.map((item) => [item.turma, item]));
  incoming.forEach((item) => byClass.set(item.turma, item));
  return Array.from(byClass.values()).sort((a, b) => a.turma.localeCompare(b.turma, 'pt-BR'));
}

function parseStudentRow(row) {
  const numero = row[0];
  const av1 = toNumber(row[1]);
  const av2 = toNumber(row[2]);
  const media = toNumber(row[3]);
  const final = String(row[4] || '').trim();
  const observacoes = String(row[5] || '').trim();

  if (numero === '' || Number.isNaN(av1) || Number.isNaN(av2) || Number.isNaN(media)) {
    return null;
  }

  return {
    numero,
    av1,
    av2,
    media,
    final: final || (media >= 6 ? 'Aprovado' : 'Recuperação'),
    observacoes: observacoes || 'Sem observações.'
  };
}

function findClassName(rows, fileName) {
  const firstCell = String(rows[0]?.[0] || '');
  const fromHeader = firstCell.match(/turma:\s*([0-9][A-Z])/i);
  if (fromHeader) return fromHeader[1].toUpperCase();

  const fromFile = fileName.match(/([67][AB])/i);
  return fromFile ? fromFile[1].toUpperCase() : 'Turma';
}

function renderClassSelect() {
  els.classSelect.disabled = state.turmas.length === 0;
  els.classSelect.innerHTML = state.turmas.length
    ? state.turmas.map((item) => `<option value="${escapeHtml(item.turma)}">${escapeHtml(item.turma)}</option>`).join('')
    : '<option>Nenhuma turma</option>';
  els.classSelect.value = state.turmaAtual;
}

function renderDashboard() {
  const turma = getCurrentClass();
  if (!turma) {
    resetDashboard();
    return;
  }

  els.dashboard.classList.remove('is-empty');
  els.classTitle.textContent = `Turma ${turma.turma}`;
  els.classNote.textContent = turma.consideracoes;

  const total = turma.alunos.length;
  const mediaGeral = average(turma.alunos.map((aluno) => aluno.media));
  const aprovados = turma.alunos.filter(isApproved).length;
  const recuperacao = total - aprovados;

  els.totalStudents.textContent = total;
  els.averageScore.textContent = formatScore(mediaGeral);
  els.approvedCount.textContent = aprovados;
  els.recoveryCount.textContent = recuperacao;

  renderAnalysis(turma, aprovados, recuperacao);
  renderTable();
  renderEmptyReport();
}

function renderAnalysis(turma, aprovados, recuperacao) {
  renderHistogram(turma.alunos);
  renderSituationChart(turma.alunos.length, aprovados, recuperacao);
  renderAttentionPoints(turma.alunos);
}

function renderHistogram(alunos) {
  const ranges = [
    { label: '0-4,9', min: 0, max: 4.99 },
    { label: '5-5,9', min: 5, max: 5.99 },
    { label: '6-7,9', min: 6, max: 7.99 },
    { label: '8-10', min: 8, max: 10 }
  ];
  const counts = ranges.map((range) => alunos.filter((aluno) => aluno.media >= range.min && aluno.media <= range.max).length);
  const max = Math.max(...counts, 1);

  els.scoreHistogram.innerHTML = ranges.map((range, index) => {
    const count = counts[index];
    const height = Math.max((count / max) * 100, count ? 16 : 4);
    return `
      <div class="histogram-item">
        <span class="histogram-value">${count}</span>
        <span class="histogram-bar" style="height: ${height}%"></span>
        <span class="histogram-label">${range.label}</span>
      </div>
    `;
  }).join('');
}

function renderSituationChart(total, aprovados, recuperacao) {
  const approvedPercent = total ? Math.round((aprovados / total) * 100) : 0;
  const recoveryPercent = total ? 100 - approvedPercent : 0;

  els.situationChart.innerHTML = `
    <div class="stacked-bar" aria-label="${approvedPercent}% aprovados e ${recoveryPercent}% em recuperacao">
      <span class="stacked-approved" style="width: ${approvedPercent}%"></span>
      <span class="stacked-recovery" style="width: ${recoveryPercent}%"></span>
    </div>
    <div class="chart-legend">
      <span><i class="legend-dot approved-dot"></i>${approvedPercent}% aprovados</span>
      <span><i class="legend-dot recovery-dot"></i>${recoveryPercent}% recuperacao</span>
    </div>
  `;
}

function renderAttentionPoints(alunos) {
  const recoveryStudents = alunos.filter((aluno) => !isApproved(aluno));
  const lowScores = alunos.filter((aluno) => aluno.media < 5);
  const highScores = alunos.filter((aluno) => aluno.media >= 8);
  const av1Average = average(alunos.map((aluno) => aluno.av1));
  const av2Average = average(alunos.map((aluno) => aluno.av2));
  const variation = av2Average - av1Average;
  const points = [];

  if (recoveryStudents.length) {
    points.push(`${recoveryStudents.length} aluno(s) em recuperacao precisam de acompanhamento.`);
  } else {
    points.push('Nenhum aluno em recuperacao nesta turma.');
  }

  if (lowScores.length) {
    points.push(`${lowScores.length} aluno(s) com media abaixo de 5,0.`);
  }

  if (variation < -0.5) {
    points.push(`A Av2 caiu ${formatScore(Math.abs(variation))} ponto(s) em relacao a Av1.`);
  } else if (variation > 0.5) {
    points.push(`A Av2 subiu ${formatScore(variation)} ponto(s) em relacao a Av1.`);
  }

  if (highScores.length >= Math.ceil(alunos.length * 0.3)) {
    points.push('Boa concentracao de medias altas: vale propor desafios extras.');
  }

  els.attentionList.innerHTML = points.map((point) => `<li>${escapeHtml(point)}</li>`).join('');
}

function renderTable() {
  const alunos = filteredStudents();

  if (!alunos.length) {
    els.studentsTable.innerHTML = '<tr><td colspan="7" class="empty-row">Nenhum aluno encontrado para este filtro.</td></tr>';
    return;
  }

  els.studentsTable.innerHTML = alunos.map((aluno) => {
    const statusClass = isApproved(aluno) ? 'approved' : 'recovery';
    return `
      <tr>
        <td data-label="Nº">${escapeHtml(aluno.numero)}</td>
        <td data-label="Av1">${formatScore(aluno.av1)}</td>
        <td data-label="Av2">${formatScore(aluno.av2)}</td>
        <td data-label="Média"><strong>${formatScore(aluno.media)}</strong></td>
        <td data-label="Final"><span class="status ${statusClass}">${escapeHtml(aluno.final)}</span></td>
        <td data-label="Observações">${escapeHtml(aluno.observacoes)}</td>
        <td data-label="Relatório"><button class="row-button" type="button" data-student="${escapeHtml(aluno.numero)}">Relatório</button></td>
      </tr>
    `;
  }).join('');

  els.studentsTable.querySelectorAll('button[data-student]').forEach((button) => {
    button.addEventListener('click', () => {
      const turma = getCurrentClass();
      const aluno = turma?.alunos.find((item) => String(item.numero) === button.dataset.student);
      if (aluno) selectStudent(aluno);
    });
  });
}

function selectStudent(aluno) {
  const turma = getCurrentClass();
  state.selecionado = aluno;
  els.reportTitle.textContent = `Aluno ${aluno.numero}`;
  els.printButton.disabled = false;
  els.studentReport.innerHTML = `
    <div class="report-lines">
      <div class="report-line"><span>Turma</span><strong>${escapeHtml(turma.turma)}</strong></div>
      <div class="report-line"><span>Número do aluno</span><strong>${escapeHtml(aluno.numero)}</strong></div>
      <div class="report-line"><span>Av1</span><strong>${formatScore(aluno.av1)}</strong></div>
      <div class="report-line"><span>Av2</span><strong>${formatScore(aluno.av2)}</strong></div>
      <div class="report-line"><span>Média</span><strong>${formatScore(aluno.media)}</strong></div>
      <div class="report-line"><span>Situação final</span><strong>${escapeHtml(aluno.final)}</strong></div>
    </div>
    <div class="report-observation">
      <p class="eyebrow">Observações</p>
      <p>${escapeHtml(aluno.observacoes)}</p>
    </div>
  `;
}

function renderEmptyReport() {
  els.reportTitle.textContent = 'Selecione um aluno';
  els.printButton.disabled = true;
  els.studentReport.innerHTML = '<p class="empty-state">Clique em um aluno da tabela para montar o relatório.</p>';
}

function filteredStudents() {
  const turma = getCurrentClass();
  if (!turma) return [];
  if (state.filtro === 'approved') return turma.alunos.filter(isApproved);
  if (state.filtro === 'recovery') return turma.alunos.filter((aluno) => !isApproved(aluno));
  if (state.filtro === 'high') return turma.alunos.filter((aluno) => aluno.media >= 8);
  return turma.alunos;
}

function getCurrentClass() {
  return state.turmas.find((item) => item.turma === state.turmaAtual) || state.turmas[0] || null;
}

function isApproved(aluno) {
  return normalize(aluno.final).includes('aprovado') || aluno.media >= 6;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toNumber(value) {
  if (typeof value === 'number') return value;
  const text = String(value).trim();
  if (!text) return Number.NaN;
  return Number(text.replace(',', '.'));
}

function formatScore(value) {
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

function normalize(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showMessage(text, isError) {
  els.message.textContent = text;
  els.message.classList.toggle('error', Boolean(isError));
}

function resetDashboard() {
  state.turmas = [];
  state.turmaAtual = '';
  state.filtro = 'all';
  state.selecionado = null;
  els.fileInput.value = '';
  els.dashboard.classList.add('is-empty');
  els.classTitle.textContent = 'Nenhuma planilha selecionada';
  els.classNote.textContent = 'Os dados aparecerão aqui depois do envio.';
  els.totalStudents.textContent = '0';
  els.averageScore.textContent = '0,0';
  els.approvedCount.textContent = '0';
  els.recoveryCount.textContent = '0';
  els.scoreHistogram.innerHTML = '<p class="empty-state">Carregue uma planilha para ver a distribuicao.</p>';
  els.situationChart.innerHTML = '<p class="empty-state">Os percentuais aparecem depois do envio.</p>';
  els.attentionList.innerHTML = '<li>Envie uma ou mais planilhas para gerar alertas.</li>';
  els.studentsTable.innerHTML = '<tr><td colspan="7" class="empty-row">Envie uma ou mais planilhas para preencher a tabela.</td></tr>';
  els.filterButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.filter === 'all');
  });
  renderClassSelect();
  renderEmptyReport();
  showMessage('', false);
}
