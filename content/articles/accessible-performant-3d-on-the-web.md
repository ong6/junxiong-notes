---
title: How I build 3D that still behaves like a web page
description: How junxiong.dev uses Three.js with native scroll, one active canvas, reduced motion and a readable fallback.
date: 2026-09-19
updated: 2026-09-19
tags: [threejs, webgl, accessibility, performance, frontend]
---

## The page has to work without the scene

I added 3D to the [hobbies page on junxiong.dev](https://junxiong.dev/hobbies) for one narrow reason: sometimes a small spatial object says more than another card. It is very easy to turn that into a worse website. A canvas can erase the document structure, trap scrolling, ignore motion preferences, burn the GPU below the fold and leave a blank rectangle when WebGL fails.

My rule is that the article, controls and explanation remain ordinary HTML. The canvas is a visual rendering of the same idea, never the only copy of it. That makes the requirements concrete:

- scrolling remains browser scrolling;
- headings, text, links and controls stay in the document;
- reduced motion changes behavior rather than merely shortening the animation;
- an off-screen chapter owns no canvas or WebGL context;
- failure leaves a labelled illustration rather than an error message; and
- the page downloads no models, textures, HDR environments or web fonts for 3D.

I now have two related implementations. The live-slide renderer in my `uipack` library keeps one scene alive while authored camera stops change. The hobbies page is simpler and more disposable: six semantic chapters stay in the document, while only the chapter crossing the viewport centre mounts a canvas and creates a Three.js renderer. They share principles, not a runtime.

```uipack The document owns navigation. Only the chapter at the viewport centre gets a canvas; leaving it tears the renderer down, while the labelled CSS fallback never leaves the page.
three-scene-lifecycle
```

## Three.js, without React Three Fiber

Both implementations use Three.js directly. On the hobbies page, React mounts a canvas for the active chapter and an effect constructs its renderer. In `uipack`, React hands an element to an imperative `createSlideScene()` function whose small API moves to a named stop, pauses flow, changes the reduced-motion setting and disposes the runtime.

React Three Fiber is good software, but it would not remove the difficult work here. I would still need to decide which chapter owns a context, when frames run, how fallback content works and what cleanup means. For these small renderers, direct boundaries make the lifetimes obvious. `uipack` retains its canvas across stops. Hobbies does the opposite: changing the centred chapter unmounts the previous canvas, runs its cleanup and mounts the next one. The page never has more than one canvas, but it does not pretend six unrelated objects are one continuous scene.

There is also a bundle boundary. The hobbies component dynamically imports `three` only after its active canvas passes a WebGL capability check. Server rendering emits the chapters and labelled CSS illustrations with no canvas. Separately, `three` and `gsap` are optional peers of `uipack`; its normal SVG exports import neither.

That choice has a cost. I manually own resource disposal, scene mutation and the bridge between Three.js and React. A larger product with many interactive objects, shared state and custom shaders could cross the line where React Three Fiber earns its abstraction. These scenes contain a small set of authored shapes, so I prefer the smaller interface.

## Two lifecycles for two jobs

The `uipack` slide scene is data-driven. A story contains nodes, connections and stops. Each node has an ID, label, base position, size, shape and semantic colour. Each stop supplies a camera position and target, plus optional node poses, visible labels and active connections.

Every stop resolves from the base story rather than the previous stop. Someone can open a deep link, jump from the first slide to the last, reverse halfway through a transition or enable reduced motion while the camera is moving. The destination stays deterministic because it does not depend on the path taken to reach it. A new transition kills the old GSAP timeline and begins from the current pose.

That renderer has one `WebGLRenderer`, one `Scene` and one `PerspectiveCamera`. Stop changes retain the canvas. Theme or story changes rebuild the runtime because they change the scene's materials or graph. The slide camera uses a 32-degree field of view with near and far planes at 0.1 and 160. It can orbit around a target or dolly directly. Labels and packets fade during moves so projected HTML does not visibly hunt for a position.

Hobbies needs none of that choreography. Each chapter builds one fixed object behind a 35-degree perspective camera at `[0, 0, 7]`. The coding scene has a terminal and wireframe core; tennis has two rackets and a ball; trading has a risk ladder; the home server is an unfinished wireframe chassis; travel is a small route map; reading is an open book. The active object moves gently until the reader pauses it or asks for reduced motion. Crossing into another chapter destroys that scene and creates the next one.

## Geometry is cheaper than an asset pipeline

Everything in both renderers is procedural. The richer slide renderer uses boxes and an icosahedron for components, edge geometries for boundaries, an instanced mesh for repeated records, toruses for restrained rings and buffer geometries for its grid and curved connections.

The hobbies objects use an even smaller vocabulary: boxes, spheres, cylinders, toruses, planes, an icosahedron and buffer-geometry lines. Their solids use `MeshStandardMaterial` with roughness `0.62` and metalness `0.08`, lit by one hemisphere light and one directional light. There are no shadows, reflections, post-processing passes or physically based texture sets.

This is an aesthetic constraint as much as a performance one. Loading a detailed GLB of a server rack would cost more bytes, more GPU memory and more visual attention while saying less than an unfinished wireframe chassis. If I later add a model, it has to communicate something geometry and type cannot.

Text remains HTML. The hobbies canvas contains no labels and is `aria-hidden`; each chapter's real `h2`, prose and links sit beside it. The `uipack` slides do project HTML labels from 3D positions, then avoid collisions and repeat the information in screen-reader content. That tradeoff belongs to the presentation component, not the hobbies page.

## Scroll should select the scene, not simulate a browser

The slide player has explicit Previous, Next and numbered buttons. Its keyboard shortcuts are scoped to the focused player, and it ignores keystrokes from editable controls. That is right for a deck. The hobbies page takes a different route.

The shipped page has six normal document sections and ordinary anchor links. There is no wheel listener, fake scrollbar or smooth-scroll engine. The browser owns scrolling, touch momentum, Page Down, Space, find-in-page, history restoration and anchors. An [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) supplies change callbacks; on each callback I inspect the sections' bounding rectangles and select the one containing the viewport centre. The observer tells me when to check. It does not become a precision scroll-position instrument.

This loses some cinematic control. A scrubbed timeline can map every pixel to an object pose; native chapters produce discrete scene changes. I take that trade. Readers move through the page with the input method and speed they already use, and each object still gives its chapter a visual identity.

When a chapter leaves the centre, React removes its canvas. Cleanup cancels its pending [`requestAnimationFrame()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), disconnects its `ResizeObserver` and disposes the renderer. The next centred chapter starts fresh. This is more churn than retaining the `uipack` scene, but it gives off-screen chapters the strongest possible idle state: no canvas and no WebGL context.

## Motion is optional; meaning is not

The hobbies UI reads [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) with `matchMedia`. It creates the active 3D object and draws a static frame, but never enters the animation-frame loop and does not show the Pause button. The chapter headings, prose, links and labelled CSS fallback remain available. `uipack` also accepts an explicit `motion="none"` setting; it applies stops immediately and freezes packets at the middle of their routes.

That distinction matters. Replacing a camera orbit with a 0.01-second orbit technically reduces its duration, but it still flashes movement and provides no benefit. Reduced motion here means no camera transition and no looping object motion. It does not mean a reduced version of the content.

The hobbies canvas is `aria-hidden`. Every chapter keeps a labelled CSS illustration behind it, so the fallback has a name even though its glyph is decorative. The six headings, paragraphs and links never depend on WebGL. In `uipack`, the player exposes the current stop's title and caption as live HTML, followed by a visually hidden list of visible nodes and their details.

Before importing Three.js, hobbies checks whether a temporary canvas can create a WebGL context. If it cannot, or constructing `WebGLRenderer` throws, the labelled CSS illustration remains and no motion control appears. It also listens for [`webglcontextlost`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event), cancels the frame loop and returns to that fallback. `uipack` applies the same boundary with a richer HTML diagram.

## The performance budget is architectural

I do not have a production Lighthouse trace for the hobbies page yet, so I am not going to invent a kilobyte or frame-time claim. I can state what the code enforces:

| Budget | Shipped decision |
|---|---|
| WebGL contexts | One renderer and canvas for the centred hobby chapter; zero for the other five |
| 3D assets | Zero model, texture, environment-map or font downloads |
| Pixel density | `devicePixelRatio` capped at 1.5 |
| GPU preference | `low-power` |
| Frame loop | Runs for the active object; Pause and reduced motion stop it |
| Hidden work | Off-screen chapters unmount their canvases |
| Expensive effects | No shadows or post-processing |
| 3D loading | Dynamic import after the active canvas passes the WebGL check |
| Baseline experience | Complete HTML and labelled CSS illustrations before Three.js loads |

Pixel ratio deserves the explicit cap. A device-pixel ratio of three asks the GPU to shade nine device pixels for every CSS pixel. MDN's [WebGL best-practices guide](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#devicepixelratio_and_high-dpi_rendering) recommends treating high-DPI drawing-buffer size as a performance decision rather than blindly multiplying by `devicePixelRatio`. I cap hobbies at 1.5 because its broad surfaces and lines do not earn nine samples per CSS pixel. That is a design choice, not a benchmark result.

The hobbies loop is intentionally simple. The centred object renders continuously so its restrained motion remains visible. Pause cancels the frame; reduced motion renders only the resize/static frame; moving to another chapter unmounts the canvas and cancels the old request. This is less efficient than `uipack`'s demand-driven loop for a still slide, but there is never an off-screen hobbies renderer ticking.

Cleanup is part of the budget. Three.js cannot infer when application-owned GPU resources are no longer needed. Its API docs say to dispose each [buffer geometry](https://threejs.org/docs/pages/BufferGeometry.html#BufferGeometry.dispose), [material](https://threejs.org/docs/pages/Material.html#Material.dispose) and the [renderer](https://threejs.org/docs/pages/WebGLRenderer.html#WebGLRenderer.dispose) when the application is finished with them. Both implementations do that. Hobbies traverses the departing scene, disposes each geometry and material, then disposes the renderer and releases its context.

## I test the exits, not only the picture

A screenshot can prove that one frame looks good. Most failures in these components happen before or after that frame, so both suites check their lifecycles.

The `uipack` unit tests validate story data, reject dangling connections and unsafe poses, and confirm that each stop resolves independently. React tests render the slide component on the server and assert that its readable diagram exists without a browser or canvas. They cover controlled and uncontrolled navigation, keyboard boundaries, reduced motion, invalid story data and restoration of page scrolling after presentation mode unmounts.

Its Playwright suite covers the browser failures that mocks tend to miss: interrupted and reverse navigation retaining one canvas, immediate reduced-motion stops, theme rebuilds, blocked WebGL, diagram switching and a 390-pixel viewport.

The hobbies page has its own Playwright suite. It runs the six chapters at 390 and 1440 pixels in both themes, checks semantic heading order, native scrolling, lack of horizontal overflow, 44-pixel controls and a clean browser console. It then scrolls between chapters and asserts exactly one canvas, verifies that Pause stops its frame counter, confirms the old canvas disappears, checks that reduced motion holds the counter on one static frame, forces WebGL creation to fail and reads the labelled fallback, and exercises the expanded trading visual.

## What I am deliberately giving up

Direct Three.js gives me an inspectable lifecycle, but I write more plumbing. The retained `uipack` scene avoids canvas churn, but story and theme changes require a rebuild. The hobbies page trades the other way: every chapter switch rebuilds a tiny scene so off-screen chapters own nothing. CSS fallbacks preserve a labelled visual, but not the spatial composition. Native scroll preserves browser behavior, but cannot deliver frame-perfect scroll choreography. Zero-asset scenes are fast to start and easy to license, but they will never look like a Blender render.

Those limits fit the job. The 3D layer on junxiong.dev gives each hobby a little physical character, then gets out of the reader's way. If it becomes the thing a person has to operate before they can read the page, I have built the wrong page.
