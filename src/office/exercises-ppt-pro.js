// PowerPoint practice projects (part 2): transitions, animations, pictures, video, File tab
function PPT_EXERCISES_PRO(makeSlide) {
  const F = () => (typeof Office !== 'undefined' ? Office.FILE : {});
  const saved = (folder, name) => (F().saves || []).some((s) => s.folder === folder && s.name.toLowerCase() === name.toLowerCase());
  const exported = (folder, name) => (F().exported || []).some((s) => s.folder === folder && s.name.toLowerCase() === name.toLowerCase());
  const pres = (slides, theme = 'office') => ({ theme, slides });
  const ph = (a, i, p) => a.P.slides[i] && a.P.slides[i].els.find((e) => e.ph === p);
  const pic = (a, i) => a.P.slides[i] && a.P.slides[i].els.find((e) => e.type === 'image');
  return [
    {
      id: 'p6', title: 'Transitions & Animations', skills: ['Transitions', 'Effect Options', 'Duration', 'Animations', 'Add Animation', 'Timing'],
      intro: 'Make a presentation about recycling come alive with transitions and animations.',
      start: () => pres([makeSlide('title', { title: 'Reduce, Reuse, Recycle', subtitle: 'Green School Project – Grade 7' }), makeSlide('titleContent', { title: 'Why Recycle?', body: 'Saves natural resources\nReduces pollution\nSaves energy' }), makeSlide('titleContent', { title: 'What Can We Recycle?', body: 'Paper and cardboard\nPlastic bottles\nCans and glass' }), makeSlide('title', { title: 'Thank you!', subtitle: 'Let\'s keep our school green' })], 'green'),
      tasks: [
        { text: 'Apply the <b>Fade</b> transition to <b>all slides</b>.', hint: 'Transitions › Fade › Apply To All.', check: (a) => a.P.slides.filter((_, i) => i !== 1).every((s) => s.transition === 'fade') },
        { text: 'Change the transition of <b>slide 2</b> to <b>Push</b> with the effect option <b>From Right</b>.', hint: 'Select slide 2 › Transitions › Push › Effect Options › From Right.', check: (a) => { const s = a.P.slides[1]; return s.transition === 'push' && s.tOpt && s.tOpt.dir === 'From Right'; } },
        { text: 'Set the transition <b>Duration</b> of slide 2 to <b>1.50</b> seconds.', check: (a) => { const s = a.P.slides[1]; return s.tOpt && Math.abs(s.tOpt.dur - 1.5) < 0.01; } },
        { text: 'On slide 1, apply the <b>Fly In</b> entrance animation to the <b>title</b> with the effect option <b>From Left</b>.', hint: 'Select the title › Animations › Fly In › Effect Options › From Left.', check: (a) => { const t = ph(a, 0, 'title'); return !!t && a.seq(0).some((x) => x.el === t.id && x.cat === 'in' && x.eff === 'fly' && x.dir === 'From Left'); } },
        { text: 'Apply the <b>Zoom</b> entrance animation to the <b>subtitle</b> of slide 1. Set <b>Start: After Previous</b> and <b>Delay: 0.50</b>.', check: (a) => { const t = ph(a, 0, 'subtitle'); return !!t && a.seq(0).some((x) => x.el === t.id && x.eff === 'zoom' && x.start === 'after' && Math.abs(x.delay - 0.5) < 0.01); } },
        { text: 'Use <b>Add Animation</b> to add the <b>Pulse</b> emphasis effect to the title of slide 1 (keep Fly In).', hint: 'Animations › Add Animation › Emphasis › Pulse.', check: (a) => { const t = ph(a, 0, 'title'); return !!t && a.seq(0).some((x) => x.el === t.id && x.eff === 'fly') && a.seq(0).some((x) => x.el === t.id && x.cat === 'emph' && x.eff === 'pulse'); } },
        { text: 'Set <b>slide 4</b> to advance automatically <b>After 5</b> seconds.', hint: 'Transitions › Timing › Advance Slide › After.', check: (a) => { const s = a.P.slides[3]; return !!s && s.tOpt && Math.abs(+s.tOpt.after - 5) < 0.01; } },
        { text: 'Open the <b>Animation Pane</b> and play the slide show <b>From Beginning</b>.', check: (a) => a.played && !!document.getElementById('animPane') || a.played },
      ],
    },
    {
      id: 'p7', title: 'Pictures & Video', skills: ['Insert Picture', 'Picture Styles', 'Corrections', 'Color', 'Artistic Effects', 'Crop', 'Insert Video', 'Playback'],
      intro: 'Add and edit a picture, then insert a video and set its playback options.',
      start: () => pres([makeSlide('title', { title: 'Our Planet', subtitle: 'Geography Club' }), makeSlide('titleOnly', { title: 'Computers in School' }), makeSlide('titleOnly', { title: 'The Ocean' })]),
      tasks: [
        { text: 'On <b>slide 2</b>, insert the stock picture <b>Computer</b>.', hint: 'Insert › Pictures › Stock Images › Computer.', check: (a) => !!pic(a, 1) },
        { text: 'Apply the picture style <b>Drop Shadow Rectangle</b>.', hint: 'Select the picture › Picture Format › Picture Styles.', check: (a) => { const p = pic(a, 1); return !!p && p.fx && p.fx.style === 'dropShadow'; } },
        { text: 'Apply the correction <b>Brightness: +20% Contrast: +20%</b>.', hint: 'Picture Format › Corrections.', check: (a) => { const p = pic(a, 1); return !!p && p.fx && p.fx.bright === 20 && p.fx.contrast === 20; } },
        { text: 'Recolor the picture to <b>Grayscale</b>.', hint: 'Picture Format › Color › Recolor.', check: (a) => { const p = pic(a, 1); return !!p && p.fx && p.fx.recolor === 'gray'; } },
        { text: 'Apply the artistic effect <b>Pencil Sketch</b>.', hint: 'Picture Format › Artistic Effects.', check: (a) => { const p = pic(a, 1); return !!p && p.fx && p.fx.art === 'sketch'; } },
        { text: 'Crop the picture to the shape <b>Circle</b> and set its <b>Height</b> to <b>3"</b> (keep the aspect ratio).', hint: 'Picture Format › Crop › Crop to Shape; Size › Height.', check: (a) => { const p = pic(a, 1); return !!p && p.fx && p.fx.shape === 'circle' && Math.abs(p.h / 72 - 3) < 0.03; } },
        { text: 'On <b>slide 3</b>, insert the stock video <b>Ocean waves</b>.', hint: 'Insert › Video › Stock Videos...', check: (a) => a.P.slides[2] && a.P.slides[2].els.some((e) => e.type === 'video' && e.src === 'stock:ocean') },
        { text: 'Set the video to <b>Start: Automatically</b> and <b>Loop until Stopped</b>.', hint: 'Select the video › Playback tab.', check: (a) => { const v = a.P.slides[2] && a.P.slides[2].els.find((e) => e.type === 'video'); return !!v && v.opts.start === 'auto' && v.opts.loop; } },
      ],
    },
    {
      id: 'p8', title: 'Save, Export & Print', skills: ['Save As', 'PowerPoint Show', 'Export PDF', 'Print Handouts', 'Properties'],
      intro: 'Prepare a presentation for the science fair using the File tab.',
      start: () => pres([makeSlide('title', { title: 'Science Fair 2026', subtitle: 'Solar-powered Car' }), makeSlide('titleContent', { title: 'How It Works', body: 'Solar panel collects sunlight\nMotor turns the wheels\nNo fuel needed' }), makeSlide('titleContent', { title: 'What We Learned', body: 'Energy can change form\nTeamwork matters' })], 'blue'),
      tasks: [
        { text: 'Add the <b>Tags</b> property <b>science, grade 8</b>.', hint: 'File › Info › Properties › Tags.', check: () => /science/i.test(F().props?.tags || '') && /grade 8/i.test(F().props?.tags || '') },
        { text: 'Save the presentation in <b>Documents</b> as <b>Science Fair</b> (*.pptx).', check: () => saved('Documents', 'Science Fair.pptx') },
        { text: 'Save a copy as a <b>PowerPoint Show (*.ppsx)</b> on the <b>Desktop</b> named <b>Science Fair Show</b>.', hint: 'File › Save As › Browse › Save as type.', check: () => saved('Desktop', 'Science Fair Show.ppsx') },
        { text: 'Export the presentation as <b>PDF</b> to the <b>Desktop</b> named <b>Science Fair</b>.', check: () => exported('Desktop', 'Science Fair.pdf') },
        { text: 'Print <b>2 copies</b> of <b>3 Slides Handouts</b> in <b>Grayscale</b>.', hint: 'File › Print › Full Page Slides › 3 Slides Handouts; Color › Grayscale.', check: () => { const p = F().print; return !!p && +p.copies === 2 && p.layout === '3 Slides Handouts' && p.color === 'Grayscale'; } },
      ],
    },
  ];
}
