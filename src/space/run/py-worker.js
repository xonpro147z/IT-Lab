// TinHocLab Space – chạy Python (Pyodide) trong Web Worker để không treo giao diện và dừng được bất cứ lúc nào.
// Nhận: { id, code, stdin, turtle }  →  gửi lại: { id, type: 'out'|'err'|'done'|'ready'|'turtle', ... }
importScripts('../../vendor/pyodide/pyodide.js');
let py = null;
const ready = (async () => {
  py = await loadPyodide({ indexURL: '../../vendor/pyodide/', stdout: () => {}, stderr: () => {} });
  postMessage({ type: 'ready' });
})();

// Mô phỏng thư viện turtle tối giản: ghi lại các nét vẽ để trang vẽ lên canvas
const TURTLE = `
import sys, math
class _Screen:
    def __init__(self): self.bg = 'white'
    def bgcolor(self, c=None):
        if c is not None: self.bg = c; _emit(['bg', c])
        return self.bg
    def setup(self, *a, **k): pass
    def title(self, *a): pass
    def tracer(self, *a, **k): pass
    def update(self): pass
    def exitonclick(self): pass
    def mainloop(self): pass
    def done(self): pass
_ops = []
def _emit(op): _ops.append(op)
class Turtle:
    def __init__(self):
        self.x = 0.0; self.y = 0.0; self.h = 0.0; self.down = True; self.col = 'black'; self.fill = 'black'; self.w = 2; self.vis = True; self._poly = None
        _emit(['new', id(self)])
    def _line(self, x2, y2):
        if self.down: _emit(['line', self.x, self.y, x2, y2, self.col, self.w])
        if self._poly is not None: self._poly.append((x2, y2))
        self.x, self.y = x2, y2
    def forward(self, d): r = math.radians(self.h); self._line(self.x + d*math.cos(r), self.y + d*math.sin(r))
    def backward(self, d): self.forward(-d)
    def right(self, a): self.h -= a
    def left(self, a): self.h += a
    def goto(self, x, y=None):
        if y is None: x, y = x
        self._line(float(x), float(y))
    def setposition(self, x, y=None): self.goto(x, y)
    setpos = setposition
    def setx(self, x): self.goto(x, self.y)
    def sety(self, y): self.goto(self.x, y)
    def setheading(self, a): self.h = a
    def home(self): self.goto(0, 0); self.h = 0
    def penup(self): self.down = False
    def pendown(self): self.down = True
    def pensize(self, w=None):
        if w is not None: self.w = w
        return self.w
    width = pensize
    def color(self, *c):
        if len(c) == 1: self.col = self.fill = c[0]
        elif len(c) >= 2: self.col, self.fill = c[0], c[1]
    def pencolor(self, c): self.col = c
    def fillcolor(self, c): self.fill = c
    def begin_fill(self): self._poly = [(self.x, self.y)]
    def end_fill(self):
        if self._poly and len(self._poly) > 2: _emit(['fill', self._poly, self.fill])
        self._poly = None
    def circle(self, r, extent=360, steps=None):
        n = steps or max(12, int(abs(r) / 2) + 12); n = int(n * abs(extent) / 360) or 1
        a = extent / n; L = 2 * r * math.sin(math.radians(a / 2))
        self.left(a / 2)
        for _ in range(n): self.forward(L); self.left(a)
        self.left(-a / 2)
    def dot(self, size=None, c=None): _emit(['dot', self.x, self.y, size or max(self.w + 4, 2 * self.w), c or self.col])
    def write(self, text, move=False, align='left', font=None): _emit(['text', self.x, self.y, str(text), self.col, align])
    def speed(self, *a): pass
    def shape(self, *a): pass
    def hideturtle(self): self.vis = False
    ht = hideturtle
    def showturtle(self): self.vis = True
    st = showturtle
    def position(self): return (self.x, self.y)
    pos = position
    def xcor(self): return self.x
    def ycor(self): return self.y
    def heading(self): return self.h
    def distance(self, x, y=None):
        if y is None: x, y = x
        return math.hypot(self.x - x, self.y - y)
    fd = forward; bk = back = backward; rt = right; lt = left; pu = up = penup; pd = down = pendown
_screen = _Screen()
_default = None
def _t():
    global _default
    if _default is None: _default = Turtle()
    return _default
def Screen(): return _screen
def done(): pass
mainloop = exitonclick = done
def bgcolor(c=None): return _screen.bgcolor(c)
import types as _types
_mod = _types.ModuleType('turtle')
for _n in ['forward','fd','backward','bk','back','right','rt','left','lt','goto','setposition','setpos','setx','sety','setheading','home','penup','pu','up','pendown','pd','down','pensize','width','color','pencolor','fillcolor','begin_fill','end_fill','circle','dot','write','speed','shape','hideturtle','ht','showturtle','st','position','pos','xcor','ycor','heading','distance']:
    setattr(_mod, _n, (lambda name: (lambda *a, **k: getattr(_t(), name)(*a, **k)))(_n))
_mod.Turtle = Turtle; _mod.Screen = Screen; _mod.done = done; _mod.mainloop = done; _mod.exitonclick = done; _mod.bgcolor = bgcolor; _mod._ops = _ops
sys.modules['turtle'] = _mod
`;

onmessage = async (e) => {
  const { id, code, stdin } = e.data;
  try { await ready; } catch (er) { postMessage({ id, type: 'done', ok: false, error: 'Không khởi động được Python: ' + er.message }); return; }
  const lines = String(stdin || '').replace(/\r\n/g, '\n').split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  let li = 0, outBytes = 0, stopped = false;
  const emit = (type, text) => { if (stopped) return; outBytes += text.length; if (outBytes > 200000) { stopped = true; postMessage({ id, type: 'err', text: '\n[Dừng: chương trình in ra quá nhiều]\n' }); return; } postMessage({ id, type, text }); };
  py.setStdout({ write: (b) => { emit('out', new TextDecoder().decode(b)); return b.length; } });
  py.setStderr({ write: (b) => { emit('err', new TextDecoder().decode(b)); return b.length; } });
  py.setStdin({ stdin: () => (li < lines.length ? lines[li++] : undefined), autoEOF: true });
  const t0 = performance.now();
  try {
    py.runPython(TURTLE + '\n_ops.clear()\n');
    // mỗi lần chạy dùng một không gian tên mới
    const ns = py.toPy({ __name__: '__main__' });
    await py.runPythonAsync(code, { globals: ns, filename: 'main.py' });
    const ops = py.runPython('import json; json.dumps(sys.modules["turtle"]._ops)');
    if (ops && ops !== '[]') postMessage({ id, type: 'turtle', ops: JSON.parse(ops) });
    ns.destroy();
    postMessage({ id, type: 'done', ok: true, ms: Math.round(performance.now() - t0) });
  } catch (er) {
    postMessage({ id, type: 'done', ok: false, error: cleanTrace(String(er.message || er)), ms: Math.round(performance.now() - t0) });
  }
};
// bỏ các dòng nội bộ của Pyodide khỏi thông báo lỗi
function cleanTrace(s) {
  const L = s.split('\n');
  const i = L.findIndex((l) => l.includes('File "main.py"'));
  return (i >= 0 ? ['Traceback (most recent call last):', ...L.slice(i)] : L.filter((l) => !/_pyodide|pyodide\/|<exec>/.test(l))).join('\n').trim();
}
