// Ghép HTML + CSS + JS của học sinh thành một trang xem trước (iframe sandbox, không truy cập được ứng dụng).
// Ghi lại console.log / lỗi và chạy bài kiểm tra ngay trong trang xem trước, gửi kết quả về qua postMessage.
const HOOK = `<script>(function(){var P=function(t,a){try{parent.postMessage({thl:'web',type:t,text:Array.prototype.map.call(a,function(x){try{return typeof x==='object'?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(' ')},'*')}catch(e){}};
['log','info','warn','error'].forEach(function(k){var o=console[k];console[k]=function(){P(k,arguments);o.apply(console,arguments)}});
window.addEventListener('error',function(e){P('error',[e.message+(e.lineno?' (dòng '+e.lineno+')':'')])});})();<\/script>`;
export function buildDoc(files, tests) {
  let html = files['index.html'] || '';
  const css = files['style.css'] || '', js = files['script.js'] || '';
  // bỏ các thẻ link/script trỏ tới style.css, script.js (đã nhúng trực tiếp)
  html = html.replace(/<link[^>]+href=["']style\.css["'][^>]*>/gi, '').replace(/<script[^>]+src=["']script\.js["'][^>]*>\s*<\/script>/gi, '');
  const testScript = tests && tests.length ? `<script>window.addEventListener('load',function(){setTimeout(async function(){var T=${JSON.stringify(tests.map((t) => t.js))},R=[];
for(var i=0;i<T.length;i++){try{var f=new Function('return (async function(){'+T[i]+'})()');var v=await f();R.push(v===true?{ok:true}:{ok:false,msg:typeof v==='string'?v:''})}catch(e){R.push({ok:false,msg:'Lỗi khi kiểm tra: '+e.message})}}
parent.postMessage({thl:'web',type:'tests',results:R},'*')},60)});<\/script>` : '';
  const head = `<meta charset="utf-8">${HOOK}<style>${css}</style>`;
  const tail = `<script>${js.replace(/<\/script/gi, '<\\/script')}<\/script>${testScript}`;
  if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => m + head); else html = head + html;
  if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, tail + '</body>'); else html += tail;
  return '<!DOCTYPE html>' + html.replace(/^\s*<!DOCTYPE[^>]*>/i, '');
}
