# Lumi – tempo de tela

Aplicação web de controle parental de tempo de tela para crianças de 2 a 5 anos, alinhada à recomendação da
Sociedade Brasileira de Pediatria (no máximo 1 hora de tela por dia, sempre com um adulto por perto). O vaga-lume
**Lumi** guia a criança e mostra o tempo restante sem números: o céu anoitece, o sol desce e os vaga-lumes se apagam.

- Next.js 16 (App Router) + TypeScript, Node.js 24 LTS.
- Sem backend e sem banco de dados: tudo fica no `localStorage` do aparelho.
- Exportação estática + service worker: funciona offline após o primeiro acesso e pode ser instalada (PWA).
- Dependências de execução: apenas `next`, `react` e `react-dom`. Sem fontes, ícones, análises ou serviços externos;
  a telemetria do Next.js é desligada pelos scripts do projeto.

## Como rodar

```bash
npm install
npm run dev        # desenvolvimento em http://localhost:3000
npm run build      # gera a versão estática em out/
npm start          # serve out/ em http://localhost:3000 (servidor sem dependências)
npm test           # testes da lógica de tempo, armazenamento e senha (node --test)
npm run typecheck
```

Para publicar, basta hospedar a pasta `out/` em qualquer servidor estático com **HTTPS** (o service worker e a
instalação na tela inicial exigem HTTPS ou `localhost`). Os ícones podem ser regenerados com
`node scripts/make-icons.mjs`.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `lib/time.ts` | Regras de tempo: limites (15–60 min), contagem, aviso, humor, virada do dia, histórico de 30 dias, resumo semanal |
| `lib/storage.ts` | Leitura/gravação no aparelho, validação dos dados lidos, exportação e apagamento |
| `lib/pin.ts` | Senha de 4 números guardada só como hash SHA-256 com sal (JS puro, funciona fora de HTTPS) |
| `lib/audio.ts` | Sons sintetizados (Web Audio) e voz do sistema restrita a vozes locais |
| `components/App.tsx` | Orquestração: telas, relógio da contagem, salvamento periódico, virada do dia |
| `components/World.tsx`, `Game.tsx`, `Story.tsx` | Telas infantis em que o tempo é contado |
| `components/Closing.tsx`, `Locked.tsx` | Encerramento lúdico e bloqueio até o dia seguinte |
| `components/AdultGate.tsx`, `Panel.tsx` | Acesso dos adultos (segurar 3 s + senha) e painel do responsável |
| `public/sw.js`, `public/manifest.webmanifest` | Offline e instalação |

## Decisões importantes

- **Contagem do tempo:** só soma tempo nas telas infantis (mundo, jogo, história), com a aplicação visível e ainda
  com tempo disponível. Usa o relógio monotônico do navegador (`performance.now`) e descarta intervalos acima de 3 s,
  então suspensão do aparelho ou mudança no relógio não aumentam nem zeram a contagem. O progresso é gravado a cada
  5 s e ao sair/ocultar a aplicação.
- **Limite:** nunca passa de 60 min (validado também ao ler os dados). Mudanças no painel valem a partir do dia seguinte:
  o dia atual guarda o limite vigente.
- **Virada do dia:** checada a cada segundo e ao reabrir a aplicação; o dia anterior vai para o histórico e o novo
  começa zerado e liberado. Relógio voltando para uma data anterior é ignorado.
- **Encerramento:** cada execução é um componente novo; ao reiniciar (por exemplo, quando o adulto entra e volta),
  temporizadores e falas da execução anterior são cancelados. Ao fim, a tela fica bloqueada até a meia-noite. Não
  existe forma de liberar tempo extra.
- **Sons de aviso:** o aviso de "falta pouco" e o som de fim de tempo tocam mesmo com os sons desligados.
- **Voz:** usa apenas vozes instaladas no aparelho (`localService`). Vozes "online" enviariam o texto a terceiros e são
  ignoradas; se não houver voz local em português, o Lumi fica sem voz e o painel avisa.
- **Privacidade:** nada é gravado antes do consentimento. O responsável pode ver, exportar (JSON) e apagar todos os
  dados; retirar o consentimento é apagar tudo.

## Limitações conhecidas

- Sem servidor, não há como saber a hora "verdadeira": adiantar a data do aparelho para o dia seguinte faz o Lumi
  começar um novo dia. Para crianças de 2 a 5 anos isso é improvável, e o responsável vê o histórico no painel.
- Os dados ficam no navegador: limpar os dados do site, usar navegação anônima ou trocar de navegador começa do zero.
- O tempo é contado apenas dentro do Lumi; outros apps e sites não são bloqueados (fora do escopo).
