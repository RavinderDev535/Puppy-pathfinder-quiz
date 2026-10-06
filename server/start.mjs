import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createQuizApi} from './quiz-api.mjs';
const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const api=createQuizApi();
http.createServer(async(req,res)=>{
  if(await api(req,res))return;
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}
  catch{res.writeHead(400);res.end('Invalid path');return;}
  const file=path.resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.svg':'image/svg+xml','.ico':'image/x-icon'};
  try{const content=await readFile(file);res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(content);}
  catch{if(path.extname(pathname)){res.writeHead(404);res.end();}else{res.setHeader('Content-Type','text/html');res.end(await readFile(path.join(root,'index.html')));}}
}).listen(Number(process.env.PORT||8080),process.env.HOST||'0.0.0.0',()=>console.log('Quiz app running on port '+(process.env.PORT||8080)));
