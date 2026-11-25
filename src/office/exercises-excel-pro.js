// Excel practice projects (part 2): worksheets, protection, macros, File tab
function EXCEL_EXERCISES_PRO() {
  const F = () => (typeof Office !== 'undefined' ? Office.FILE : {});
  const saved = (folder, name) => (F().saves || []).some((s) => s.folder === folder && s.name.toLowerCase() === name.toLowerCase());
  const grades = { cells: { A1: { raw: 'Class 8A – Term Scores', s: { b: 1, size: 14 } }, A2: 'Student', B2: 'Class', C2: 'Math', D2: 'Literature', E2: 'English', A3: 'Nguyen An', B3: '8A', C3: '8', D3: '7', E3: '9', A4: 'Tran Binh', B4: '8A', C4: '6.5', D4: '8', E4: '7', A5: 'Le Chi', B5: '8A', C5: '9', D5: '9', E5: '8.5', A6: 'Pham Dung', B6: '8A', C6: '7', D6: '6', E6: '8', A7: 'Hoang Giang', B7: '8A', C7: '10', D7: '8', E7: '9' }, styles: { 'A2:E2': { b: 1, fill: '#d9e1f2' } }, colW: { A: 120 } };
  const week = (n) => ({ cells: { A1: `Week ${n}`, B1: 'Monday', C1: 'Tuesday', D1: 'Wednesday', A2: 'Period 1', B2: 'Math', C2: 'English', D2: 'Science', A3: 'Period 2', B3: 'Literature', C3: 'Computer', D3: 'History' } });
  return [
    {
      id: 'x7', title: 'Worksheets & Protection', skills: ['Rename sheet', 'Tab color', 'Insert/Delete/Move sheet', 'Protect Sheet', 'Protect Workbook'],
      intro: 'Organize the worksheets of a grade book and protect it from accidental changes.',
      start: { sheets: [{ name: 'Sheet1', start: grades }, { name: 'Sheet2', start: null }, { name: 'Sheet3', start: null }] },
      tasks: [
        { text: 'Rename <b>Sheet1</b> to <b>Term 1</b>.', hint: 'Double-click the sheet tab, type the new name and press Enter.', check: (a) => a.sheets().some((s) => s.name === 'Term 1') },
        { text: 'Rename <b>Sheet2</b> to <b>Term 2</b> and change its tab color to <b>Green</b>.', hint: 'Right-click the tab › Tab Color › Standard Colors › Green.', check: (a) => { const s = a.sheet('Term 2'); return !!s && /^#00b050$|^#70ad47$|^#92d050$|^#548235$/i.test(s.color || ''); } },
        { text: 'Delete <b>Sheet3</b>.', check: (a) => !a.sheets().some((s) => s.name === 'Sheet3') },
        { text: 'Insert a new worksheet named <b>Summary</b> and move it so it is the <b>first</b> sheet.', hint: 'Click ⊕, rename it, then right-click › Move or Copy... › Before sheet: Term 1.', check: (a) => a.sheets()[0] && a.sheets()[0].name === 'Summary' },
        { text: 'On <b>Term 1</b>, unlock the score cells <b>C3:E7</b>, then <b>protect the sheet</b> with the password <b>8A2026</b>.', hint: 'Select C3:E7 › Home › Format › Lock Cell (turn off). Then Review › Protect Sheet.', check: (a) => { const s = a.sheet('Term 1'); if (!s || !s.prot || s.prot.password !== '8A2026') return false; return ['C3', 'D5', 'E7'].every((x) => s.data.cells[x] && s.data.cells[x].s && s.data.cells[x].s.unl) && !(s.data.cells.A3.s || {}).unl; } },
        { text: '<b>Protect the workbook structure</b> with the password <b>Book2026</b>.', hint: 'Review › Protect Workbook.', check: (a) => !!a.XP.BK.wbProt && a.XP.BK.wbProt.password === 'Book2026' },
        { text: 'Save the workbook in <b>Documents</b> as <b>Class 8A Grades</b> (Excel Workbook *.xlsx).', check: () => saved('Documents', 'Class 8A Grades.xlsx') },
      ],
    },
    {
      id: 'x8', title: 'Recording & Running Macros', skills: ['Developer tab', 'Record Macro', 'Run Macro', 'Visual Basic', 'Save as .xlsm'],
      intro: 'Record a macro that formats a timetable header and run it on another week.',
      start: { sheets: [{ name: 'Week 1', start: week(1) }, { name: 'Week 2', start: week(2) }] },
      tasks: [
        { text: 'Show the <b>Developer</b> tab on the ribbon.', hint: 'File › Options › Customize Ribbon › tick Developer.', check: () => { const b = document.querySelector('#tabs button[data-tab=developer]'); return !!b && !b.hidden; } },
        { text: 'On <b>Week 1</b>, select <b>A1:D1</b>, then record a macro named <b>HeaderStyle</b> with shortcut key <b>Ctrl+q</b> that makes the cells <b>Bold</b> and fills them <b>Yellow</b>. Stop recording.', hint: 'Developer › Record Macro (or View › Macros). Do Bold + Fill Color › Yellow, then Stop Recording.', check: (a) => { const m = a.XP.BK.macros.find((x) => x.name === 'HeaderStyle'); if (!m || m.key !== 'q') return false; const p = m.steps.flatMap((s) => s.cells.map((c) => c[2])); return p.some((x) => x && x.b) && p.some((x) => x && /^#ffff00$/i.test(x.fill || '')); } },
        { text: 'Switch to <b>Week 2</b> and <b>run</b> the macro <b>HeaderStyle</b>.', hint: 'Developer › Macros (Alt+F8) › Run, or press Ctrl+q.', check: (a) => { const c = a.cellOn('Week 2', 'B1'); return !!c && c.s && c.s.b && /^#ffff00$/i.test(c.s.fill || ''); } },
        { text: 'Open the <b>Visual Basic</b> editor to view the macro code.', hint: 'Developer › Visual Basic (Alt+F11), or Macros › Edit.', check: (a) => !!a.XP.FLAGS.vba },
        { text: 'Save the workbook in <b>Documents</b> as <b>Timetable Macro</b> in the <b>Excel Macro-Enabled Workbook (*.xlsm)</b> format.', check: () => saved('Documents', 'Timetable Macro.xlsm') },
      ],
    },
  ];
}
