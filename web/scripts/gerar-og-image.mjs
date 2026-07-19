// Script local (nao faz parte do app router) que gera public/og-image.png UMA vez,
// usando next/og so em tempo de desenvolvimento -- assim o motor de renderizacao
// (satori/resvg/wasm) nunca entra no bundle do Worker deployado no Cloudflare.
// Uso: node scripts/gerar-og-image.mjs

import { ImageResponse } from "next/og.js";
import { writeFile } from "node:fs/promises";

const CARVAO = "#17191C";
const MARFIM = "#F4F2ED";
const LATAO = "#C9A15C";
const CINZA = "#B9B3A8";

const imagem = new ImageResponse(
  {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: CARVAO,
      },
      children: [
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 4 },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex", gap: 10 },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { width: 64, height: 6, background: LATAO, borderRadius: 3, display: "flex" },
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { width: 32, height: 6, background: LATAO, borderRadius: 3, display: "flex" },
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: { display: "flex", fontSize: 96, color: MARFIM, fontWeight: 700, letterSpacing: -2 },
                  children: "Comptus",
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              marginTop: 36,
              fontSize: 44,
              fontWeight: 700,
              color: MARFIM,
              maxWidth: 980,
              lineHeight: 1.2,
            },
            children: "Sua agenda cheia, sem grupo de WhatsApp lotado",
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", marginTop: 24, width: 60, height: 3, background: LATAO },
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", marginTop: 20, fontSize: 26, color: CINZA },
            children: "Agendamento online para barbearias e salões de beleza",
          },
        },
      ],
    },
  },
  { width: 1200, height: 630 }
);

const buffer = Buffer.from(await imagem.arrayBuffer());
await writeFile(new URL("../public/og-image.png", import.meta.url), buffer);
console.log(`Gerado public/og-image.png (${buffer.length} bytes)`);
