# tchelo educa - Painel de Notas

Site simples para professores carregarem planilhas de notas e gerarem um painel de análise da turma, com relatórios individuais para impressão.

## Acesse o site

Abra pelo GitHub Pages:

https://marcelohas.github.io/tcheloeduca-painel/

## O que o painel faz

- Carrega uma ou várias planilhas `.xlsx` ao mesmo tempo.
- Permite alternar entre turmas carregadas.
- Mostra total de alunos, média geral, aprovados e alunos em recuperação.
- Gera gráficos de distribuição das médias e situação geral da turma.
- Mostra pontos de atenção automaticamente.
- Permite filtrar alunos por situação.
- Gera relatório individual por aluno com botão de impressão.
- Funciona sem servidor: basta abrir o `index.html` no navegador.
- Tem modo claro e modo escuro.

## Modelo da planilha

As planilhas devem seguir este padrão:

| Número aluno | Av1 | Av2 | Média | Final | Observações |
|---|---:|---:|---:|---|---|
| 1 | 7,0 | 8,0 | 7,5 | Aprovado | Bom desempenho |

No topo da planilha, informe a turma:

```text
Ano/Turma: 6A
```

No rodapé, inclua as considerações sobre a turma:

```text
Considerações sobre a turma: ...
```

## Planilhas de exemplo

As planilhas fictícias estão na pasta:

https://github.com/marcelohas/tcheloeduca-painel/tree/main/planilhas_notas

Turmas disponíveis:

- 6A
- 6B
- 7A
- 7B

Cada planilha tem 35 alunos fictícios.

## Como usar

1. Acesse o site.
2. Clique em `Abrir planilhas` para encontrar os modelos no GitHub.
3. Baixe uma ou mais planilhas.
4. Volte ao site e clique em `Escolher planilhas`.
5. Selecione os arquivos `.xlsx`.
6. Use o campo `Ver turma` para alternar entre as turmas.
7. Clique em `Relatório` em qualquer aluno para ver o relatório individual.
8. Clique em `Imprimir relatório` para imprimir.

## Como usar localmente

Baixe a pasta do projeto e abra o arquivo:

```text
index.html
```

O projeto não precisa de instalação nem servidor.

## Estrutura

```text
tcheloeduca-painel/
├─ index.html
├─ css/
│  └─ style.css
├─ js/
│  ├─ app.js
│  └─ xlsx.full.min.js
├─ planilhas_notas/
│  ├─ notas_6A.xlsx
│  ├─ notas_6B.xlsx
│  ├─ notas_7A.xlsx
│  └─ notas_7B.xlsx
└─ README.md
```

## Autor

Projeto de **tchelo educa**.

LinkedIn: https://www.linkedin.com/in/tcheloparaprofessores/
