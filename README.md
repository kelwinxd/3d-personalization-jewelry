# Personalize — configurador 3D de semijoias

Monte colares (e em breve pulseiras e terços) em 3D e envie o pedido pelo WhatsApp.

Stack: Vite + React 19 + TypeScript, Three.js via React Three Fiber + drei, Zustand.

```bash
npm install
cp .env.example .env   # coloque o número da loja
npm run dev
```

## Como funciona

A peça é **montada em runtime a partir de partes**, em vez de um GLB por combinação:

- `src/scene/necklaceCurve.ts` gera a curva do colar (1 unidade = 1 cm). A queda é ajustada para o perímetro bater com o comprimento escolhido.
- `src/scene/linkGeometry.ts` define **um elo** por estilo de corrente. `Necklace.tsx` repete esse elo ao longo da curva com `InstancedMesh` (1 draw call por corrente).
- `src/scene/pendantGeometry.ts` tem pingentes procedurais provisórios. Convenção: frente em +Z, topo (ponto de encaixe) em y = 0.
- O banho (ouro/prata/rosé) é só o material do metal: trocar o banho não recarrega geometria.
- `src/catalog.ts` concentra opções e preços; `src/config.ts` calcula o preço e serializa a configuração na URL (link compartilhável); `src/whatsapp.ts` monta a mensagem do pedido.

## Adicionando um pingente em .glb (Blender, IA ou download)

1. Prepare o arquivo: remove partes indesejadas, deixa a textura de cor em tons de cinza (para o banho tingir) e comprime malhas e texturas.

   ```bash
   npm run model -- caminho/entrada.glb public/models/nome.glb --drop "^chain"
   ```

   Opções: `--drop <regex>` remove nós pelo nome; `--simplify <0..1>` reduz a malha;
   `--error <0..1>` é a tolerância da redução; `--keep-color` preserva as cores do
   modelo (esmalte, pedras); `--plain` descarta texturas e UVs (a peça passa a usar o
   metal do banho); `--sloppy` simplificação que ignora topologia.

   **Peça policromada** (esmalte, pedras, pintura), como modelos de IA (Tripo, Meshy)
   costumam ser. Preserva a aparência e ainda assim reduz bastante — no teste, 60 MB e
   1,1 M de vértices viraram 2,6 MB e 185 mil, sem diferença visível:

   ```bash
   npm run model -- entrada.glb public/models/nome.glb --simplify 0.05 --error 0.001 --keep-color
   ```

   Marque `tint: false` no catálogo para o banho não tingir por cima das cores.

   **Peça só de metal**, quando o arquivo for grande demais: `--plain --sloppy` com
   `--simplify 0.012` desce a algumas centenas de KB, mas descarta cores e detalhes
   finos. Use como último recurso.

2. Adicione uma entrada em `pendants` no `src/catalog.ts` com `model`:
   - `url`: caminho em `public/`
   - `mesh`: nome da malha no arquivo (veja com `npx gltf-transform inspect arquivo.glb`)
   - `rotation`: rotação que deixa a frente em +Z e o topo para cima
   - `heightCm`: altura real da peça (a escala do arquivo é ignorada)
   - `credit`: crédito, se a licença pedir (CC-BY)

`src/scene/ModelPendant.tsx` normaliza escala e encaixe e aplica a cor do banho mantendo relevo, pátina e mapa de metal do modelo.

## Créditos

- "Gothic Pendant Necklace" por [cedeon](https://sketchfab.com/cedeon), [Sketchfab](https://sketchfab.com/3d-models/gothic-pendant-necklace-da1b584886b94a7fb9c98dd642a319b3), licença CC-BY 4.0. Usado apenas para teste.
- Pingente "Independência": gerado no Tripo (IA).
