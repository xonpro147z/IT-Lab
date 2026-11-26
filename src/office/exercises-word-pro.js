// Word practice projects (part 2): File tab, Styles, TOC, Header/Footer, Track Changes, Compare/Combine
function WORD_EXERCISES_PRO() {
  const F = () => (typeof Office !== 'undefined' ? Office.FILE : {});
  const saved = (folder, name) => (F().saves || []).some((s) => s.folder === folder && s.name.toLowerCase() === name.toLowerCase());
  const exported = (folder, name) => (F().exported || []).some((s) => s.folder === folder && s.name.toLowerCase() === name.toLowerCase());
  const tc = (who, t) => `<${t === 'ins' ? 'ins' : 'del'} class="tc" data-a="${who}" data-t="2026-11-20T08:00:00Z" style="--tcc:#2b579a" title="${t === 'ins' ? 'Inserted' : 'Deleted'}: ${who}">`;
  const putDoc = (name, html) => Office.FS.put('Documents', { name, app: 'Word', data: { html, hdr: '', ftr: '', L: {} }, at: Date.now() - 3600e3, size: '18 KB' });
  const ESSAY = {
    draft: '<h1>My Favorite Season</h1><p>My favorite season is autumn. The weather is cool and the sky is clear.</p><p>In autumn, my family often visits the countryside. We pick fruit and walk along the river.</p><p>Autumn makes me feel calm and happy.</p>',
    teacher: '<h1>My Favorite Season</h1><p>My favorite season is autumn because the weather is cool and the sky is bright blue.</p><p>In autumn, my family often visits our grandparents in the countryside. We pick oranges and walk along the river.</p><p>Autumn always makes me feel calm, thankful and happy.</p>',
    friend: '<h1>My Favorite Season</h1><p>My favorite season is autumn. The weather is cool and the sky is clear.</p><p>In autumn, my family often visits the countryside. We pick fruit, fly kites and walk along the river.</p><p>Autumn makes me feel calm and happy.</p>',
  };
  return [
    {
      id: 'w8', title: 'File Management & Protection', skills: ['File › Info', 'Save As', 'Export PDF', 'Protect Document', 'Print'],
      intro: 'Use the File tab (Backstage view): document properties, Save As, PDF export, password protection and printing.',
      start: '<p class="title">Science Club Report</p><p>This semester the Science Club organized three experiments: growing beans under different light colors, building a simple electric circuit, and measuring rainfall at school.</p><h1>Results</h1><p>Beans under natural light grew fastest. The circuit project helped students understand series and parallel connections.</p><h1>Next Steps</h1><p>Next semester we will visit the city science museum.</p>',
      tasks: [
        { text: 'Set the document <b>Title</b> property to <b>Science Club Report</b>.', hint: 'File › Info › Properties › Title (click "Add a title").', check: () => (F().props?.title || '').trim().toLowerCase() === 'science club report' },
        { text: 'Save the document in the <b>Documents</b> folder with the file name <b>Science Club Report</b> as a <b>Word Document (*.docx)</b>.', hint: 'File › Save As › Browse (or press F12).', check: () => saved('Documents', 'Science Club Report.docx') },
        { text: 'Export the document as a <b>PDF</b> to the <b>Desktop</b> with the file name <b>Science Club Report</b>.', hint: 'File › Export › Create PDF/XPS, choose Desktop.', check: () => exported('Desktop', 'Science Club Report.pdf') },
        { text: 'Encrypt the document with the password <b>Club2026</b>.', hint: 'File › Info › Protect Document › Encrypt with Password.', check: () => F().password === 'Club2026' },
        { text: 'Print <b>2 copies</b> in <b>Landscape Orientation</b> on the printer <b>HP LaserJet Pro (Computer Lab)</b>.', hint: 'File › Print (Ctrl+P). Choose the printer, copies and orientation, then click Print.', check: () => { const p = F().print; return !!p && +p.copies === 2 && p.orient === 'landscape' && /HP LaserJet/.test(p.printer); } },
        { text: '<b>Mark the document as final</b>.', hint: 'File › Info › Protect Document › Mark as Final.', check: () => !!F().final },
      ],
    },
    {
      id: 'w9', title: 'Styles & Table of Contents', skills: ['Styles', 'Modify Style', 'Table of Contents', 'Update Table'],
      intro: 'Apply built-in styles, modify a style, then create and update an automatic table of contents.',
      start: '<p>Computer Basics</p><p>Introduction</p><p>A computer is an electronic device that processes data according to instructions.</p><p>Hardware</p><p>Hardware is the physical part of a computer that you can touch.</p><p>Input Devices</p><p>Keyboard, mouse, microphone and scanner send data into the computer.</p><p>Output Devices</p><p>Monitor, printer and speakers show or play the results.</p><p>Software</p><p>Software is a set of programs, such as the operating system and applications.</p><p>Conclusion</p><p>Hardware and software work together to help people solve problems.</p>',
      tasks: [
        { text: 'Apply the <b>Title</b> style to the first paragraph <b>"Computer Basics"</b>.', hint: 'Home › Styles › Title.', check: (a) => a.styleOf('Computer Basics') === 'Title' },
        { text: 'Apply the <b>Heading 1</b> style to <b>Introduction</b>, <b>Hardware</b>, <b>Software</b> and <b>Conclusion</b>.', hint: 'Click in each paragraph, then Home › Styles › Heading 1 (or Ctrl+Alt+1).', check: (a) => ['Introduction', 'Hardware', 'Software', 'Conclusion'].every((t) => a.styleOf(t) === 'Heading 1') },
        { text: 'Apply the <b>Heading 2</b> style to <b>Input Devices</b> and <b>Output Devices</b>.', check: (a) => ['Input Devices', 'Output Devices'].every((t) => a.styleOf(t) === 'Heading 2') },
        { text: 'Modify the <b>Heading 1</b> style: font size <b>16 pt</b> and font color <b>Red</b> (any red).', hint: 'Right-click Heading 1 in the Styles gallery › Modify...', check: (a) => { const m = a.L.styleMods && a.L.styleMods['Heading 1']; if (!m || +m.size !== 16) return false; const [r, g, b] = (m.color || '#000000').match(/[0-9a-f]{2}/gi).map((x) => parseInt(x, 16)); return r > 170 && g < 90 && b < 90; } },
        { text: 'Click at the start of <b>Introduction</b> and insert <b>Automatic Table 2</b> (title "Table of Contents").', hint: 'Click at the start of "Introduction", References › Table of Contents › Automatic Table 2.', check: (a) => { const t = a.body.querySelector('.toc'); return !!t && t.dataset.title === 'Table of Contents' && ['Introduction', 'Input Devices', 'Conclusion'].every((x) => t.textContent.includes(x)); } },
        { text: 'At the end of the document type a new paragraph <b>References</b>, apply <b>Heading 1</b>, then <b>update the entire table</b> of contents.', hint: 'References › Update Table › Update entire table.', check: (a) => { const t = a.body.querySelector('.toc'); return a.styleOf('References') === 'Heading 1' && !!t && t.textContent.includes('References'); } },
      ],
    },
    {
      id: 'w10', title: 'Header, Footer & Page Numbers', skills: ['Header', 'Footer', 'Page Number', 'Document Info', 'Header & Footer tab'],
      intro: 'Work with headers, footers, page numbers and the Header & Footer contextual tab.',
      start: '<h1>TinHoc School Newsletter</h1><p>Welcome to the November issue of our school newsletter.</p><h2>Sports Day</h2><p>More than 300 students joined the football, badminton and running events.</p><h2>Reading Week</h2><p>The library lent more than 1,200 books during Reading Week.</p><h2>Science Fair</h2><p>Grade 8 students presented projects about clean energy and recycling.</p>',
      tasks: [
        { text: 'Insert a <b>Blank</b> header and type <b>TinHoc School Newsletter</b> in it.', hint: 'Insert › Header › Blank, then replace [Type here].', check: (a) => /TinHoc School Newsletter/i.test(a.hdr().textContent) && !/\[Type here\]/.test(a.hdr().textContent) },
        { text: 'Insert page numbers at the <b>Bottom of Page</b> using <b>Plain Number 2</b> (centered).', hint: 'Insert › Page Number › Bottom of Page › Plain Number 2.', check: (a) => { const w = a.ftr().querySelector('.pgwrap'); return !!w && w.style.textAlign === 'center' && !!w.querySelector('.pgnum'); } },
        { text: 'Change the page number format to <b>i, ii, iii, …</b>', hint: 'Page Number › Format Page Numbers...', check: (a) => a.WP.PNF.fmt === 'i' },
        { text: 'In the footer, insert the <b>Author</b> field (Document Info).', hint: 'Header & Footer tab › Document Info › Author.', check: (a) => !!a.ftr().querySelector('.fld-author') },
        { text: 'Turn on <b>Different First Page</b>.', hint: 'Header & Footer tab › Options.', check: (a) => a.WP.HFO.first === true },
        { text: '<b>Close Header and Footer</b>.', check: (a) => a.hdr().textContent.trim() !== '' && !document.body.classList.contains('hfedit') },
      ],
    },
    {
      id: 'w11', title: 'Track Changes & Restrict Editing', skills: ['Track Changes', 'Accept/Reject', 'Display for Review', 'Restrict Editing'],
      intro: 'Your teacher Ms. Lan reviewed your club notice. Review her changes, make your own tracked edits and protect the document.',
      start: `<h1>Coding Club Notice</h1><p>The Coding Club meets every Friday afternoon in the computer lab.</p><p>This month we will build a ${tc('Ms. Lan', 'ins')}really </ins>simple game with Scratch. It is an ${tc('Ms. Lan', 'ins')}important </ins>step before the city competition.</p><p>All members get ${tc('Ms. Lan', 'del')}free </del>stickers and a certificate.</p>`,
      tasks: [
        { text: 'Turn on <b>Track Changes</b>.', hint: 'Review › Track Changes (Ctrl+Shift+E).', check: (a) => a.WP.TC.on },
        { text: 'With tracking on, replace <b>Friday</b> with <b>Saturday</b>.', hint: 'Select "Friday" and type "Saturday".', check: (a) => { const c = a.changes(); return c.some((x) => x.type === 'del' && /Friday/.test(x.text)) && c.some((x) => x.type === 'ins' && /Saturday/.test(x.text)); } },
        { text: 'Accept Ms. Lan\'s insertion of <b>important</b>.', hint: 'Click the inserted text, Review › Accept › Accept This Change.', check: (a) => /important step/.test(a.text()) && !a.changes().some((x) => /important/.test(x.text)) },
        { text: 'Reject Ms. Lan\'s insertion of <b>really</b> and her deletion of <b>free</b>.', hint: 'Review › Reject › Reject Change.', check: (a) => !/really/.test(a.text()) && /get free stickers/.test(a.text()) && !a.changes().some((x) => /really|free/.test(x.text)) },
        { text: 'Change <b>Display for Review</b> to <b>Simple Markup</b>.', check: (a) => a.WP.TC.view === 'simple' },
        { text: 'Restrict editing to <b>Tracked changes</b> only, with the password <b>Review1</b>.', hint: 'Review › Restrict Editing › 2. Editing restrictions › Tracked changes › Yes, Start Enforcing Protection.', check: (a) => { const r = a.WP.RESTRICT; return !!r && r.mode === 'tracked' && r.password === 'Review1'; } },
      ],
    },
    {
      id: 'w12', title: 'Compare & Combine Documents', skills: ['Combine', 'Compare', 'Reviewing Pane', 'Accept All', 'Save As'],
      intro: 'Three versions of an essay are saved in Documents: "Essay - Draft", "Essay - Teacher" and "Essay - Friend". Combine and compare them.',
      onStart: () => { putDoc('Essay - Draft.docx', ESSAY.draft); putDoc('Essay - Teacher.docx', ESSAY.teacher); putDoc('Essay - Friend.docx', ESSAY.friend); },
      start: '<p>Use <b>Review › Compare</b> to open the essays saved in the Documents folder.</p>',
      tasks: [
        { text: '<b>Combine</b> the original document <b>Essay - Draft</b> with the revised document <b>Essay - Friend</b>.', hint: 'Review › Compare › Combine...', check: (a) => a.WP.history.some((h) => h.combine && h.original === 'Essay - Draft' && h.revised === 'Essay - Friend') },
        { text: '<b>Compare</b> the original <b>Essay - Draft</b> with the revised <b>Essay - Teacher</b> (show changes in a new document).', hint: 'Review › Compare › Compare...', check: (a) => a.WP.history.some((h) => !h.combine && h.original === 'Essay - Draft' && h.revised === 'Essay - Teacher') },
        { text: 'Open the <b>Reviewing Pane</b> to see the list of revisions.', check: () => !!document.getElementById('revPane') },
        { text: '<b>Accept all changes</b> in the compared document.', check: (a) => { const c = a.WP.compareInfo; return !!c && !c.combine && a.WP.changesList().length === 0 && /grandparents/.test(a.text()); } },
        { text: 'Save the result in <b>Documents</b> as <b>Essay - Final</b> (Word Document).', check: () => saved('Documents', 'Essay - Final.docx') },
      ],
    },
  ];
}
