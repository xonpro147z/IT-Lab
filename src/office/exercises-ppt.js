// PowerPoint practice projects – auto-graded
function PPT_EXERCISES(makeSlide) {
  const pres = (slides, theme = 'office') => ({ theme, slides });
  const isRed = (c) => c && c[0] > 170 && c[1] < 90 && c[2] < 90;
  const isYellow = (c) => c && c[0] > 200 && c[1] > 180 && c[2] < 120;
  return [
    {
      id: 'p1', title: 'About Me', intro: 'Create a title slide, add new slides, enter bulleted text and apply a theme.',
      start: () => pres([makeSlide('title')]),
      tasks: [
        { text: 'On slide 1, enter the title <b>"About Me"</b> and type <b>your full name</b> in the subtitle placeholder.', hint: 'Click the "Click to add title" placeholder and type.',
          check: (a) => /about me/i.test(a.title(0)) && a.els(0, (e) => e.ph === 'subtitle').some((e) => a.text(e).length >= 3) },
        { text: 'Add a <b>new slide</b> that uses the <b>Title and Content</b> layout.', check: (a) => a.P.slides.length >= 2 && a.P.slides[1].layout === 'titleContent' },
        { text: 'On slide 2, enter the title <b>"My Hobbies"</b> and list <b>at least three</b> hobbies in the content placeholder.',
          check: (a) => /my hobbies/i.test(a.title(1)) && a.els(1, (e) => e.ph === 'body').some((e) => a.lines(e).length >= 3) },
        { text: 'Add slide 3 with the title <b>"My Dream"</b>.', check: (a) => a.P.slides.length >= 3 && /my dream/i.test(a.title(2)) },
        { text: 'Apply any <b>theme</b> other than the default Office theme.', hint: 'Design > Themes.', check: (a) => a.P.theme !== 'office' },
      ],
    },
    {
      id: 'p2', title: 'Our School', intro: 'Insert pictures, shapes and text boxes; format text.',
      start: () => pres([makeSlide('title', { title: 'Our School', subtitle: 'Presented by Group 2' }), makeSlide('titleContent', { title: 'Special Classrooms', body: 'Computer lab\nScience laboratory\nLibrary' })]),
      tasks: [
        { text: 'On slide 1, insert <b>a picture</b> (you can use the "School" stock image).', check: (a) => a.els(0, (e) => e.type === 'image').length > 0 },
        { text: 'On slide 1, change the title font color to <b>Red</b> and make it <b>Bold</b>.', hint: 'Click the title placeholder border to select it, then click Bold and Font Color.',
          check: (a) => a.els(0, (e) => e.ph === 'title').some((e) => (isRed(a.rgb(e.st.color)) && e.st.bold) || (/color:\s*rgb\((2[0-9]{2}|1[89]\d), ?\d{1,2}, ?\d{1,2}\)/.test(e.html) && /bold|<b>/.test(e.html))) },
        { text: 'On slide 2, insert any <b>shape</b> and type <b>"Computer Lab"</b> inside it.', hint: 'Insert > Shapes. Double-click the shape to type.',
          check: (a) => a.els(1, (e) => e.type === 'shape').some((e) => /computer lab/i.test(a.text(e))) },
        { text: 'Change the <b>Shape Fill</b> of the shape on slide 2 to a different color.', check: (a) => a.els(1, (e) => e.type === 'shape').some((e) => e.st.fill && e.st.fill !== 'transparent') },
        { text: 'On slide 2, insert a <b>text box</b> that contains <b>"Welcome, everyone!"</b>.', check: (a) => a.els(1, (e) => e.type === 'text' && !e.ph).some((e) => /welcome, everyone/i.test(a.text(e))) },
      ],
    },
    {
      id: 'p3', title: 'Life Cycle of a Butterfly', intro: 'Apply slide transitions and object animations, then run the slide show.',
      start: () => pres([makeSlide('title', { title: 'Life Cycle of a Butterfly', subtitle: 'Natural Science – Grade 6' }), makeSlide('titleContent', { title: 'Stage 1: Egg', body: 'The female lays eggs on a leaf\nThe eggs hatch after a few days' }), makeSlide('titleContent', { title: 'Stage 2: Caterpillar', body: 'The caterpillar eats leaves to grow\nIt sheds its skin several times' }), makeSlide('titleContent', { title: 'Stages 3 and 4: Pupa and Butterfly', body: 'The caterpillar forms a chrysalis\nThe butterfly comes out of the chrysalis' })], 'green'),
      tasks: [
        { text: 'Apply the <b>Fade</b> transition to slide 1.', check: (a) => a.P.slides[0].transition === 'fade' },
        { text: 'Apply a transition (any) to <b>all</b> slides in the presentation.', hint: 'Transitions > choose a transition > Apply To All.', check: (a) => a.P.slides.every((s) => s.transition !== 'none') },
        { text: 'On slide 2, apply the <b>Fly In</b> animation to the title.', hint: 'Select the title placeholder > Animations > Fly In.', check: (a) => a.els(1, (e) => e.ph === 'title').some((e) => e.anim === 'fly') },
        { text: 'On slide 3, apply the <b>Zoom</b> animation to the content placeholder.', check: (a) => a.els(2, (e) => e.ph === 'body').some((e) => e.anim === 'zoom') },
        { text: 'Start the <b>slide show</b> from the beginning (F5).', check: (a) => a.played },
      ],
    },
    {
      id: 'p4', title: 'The Solar System', intro: 'Delete, reorder and duplicate slides; change layouts and add speaker notes.',
      start: () => pres([makeSlide('title', { title: 'The Solar System', subtitle: 'The planets closest to the Sun' }), makeSlide('titleContent', { title: 'Earth', body: 'The third planet from the Sun\nHas liquid water on its surface' }), makeSlide('titleContent', { title: 'Mercury', body: 'The smallest planet\nThe closest planet to the Sun' }), makeSlide('titleContent', { title: 'Venus', body: 'The hottest planet\nThe brightest object in the night sky after the Moon' }), makeSlide('titleOnly', { title: 'DRAFT – DELETE THIS SLIDE' })], 'dark'),
      tasks: [
        { text: '<b>Delete</b> the slide titled "DRAFT – DELETE THIS SLIDE".', check: (a) => a.findSlide(/draft/i) < 0 },
        { text: '<b>Reorder</b> the slides so they appear in this order: The Solar System, Mercury, Venus, Earth.', hint: 'Drag the thumbnails, or right-click a thumbnail > Move Up / Move Down.',
          check: (a) => { const i = [/solar system/i, /mercury/i, /venus/i, /earth/i].map((r) => a.findSlide(r)); return i.every((x) => x >= 0) && i[0] < i[1] && i[1] < i[2] && i[2] < i[3]; } },
        { text: 'Add the speaker note <b>"Earth is the only planet known to support life."</b> to the "Earth" slide.', hint: 'Type in the Notes pane below the slide.',
          check: (a) => { const i = a.findSlide(/earth/i); return i >= 0 && /support life/i.test(a.P.slides[i].notes || ''); } },
        { text: 'Change the layout of the "Venus" slide to <b>Two Content</b>.', check: (a) => { const i = a.findSlide(/venus/i); return i >= 0 && a.P.slides[i].layout === 'twoContent'; } },
        { text: '<b>Duplicate</b> the "The Solar System" slide, move the copy to the <b>end</b> of the presentation, and change its title to <b>"Thank You"</b>.',
          check: (a) => { const n = a.P.slides.length; return /thank you/i.test(a.title(n - 1)) && a.P.slides[n - 1].layout === 'title'; } },
      ],
    },
    {
      id: 'p5', title: 'Internet Safety', intro: 'Format slide backgrounds, font size and color, and insert shapes.',
      start: () => pres([makeSlide('title', { title: 'Staying Safe on the Internet', subtitle: 'Computer Science – Grade 7' }), makeSlide('titleContent', { title: 'Protect Your Personal Information', body: 'Never share your password\nDo not post your home address online\nBe careful with strangers' }), makeSlide('titleContent', { title: 'Strong Passwords', body: 'At least 8 characters long\nMix uppercase, lowercase, numbers and symbols' })]),
      tasks: [
        { text: 'Change the <b>background</b> of slide 1 (any solid or gradient fill).', hint: 'Design > Format Background.', check: (a) => !!a.P.slides[0].bg },
        { text: 'Apply that background to <b>all</b> slides.', check: (a) => !!a.P.slides[0].bg && a.P.slides.every((s) => s.bg === a.P.slides[0].bg) },
        { text: 'Change the font size of the slide 1 title to <b>54 pt</b>.', check: (a) => a.els(0, (e) => e.ph === 'title').some((e) => e.st.fontSize === 54) },
        { text: 'Change the font color of the slide 3 title to <b>Yellow</b>.', check: (a) => a.els(2, (e) => e.ph === 'title').some((e) => isYellow(a.rgb(e.st.color))) },
        { text: 'On slide 3, insert a <b>Star: 5 Points</b> shape.', check: (a) => a.els(2, (e) => e.type === 'shape' && e.shape === 'star').length > 0 },
      ],
    },
  ];
}
