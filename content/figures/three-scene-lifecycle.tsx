/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Label, Node, Packet } from "uipack";
import { define } from "./_shared";

const replacePath: [number, number][] = [[804, 176], [804, 260], [584, 260], [584, 304]];
const fallbackPath: [number, number][] = [[332, 176], [332, 260], [244, 260], [244, 304]];

export default define({
  alt: "Six native page sections and their labelled CSS illustrations remain in the document. Intersection Observer callbacks identify which section crosses the viewport centre. Only that chapter mounts a canvas and Three.js renderer. Leaving the chapter unmounts its canvas, cancels its animation frame, disconnects its resize observer and disposes the renderer. Reduced motion renders one static frame. If WebGL is unavailable, the labelled CSS illustration remains.",
  viewBox: "0 0 1080 456",
  children: (
    <>
      <Defs id="tsl" />
      <Node size={19} subSize={13} x={36} y={88} w={220} h={88} label="Six HTML sections" sub="native document scroll" icon="doc" />
      <Connector points={[[256, 132], [324, 132]]} defs="tsl" kind="request" />
      <Packet points={[[256, 132], [324, 132]]} kind="request" dur={1.6} r={4} />

      <Node size={19} subSize={13} x={324} y={88} w={240} h={88} label="Viewport centre" sub="observer callback + rects" icon="search" />
      <Connector points={[[564, 132], [632, 132]]} defs="tsl" kind="change" />
      <Packet points={[[564, 132], [632, 132]]} kind="change" dur={1.6} delay={-0.6} r={4} />

      <Node size={19} subSize={13} x={632} y={88} w={220} h={88} label="Active chapter" sub="one canvas · one renderer" icon="route" />
      <Connector points={[[852, 132], [920, 132]]} defs="tsl" kind="response" />
      <Packet points={[[852, 132], [920, 132]]} kind="response" dur={1.6} delay={-1.1} r={4} />
      <Node size={19} subSize={13} x={920} y={88} w={124} h={88} label="3D object" sub="route-loaded" accent icon="model" />

      <Connector points={replacePath} defs="tsl" kind="change" dashed />
      <Label size={13} x={686} y={250} text="chapter leaves centre" anchor="middle" />
      <Packet points={replacePath} kind="change" dur={2.4} delay={-0.7} r={4} />
      <Node size={19} subSize={13} x={456} y={304} w={256} h={88} label="Tear down old canvas" sub="cancel rAF · dispose renderer" icon="pause" />

      <Connector points={fallbackPath} defs="tsl" kind="change" dashed />
      <Label size={13} x={280} y={250} text="WebGL unavailable" anchor="middle" />
      <Packet points={fallbackPath} kind="change" dur={2.2} delay={-1.2} r={4} />
      <Node size={19} subSize={13} x={116} y={304} w={256} h={88} label="Labelled CSS fallback" sub="mounted for every chapter" icon="diagram" />
    </>
  ),
});
