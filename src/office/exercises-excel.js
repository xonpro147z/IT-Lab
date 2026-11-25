// Excel practice projects – graded on values, formulas and formatting
function EXCEL_EXERCISES() {
  const rows = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const bold = { b: 1 }, head = { b: 1, al: 'center' };
  const close = (x, y) => typeof x === 'number' && Math.abs(x - y) < 0.001;
  const students = [['Nguyen Van An', 8.5, 7, 9], ['Tran Thi Binh', 6, 7.5, 6.5], ['Le Minh Chau', 9.5, 8, 9], ['Pham Gia Duy', 4.5, 5, 6], ['Hoang Thu Ha', 7, 8.5, 8],
    ['Vu Duc Huy', 5.5, 4, 5], ['Dang Ngoc Lan', 8, 9, 9.5], ['Bui Quang Minh', 6.5, 6, 7], ['Do Phuong Nhi', 9, 8.5, 8.5], ['Ngo Thanh Tung', 3.5, 5, 4.5]];
  const ex1 = { A1: 'SEMESTER 1 GRADES – CLASS 8A', A2: 'No.', B2: 'Student Name', C2: 'Math', D2: 'Literature', E2: 'English', F2: 'Total', G2: 'Average', B13: 'Highest', B14: 'Lowest' };
  students.forEach((s, i) => { const r = i + 3; ex1['A' + r] = String(i + 1); ex1['B' + r] = s[0]; ex1['C' + r] = String(s[1]); ex1['D' + r] = String(s[2]); ex1['E' + r] = String(s[3]); });

  const avg = [8.2, 6.7, 8.8, 5.2, 7.8, 4.8, 8.8, 6.5, 8.7, 4.3];
  const ex2 = { A1: 'END-OF-YEAR ACADEMIC RANKING – CLASS 8A', A2: 'No.', B2: 'Student Name', C2: 'Average', D2: 'Rank', E2: 'Result', G2: 'Rank', H2: 'Students', G3: 'Excellent', G4: 'Good', G5: 'Average', G6: 'Weak' };
  students.forEach((s, i) => { const r = i + 3; ex2['A' + r] = String(i + 1); ex2['B' + r] = s[0]; ex2['C' + r] = String(avg[i]); });
  const rank = (x) => (x >= 8 ? 'Excellent' : x >= 6.5 ? 'Good' : x >= 5 ? 'Average' : 'Weak');

  const goods = [['Notebook', 20, 1.25], ['Ballpoint pen', 15, 0.8], ['Ruler', 10, 1.5], ['Pencil 2B', 12, 0.6], ['Eraser', 8, 0.45], ['Pencil case', 3, 6.5]];
  const ex3 = { A1: 'SALES INVOICE – SCHOOL SUPPLIES STORE', A3: 'Item', B3: 'Quantity', C3: 'Unit Price', D3: 'Amount', A10: 'Subtotal', A11: 'Tax (10%)', A12: 'Total Due' };
  goods.forEach((g, i) => { const r = i + 4; ex3['A' + r] = g[0]; ex3['B' + r] = String(g[1]); ex3['C' + r] = String(g[2]); });
  const sub = goods.reduce((s, g) => s + g[1] * g[2], 0);

  const orders = [['BK', 12], ['NB', 30], ['PN', 25], ['BK', 8], ['CA', 2], ['NB', 15], ['PN', 40]];
  const price = { BK: 12.5, NB: 1.8, PN: 0.9, CA: 18 };
  const ex4 = { A1: 'NOVEMBER SALES REPORT', A3: 'Product Code', B3: 'Quantity', C3: 'Unit Price', D3: 'Amount', F2: 'PRICE LIST', F3: 'Code', G3: 'Price', F4: 'BK', G4: '12.5', F5: 'NB', G5: '1.8', F6: 'PN', G6: '0.9', F7: 'CA', G7: '18', A12: 'Total Revenue', A13: 'Orders with quantity over 10' };
  orders.forEach((o, i) => { const r = i + 4; ex4['A' + r] = o[0]; ex4['B' + r] = String(o[1]); });

  const cls = [['6A', 92], ['6B', 88], ['6C', 95], ['6D', 79], ['6E', 85], ['6F', 90]];
  const ex5 = { A1: 'GRADE 6 CLASS COMPETITION – NOVEMBER', A3: 'No.', B3: 'Class', C3: 'Points', D3: 'Rank', E3: 'Share', B10: 'Total' };
  cls.forEach((c, i) => { const r = i + 4; ex5['A' + r] = String(i + 1); ex5['B' + r] = 'Class ' + c[0]; ex5['C' + r] = String(c[1]); });
  const totCls = cls.reduce((s, c) => s + c[1], 0);

  const books = [['7A', 45], ['7B', 62], ['7C', 38], ['7D', 71], ['7E', 54], ['7F', 49]];
  const ex6 = { A1: 'BOOKS READ THIS MONTH – GRADE 7', A3: 'Class', B3: 'Books', A11: 'Total', A12: 'Average' };
  books.forEach((b, i) => { ex6['A' + (i + 4)] = b[0]; ex6['B' + (i + 4)] = String(b[1]); });

  const allBorders = (a, rng) => a.range(rng).every((x) => { const s = a.style(x); return s.bt && s.bb && s.bl && s.br; });
  const money = (a, x) => ['currency', 'accounting'].includes(a.style(x).fmt);

  return [
    {
      id: 'x1', title: 'Semester Grades', intro: 'Use SUM, AVERAGE, MAX and MIN; format decimals; merge the title.',
      start: { cells: ex1, styles: { 'A2:G2': head }, colW: { B: 150 } },
      tasks: [
        { text: 'In the <b>Total</b> column (F3:F12), enter a formula that adds each student\'s three scores.', hint: 'Type =SUM(C3:E3) in F3, then drag the fill handle down to F12.',
          check: (a) => rows(3, 12).every((r) => a.isF('F' + r) && a.near(a.val('F' + r), students[r - 3][1] + students[r - 3][2] + students[r - 3][3])) },
        { text: 'In the <b>Average</b> column (G3:G12), use the <b>AVERAGE</b> function to calculate each student\'s average score.',
          check: (a) => rows(3, 12).every((r) => a.formula('G' + r).includes('AVERAGE') && a.near(a.val('G' + r), (students[r - 3][1] + students[r - 3][2] + students[r - 3][3]) / 3)) },
        { text: 'In the <b>Highest</b> row (C13:E13) use the MAX function, and in the <b>Lowest</b> row (C14:E14) use the MIN function for each subject.',
          check: (a) => ['C', 'D', 'E'].every((c, k) => a.formula(c + '13').includes('MAX') && a.formula(c + '14').includes('MIN') && a.val(c + '13') === Math.max(...students.map((s) => s[k + 1])) && a.val(c + '14') === Math.min(...students.map((s) => s[k + 1]))) },
        { text: 'Format the <b>Average</b> column (G3:G12) to display <b>one decimal place</b>.', hint: 'Select G3:G12, then use Increase Decimal / Decrease Decimal.',
          check: (a) => a.range('G3:G12').every((x) => a.style(x).dec === 1) },
        { text: 'Apply a <b>fill color</b> (any color) to the header row A2:G2.', check: (a) => a.range('A2:G2').every((x) => a.style(x).fill) },
        { text: '<b>Merge &amp; Center</b> the title across A1:G1, then make it <b>Bold</b> and <b>16 pt</b>.', check: (a) => a.merged('A1:G1') && a.style('A1').b && a.style('A1').size === 16 },
      ],
    },
    {
      id: 'x2', title: 'Academic Ranking', intro: 'Use nested IF, COUNTIF and conditional formatting.',
      start: { cells: ex2, styles: { 'A2:E2': head, 'G2:H2': head }, colW: { B: 150, D: 90, E: 90 } },
      tasks: [
        { text: 'In the <b>Rank</b> column (D3:D12), use the <b>IF</b> function: 8 or higher is "Excellent", 6.5 or higher is "Good", 5 or higher is "Average", otherwise "Weak".',
          hint: '=IF(C3>=8,"Excellent",IF(C3>=6.5,"Good",IF(C3>=5,"Average","Weak")))',
          check: (a) => rows(3, 12).every((r) => a.formula('D' + r).includes('IF') && String(a.val('D' + r)).toLowerCase() === rank(avg[r - 3]).toLowerCase()) },
        { text: 'In the <b>Result</b> column (E3:E12), display "Pass" if the Average is 5 or higher; otherwise display "Fail".',
          check: (a) => rows(3, 12).every((r) => a.formula('E' + r).includes('IF') && String(a.val('E' + r)).toLowerCase() === (avg[r - 3] >= 5 ? 'pass' : 'fail')) },
        { text: 'In H3:H6, use the <b>COUNTIF</b> function to count the students for each rank listed in column G.', hint: '=COUNTIF($D$3:$D$12,G3)',
          check: (a) => ['Excellent', 'Good', 'Average', 'Weak'].every((l, i) => a.formula('H' + (i + 3)).includes('COUNTIF') && a.val('H' + (i + 3)) === avg.filter((x) => rank(x) === l).length) },
        { text: 'Use <b>Conditional Formatting</b> to highlight the Average cells (C3:C12) that are <b>Less Than 5</b>.', hint: 'Select C3:C12 > Conditional Formatting > Less Than... > 5.',
          check: (a) => a.S.cond.some((k) => k.op === 'lt' && Number(k.v1) === 5 && k.c1 <= 2 && k.c2 >= 2 && k.r1 <= 2 && k.r2 >= 11) },
        { text: '<b>Merge &amp; Center</b> the title across A1:E1.', check: (a) => a.merged('A1:E1') },
      ],
    },
    {
      id: 'x3', title: 'Sales Invoice', intro: 'Calculate amounts, subtotal and tax; apply currency format and borders.',
      start: { cells: ex3, styles: { 'A3:D3': head, 'A10:A12': bold }, colW: { A: 130, C: 90, D: 100 } },
      tasks: [
        { text: 'In the <b>Amount</b> column (D4:D9), multiply Quantity by Unit Price.', check: (a) => rows(4, 9).every((r) => a.isF('D' + r) && close(a.val('D' + r), goods[r - 4][1] * goods[r - 4][2])) },
        { text: 'In cell <b>D10</b>, use the SUM function to calculate the Subtotal.', check: (a) => a.formula('D10').includes('SUM') && close(a.val('D10'), sub) },
        { text: 'In cell <b>D11</b>, calculate the Tax as 10% of the Subtotal.', check: (a) => a.isF('D11') && close(a.val('D11'), sub * 0.1) },
        { text: 'In cell <b>D12</b>, calculate the Total Due (Subtotal + Tax).', check: (a) => a.isF('D12') && close(a.val('D12'), sub * 1.1) },
        { text: 'Apply the <b>Currency</b> or <b>Accounting</b> number format to C4:C9 and D4:D12.', check: (a) => [...a.range('C4:C9'), ...a.range('D4:D12')].every((x) => money(a, x)) },
        { text: 'Apply <b>All Borders</b> to the range A3:D12.', check: (a) => allBorders(a, 'A3:D12') },
      ],
    },
    {
      id: 'x4', title: 'Price Lookup (VLOOKUP)', intro: 'Use VLOOKUP with absolute references, and COUNTIF.',
      start: { cells: ex4, styles: { 'A3:D3': head, 'F3:G3': head, F2: bold }, colW: { A: 100, C: 80, D: 90 } },
      tasks: [
        { text: 'In the <b>Unit Price</b> column (C4:C10), use the <b>VLOOKUP</b> function to look up the price of each Product Code in the PRICE LIST (F4:G7).', hint: '=VLOOKUP(A4,$F$4:$G$7,2,FALSE) – use absolute references for the price list.',
          check: (a) => rows(4, 10).every((r) => a.formula('C' + r).includes('VLOOKUP') && close(a.val('C' + r), price[orders[r - 4][0]])) },
        { text: 'In the <b>Amount</b> column (D4:D10), multiply Quantity by Unit Price.', check: (a) => rows(4, 10).every((r) => a.isF('D' + r) && close(a.val('D' + r), orders[r - 4][1] * price[orders[r - 4][0]])) },
        { text: 'In cell <b>D12</b>, calculate the Total Revenue.', check: (a) => a.isF('D12') && close(a.val('D12'), orders.reduce((s, o) => s + o[1] * price[o[0]], 0)) },
        { text: 'In cell <b>D13</b>, use the <b>COUNTIF</b> function to count the orders with a quantity greater than 10.', hint: '=COUNTIF(B4:B10,">10")', check: (a) => a.formula('D13').includes('COUNTIF') && a.val('D13') === orders.filter((o) => o[1] > 10).length },
        { text: 'Apply the <b>Currency</b> or <b>Accounting</b> number format to D4:D10 and D12.', check: (a) => a.range('D4:D10').concat(['D12']).every((x) => money(a, x)) },
      ],
    },
    {
      id: 'x5', title: 'Class Competition', intro: 'Absolute references, percentage format, RANK, borders and column width.',
      start: { cells: ex5, styles: { 'A3:E3': head, B10: bold } },
      tasks: [
        { text: 'In cell <b>C10</b>, calculate the total points of all classes.', check: (a) => a.isF('C10') && a.val('C10') === totCls },
        { text: 'In the <b>Share</b> column (E4:E9), divide each class\'s points by the Total in C10. Use the absolute reference <b>$C$10</b> so you can fill the formula down.', check: (a) => rows(4, 9).every((r) => a.isF('E' + r) && a.near(a.val('E' + r), cls[r - 4][1] / totCls, 1e-6)) },
        { text: 'Apply the <b>Percentage</b> format to E4:E9.', check: (a) => a.range('E4:E9').every((x) => a.style(x).fmt === 'percent') },
        { text: 'In the <b>Rank</b> column (D4:D9), use the <b>RANK</b> function so that the class with the most points is ranked 1.', hint: '=RANK(C4,$C$4:$C$9)',
          check: (a) => rows(4, 9).every((r) => a.formula('D' + r).includes('RANK') && a.val('D' + r) === 1 + cls.filter((c) => c[1] > cls[r - 4][1]).length) },
        { text: 'Merge &amp; Center A1:E1, and apply <b>All Borders</b> to A3:E10.', check: (a) => a.merged('A1:E1') && allBorders(a, 'A3:E10') },
        { text: 'Increase the width of <b>column B</b> to at least 110 pixels.', hint: 'Drag the right border of the column B header, or Format > Column Width.', check: (a) => a.colW('B') >= 110 },
      ],
    },
    {
      id: 'x6', title: 'Sort and Chart', intro: 'Calculate totals, sort data, create a column chart and use cell styles.',
      start: { cells: ex6, styles: { 'A3:B3': head, 'A11:A12': bold } },
      tasks: [
        { text: 'In cell <b>B11</b>, calculate the total number of books. In cell <b>B12</b>, calculate the average number of books per class.', check: (a) => a.formula('B11').includes('SUM') && a.formula('B12').includes('AVERAGE') && a.val('B11') === 319 && a.near(a.val('B12'), 319 / 6) },
        { text: '<b>Sort</b> the data in A3:B9 by Books from <b>largest to smallest</b>.', hint: 'Select A3:B9 with the active cell in column B, then Data > Sort Z to A.',
          check: (a) => { const v = rows(4, 9).map((r) => a.val('B' + r)); return v.every((x, i) => i === 0 || x <= v[i - 1]) && a.val('A4') === '7D' && a.val('A9') === '7C'; } },
        { text: 'Insert a <b>Clustered Column</b> chart that shows the books for each class (A3:B9).', check: (a) => a.S.charts.some((c) => c.type === 'column' && c.c2 >= 1 && c.r2 >= 8 && c.r2 <= 9) },
        { text: 'Change the chart title to <b>"Books Read"</b> and display <b>Data Labels</b>.', hint: 'Select the chart > Chart Design > Chart Title / Data Labels.', check: (a) => a.S.charts.some((c) => /books read/i.test(c.title || '') && c.labels) },
        { text: 'Apply the <b>Title</b> cell style to cell A1.', hint: 'Home > Cell Styles > Title.', check: (a) => a.style('A1').cs === 'Title' },
      ],
    },
  ];
}
